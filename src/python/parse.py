import cv2
import numpy as np
import json
import sys

image_path = sys.argv[1]
image = cv2.imread(image_path)

# make image bigger so small walls become detectable
image = cv2.resize(image, None, fx=2, fy=2)

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# threshold to make walls pure black
_, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)

edges = cv2.Canny(binary, 50, 150)

lines = cv2.HoughLinesP(
    edges,
    rho=1,
    theta=np.pi/180,
    threshold=80,
    minLineLength=60,   # reduced to catch inner walls
    maxLineGap=20
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

        if length > 60 and (is_horizontal(x1,y1,x2,y2) or is_vertical(x1,y1,x2,y2)):
            
            # snap to perfect horizontal or vertical
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

# divide by 2 because we resized image by 2x
result = [{
    "x1": l["x1"]//2, "y1": l["y1"]//2,
    "x2": l["x2"]//2, "y2": l["y2"]//2
} for l in result]

print(json.dumps(result))