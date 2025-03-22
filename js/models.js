// Data models for the cutting simulator

// Generate a random color for pieces
function getRandomColor() {
  const colors = [
    "#76b5c5",
    "#9bc995",
    "#e6a57a",
    "#c9a1d9",
    "#f5c3b8",
    "#a1c9c9",
    "#d9c3a1",
    "#c9a1a1",
    "#a1a1c9",
    "#c9c9a1",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate a unique ID
function generateId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`
}

// Piece class
class Piece {
  constructor(id, width, height, quantity, color) {
    this.id = id || generateId("piece_")
    this.width = width || 50
    this.height = height || 30
    this.quantity = quantity || 1
    this.color = color || getRandomColor()
  }
}

// Board class
class Board {
  constructor(id, width, height, name) {
    this.id = id || generateId("board_")
    this.width = width || 240
    this.height = height || 180
    this.name = name || `Tabla ${Math.floor(Math.random() * 1000)}`
  }
}

// Placement class (for results)
class Placement {
  constructor(pieceId, x, y, width, height, rotated) {
    this.pieceId = pieceId
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.rotated = rotated || false
  }
}

// Cut result class
class CutResult {
  constructor(boardId, placements, wastePercentage, unusedArea) {
    this.boardId = boardId
    this.placements = placements || []
    this.wastePercentage = wastePercentage || 0
    this.unusedArea = unusedArea || 0
  }
}

// Simulator parameters class
class SimulatorParams {
  constructor(cutThickness, margin, allowRotation) {
    this.cutThickness = cutThickness || 0.3
    this.margin = margin || 0
    this.allowRotation = allowRotation !== undefined ? allowRotation : true
  }
}

