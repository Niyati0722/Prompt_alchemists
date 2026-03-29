const materials = [
  // Your existing entries...
  {
    name: "AAC Blocks",
    cost: "Low",
    costScore: 1,
    strength: "Medium",
    strengthScore: 2,
    durability: "High",
    durabilityScore: 3,
    bestUse: "Partition walls",
    type: "partition"
  },
  {
    name: "Red Brick",
    cost: "Medium",
    costScore: 2,
    strength: "High",
    strengthScore: 3,
    durability: "Medium",
    durabilityScore: 2,
    bestUse: "Load-bearing walls",
    type: "loadbearing"
  },
  {
    name: "RCC",
    cost: "High",
    costScore: 3,
    strength: "Very High",
    strengthScore: 4,
    durability: "Very High",
    durabilityScore: 4,
    bestUse: "Columns, slabs",
    type: "structural"
  },
  {
    name: "Steel Frame",
    cost: "High",
    costScore: 3,
    strength: "Very High",
    strengthScore: 4,
    durability: "Very High",
    durabilityScore: 4,
    bestUse: "Long spans (>5m)",
    type: "structural"
  },
  {
    name: "Hollow Concrete Block",
    cost: "Low-Med",
    costScore: 1.5,
    strength: "Medium",
    strengthScore: 2,
    durability: "Medium",
    durabilityScore: 2,
    bestUse: "Non-structural walls",
    type: "partition"
  },
  {
    name: "Fly Ash Brick",
    cost: "Low",
    costScore: 1,
    strength: "Medium-High",
    strengthScore: 2.5,
    durability: "High",
    durabilityScore: 3,
    bestUse: "General walling",
    type: "general"
  },
  {
    name: "Precast Concrete Panel",
    cost: "Med-High",
    costScore: 2.5,
    strength: "High",
    strengthScore: 3,
    durability: "Very High",
    durabilityScore: 4,
    bestUse: "Structural walls, slabs",
    type: "structural"
  },
  // New additions
  {
    name: "Cross-Laminated Timber (CLT)",
    cost: "High",
    costScore: 3,
    strength: "High",
    strengthScore: 3,
    durability: "High",
    durabilityScore: 3,
    bestUse: "Walls, floors, roofs",
    type: "structural"
  },
  {
    name: "Structural Insulated Panel (SIP)",
    cost: "Medium",
    costScore: 2,
    strength: "Medium-High",
    strengthScore: 2.5,
    durability: "High",
    durabilityScore: 3,
    bestUse: "Exterior walls, roofs",
    type: "structural"
  },
  {
    name: "Metal Sandwich Panel",
    cost: "Medium",
    costScore: 2,
    strength: "Medium",
    strengthScore: 2,
    durability: "Medium",
    durabilityScore: 2,
    bestUse: "Warehouses, facades",
    type: "enclosure"
  },
  {
    name: "Insulated Concrete Form (ICF)",
    cost: "Med-High",
    costScore: 2.5,
    strength: "Very High",
    strengthScore: 4,
    durability: "Very High",
    durabilityScore: 4,
    bestUse: "Foundations, load-bearing walls",
    type: "structural"
  },
  {
    name: "Glass Fiber Reinforced Concrete (GFRC)",
    cost: "High",
    costScore: 3,
    strength: "Medium-High",
    strengthScore: 2.5,
    durability: "Very High",
    durabilityScore: 4,
    bestUse: "Facade panels, cladding",
    type: "cladding"
  },
  {
    name: "Hempcrete",
    cost: "Med-High",
    costScore: 2.5,
    strength: "Low",
    strengthScore: 1,
    durability: "High",
    durabilityScore: 3,
    bestUse: "Insulating infill, renovation",
    type: "insulation"
  },
  {
    name: "Engineered Wood (Glulam, LVL)",
    cost: "Medium",
    costScore: 2,
    strength: "High",
    strengthScore: 3,
    durability: "High",
    durabilityScore: 3,
    bestUse: "Beams, headers, framing",
    type: "structural"
  }
]

export default materials
