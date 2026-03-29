const materials = [
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
  }
]

export default materials