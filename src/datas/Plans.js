const plans = {
  planA: {
    name: "Plan A — 2 Bed / 1 Bath",
    image: "/images/planA.jpg",
    rooms: [
      { name: "Living Room", type: "living", area: 20 },
      { name: "Bedroom 1", type: "bedroom", area: 15 },
      { name: "Bedroom 2", type: "bedroom", area: 12 },
      { name: "Bathroom", type: "bathroom", area: 5 },
      { name: "Kitchen", type: "kitchen", area: 8 }
    ]
  },
  planB: {
    name: "Plan B — 4 Bed / 3 Bath",
    image: "/images/planB.jpg",
    rooms: [
      { name: "Great Room", type: "living", area: 30 },
      { name: "Kitchen", type: "kitchen", area: 12 },
      { name: "Bedroom 1", type: "bedroom", area: 15 },
      { name: "Bedroom 2", type: "bedroom", area: 14 },
      { name: "Bedroom 3", type: "bedroom", area: 13 },
      { name: "Bedroom 4", type: "bedroom", area: 12 },
      { name: "Bath 1", type: "bathroom", area: 5 },
      { name: "Bath 2", type: "bathroom", area: 5 },
      { name: "Bath 3", type: "bathroom", area: 4 },
      { name: "Laundry", type: "utility", area: 6 },
      { name: "Foyer", type: "entrance", area: 8 }
    ]
  },
  planC: {
    name: "Plan C — 3 Bed / 2 Bath",
    image: "/images/planC.jpg",
    rooms: [
      { name: "Living Room", type: "living", area: 22 },
      { name: "Bedroom 1", type: "bedroom", area: 15 },
      { name: "Bedroom 2", type: "bedroom", area: 13 },
      { name: "Bedroom 3", type: "bedroom", area: 12 },
      { name: "Bath 1", type: "bathroom", area: 5 },
      { name: "Bath 2", type: "bathroom", area: 4 },
      { name: "Kitchen", type: "kitchen", area: 10 }
    ]
  }
}

export default plans