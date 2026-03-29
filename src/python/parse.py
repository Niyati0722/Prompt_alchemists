import cv2
import numpy as np
import json
import sys

image_path = sys.argv[1]
image = cv2.imread(image_path)
image = cv2.resize(image, None, fx=2, fy=2)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# threshold - walls are dark/black
_, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)

# remove thin lines (windows, door arcs, text)
# walls are thick (8-15px), windows/doors are thin (1-3px)
# erode removes thin lines, dilate restores thick ones
kernel_small = np.ones((3,3), np.uint8)
kernel_wall = np.ones((6,6), np.uint8)

# erode removes anything thinner than kernel
eroded = cv2.erode(binary, kernel_wall, iterations=1)
# dilate restores what remains
walls_only = cv2.dilate(eroded, kernel_wall, iterations=1)

# now detect lines on cleaned image
edges = cv2.Canny(walls_only, 50, 150)

lines = cv2.HoughLinesP(
    edges,
    rho=1,
    theta=np.pi/180,
    threshold=50,
    minLineLength=40,
    maxLineGap=30
)

def are_similar(l1, l2, tolerance=15):
    return (abs(l1['x1'] - l2['x1']) < tolerance and
            abs(l1['y1'] - l2['y1']) < tolerance and
            abs(l1['x2'] - l2['x2']) < tolerance and
            abs(l1['y2'] - l2['y2']) < tolerance)

def is_horizontal(x1, y1, x2, y2):
    return abs(y2 - y1) < 15

def is_vertical(x1, y1, x2, y2):
    return abs(x2 - x1) < 15

result = []
if lines is not None:
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = ((x2-x1)**2 + (y2-y1)**2) ** 0.5

        if length > 40 and (is_horizontal(x1,y1,x2,y2) or
                            is_vertical(x1,y1,x2,y2)):
            if is_horizontal(x1,y1,x2,y2):
                avg_y = (y1 + y2) // 2
                y1 = y2 = avg_y
            else:
                avg_x = (x1 + x2) // 2
                x1 = x2 = avg_x

            new_line = {
                "x1": int(x1), "y1": int(y1),
                "x2": int(x2), "y2": int(y2)
            }

            is_duplicate = False
            for existing in result:
                if are_similar(new_line, existing):
                    is_duplicate = True
                    break

            if not is_duplicate:
                result.append(new_line)

# divide by 2
result = [{
    "x1": l["x1"]//2, "y1": l["y1"]//2,
    "x2": l["x2"]//2, "y2": l["y2"]//2
} for l in result]

# find boundary
all_x = [l["x1"] for l in result] + [l["x2"] for l in result]
all_y = [l["y1"] for l in result] + [l["y2"] for l in result]
min_x = min(all_x)
max_x = max(all_x)
min_y = min(all_y)
max_y = max(all_y)

def get_length(l):
    return ((l["x2"]-l["x1"])**2 + (l["y2"]-l["y1"])**2) ** 0.5

def is_horizontal_line(l):
    return abs(l["y2"] - l["y1"]) < 15

def is_vertical_line(l):
    return abs(l["x2"] - l["x1"]) < 15

def should_keep(l):
    length = get_length(l)

    # remove lines outside boundary
    if l["y1"] > max_y + 10 and l["y2"] > max_y + 10:
        return False
    if l["y1"] < min_y - 10 and l["y2"] < min_y - 10:
        return False

    # keep everything longer than 60px
    if length >= 60:
        return True

    # for short lines only keep if on boundary
    touches_boundary = (
        abs(l["x1"] - min_x) < 8 or
        abs(l["x2"] - max_x) < 8 or
        abs(l["y1"] - min_y) < 8 or
        abs(l["y2"] - max_y) < 8
    )

    if not touches_boundary:
        return False

    return True

result = [l for l in result if should_keep(l)]

print(json.dumps(result))