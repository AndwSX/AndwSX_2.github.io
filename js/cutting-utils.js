// Cutting algorithm utilities

// Placement class
class Placement {
  constructor(pieceId, x, y, width, height, rotated) {
    this.pieceId = pieceId
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.rotated = rotated
  }
}

// CutResult class
class CutResult {
  constructor(boardId, placements, wastePercentage, wasteArea) {
    this.boardId = boardId
    this.placements = placements
    this.wastePercentage = wastePercentage
    this.wasteArea = wasteArea
  }
}

// Check if a piece can be placed at a specific position
function canPlacePiece(grid, x, y, width, height, cutThickness) {
  // Check if any cell in the piece area is already occupied
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (grid[Math.floor(x + i)] && grid[Math.floor(x + i)][Math.floor(y + j)]) {
        return false
      }
    }
  }

  // Also check the cut thickness area if applicable
  if (cutThickness > 0) {
    // Check right edge
    for (let j = 0; j < height; j++) {
      const checkX = Math.floor(x + width)
      const checkY = Math.floor(y + j)
      if (checkX < grid.length && grid[checkX] && checkY < grid[0].length && grid[checkX][checkY]) {
        return false
      }
    }

    // Check bottom edge
    for (let i = 0; i < width; i++) {
      const checkX = Math.floor(x + i)
      const checkY = Math.floor(y + height)
      if (checkX < grid.length && grid[checkX] && checkY < grid[0].length && grid[checkX][checkY]) {
        return false
      }
    }
  }

  return true
}

// Mark a piece as placed in the grid
function markPlacedPiece(grid, x, y, width, height) {
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (grid[Math.floor(x + i)]) {
        grid[Math.floor(x + i)][Math.floor(y + j)] = true
      }
    }
  }
}

// Calculate cuts for multiple boards and pieces
function calculateCutsMultiple(boards, pieces, params) {
  const results = []

  // Process each board
  boards.forEach((board) => {
    // Calculate effective dimensions considering margins
    const effectiveBoardWidth = board.width - 2 * params.margin
    const effectiveBoardHeight = board.height - 2 * params.margin

    // Create a grid to track used space
    const grid = Array(Math.ceil(effectiveBoardWidth))
      .fill(false)
      .map(() => Array(Math.ceil(effectiveBoardHeight)).fill(false))

    // Create a list of pieces to place
    const piecesToPlace = []

    // Expand pieces based on quantity
    pieces.forEach((piece) => {
      for (let i = 0; i < piece.quantity; i++) {
        piecesToPlace.push({
          pieceId: piece.id,
          width: piece.width,
          height: piece.height,
          quantity: 1,
        })
      }
    })

    // Sort pieces by area (largest first)
    piecesToPlace.sort((a, b) => b.width * b.height - a.width * a.height)

    // Placements for this board
    const placements = []

    // Try to place each piece
    piecesToPlace.forEach((piece) => {
      let placed = false

      // Try to place the piece in its original orientation
      for (let y = params.margin; y <= effectiveBoardHeight - piece.height && !placed; y++) {
        for (let x = params.margin; x <= effectiveBoardWidth - piece.width && !placed; x++) {
          if (canPlacePiece(grid, x, y, piece.width, piece.height, params.cutThickness)) {
            markPlacedPiece(grid, x, y, piece.width, piece.height)
            placements.push(new Placement(piece.pieceId, x, y, piece.width, piece.height, false))
            placed = true
          }
        }
      }

      // If rotation is allowed and piece wasn't placed, try rotating it
      if (!placed && params.allowRotation && piece.width !== piece.height) {
        for (let y = params.margin; y <= effectiveBoardHeight - piece.width && !placed; y++) {
          for (let x = params.margin; x <= effectiveBoardWidth - piece.height && !placed; x++) {
            if (canPlacePiece(grid, x, y, piece.height, piece.width, params.cutThickness)) {
              markPlacedPiece(grid, x, y, piece.height, piece.width)
              placements.push(new Placement(piece.pieceId, x, y, piece.height, piece.width, true))
              placed = true
            }
          }
        }
      }
    })

    // Calculate waste percentage
    const totalArea = board.width * board.height
    let usedArea = 0

    placements.forEach((placement) => {
      usedArea += placement.width * placement.height
    })

    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100

    // Add result for this board
    results.push(new CutResult(board.id, placements, wastePercentage, totalArea - usedArea))
  })

  return results
}

