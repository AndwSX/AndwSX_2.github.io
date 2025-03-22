import type { CutResult, SimulatorParams } from "@/components/cutting-simulator"
import type { Board, Piece } from "@/components/cutting-simulator"

export function calculateCuts(params: SimulatorParams): CutResult {
  const { boardWidth, boardHeight, pieceWidth, pieceHeight, cutThickness, margin } = params

  // Calculate effective dimensions considering margins
  const effectiveBoardWidth = boardWidth - 2 * margin
  const effectiveBoardHeight = boardHeight - 2 * margin

  // Calculate effective piece dimensions with cut thickness
  const effectivePieceWidth = pieceWidth + cutThickness
  const effectivePieceHeight = pieceHeight + cutThickness

  // Calculate how many pieces fit in each dimension
  const cols = Math.floor(effectiveBoardWidth / effectivePieceWidth)
  const rows = Math.floor(effectiveBoardHeight / effectivePieceHeight)

  // Calculate total cuts
  const totalCuts = cols * rows

  // Calculate waste
  const usedWidth = cols * effectivePieceWidth - (cols > 0 ? cutThickness : 0)
  const usedHeight = rows * effectivePieceHeight - (rows > 0 ? cutThickness : 0)

  const wasteWidth = effectiveBoardWidth - usedWidth
  const wasteHeight = effectiveBoardHeight - usedHeight

  // Calculate waste percentage
  const totalArea = boardWidth * boardHeight
  const usedArea = totalCuts * pieceWidth * pieceHeight
  const totalWastePercentage = ((totalArea - usedArea) / totalArea) * 100

  return {
    cols,
    rows,
    totalCuts,
    wasteWidth,
    wasteHeight,
    totalWastePercentage,
  }
}

// Simple bin packing algorithm for multiple pieces
export function calculateCutsMultiple(boards: Board[], pieces: Piece[], params: SimulatorParams): CutResult[] {
  const results: CutResult[] = []

  // Process each board
  boards.forEach((board) => {
    // Calculate effective dimensions considering margins
    const effectiveBoardWidth = board.width - 2 * params.margin
    const effectiveBoardHeight = board.height - 2 * params.margin

    // Create a grid to track used space
    const grid: boolean[][] = Array(Math.ceil(effectiveBoardWidth))
      .fill(false)
      .map(() => Array(Math.ceil(effectiveBoardHeight)).fill(false))

    // Create a list of pieces to place
    const piecesToPlace: {
      pieceId: string
      width: number
      height: number
      quantity: number
    }[] = []

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
    const placements: {
      pieceId: string
      x: number
      y: number
      width: number
      height: number
      rotated: boolean
    }[] = []

    // Try to place each piece
    piecesToPlace.forEach((piece) => {
      let placed = false

      // Try to place the piece in its original orientation
      for (let y = params.margin; y <= effectiveBoardHeight - piece.height && !placed; y++) {
        for (let x = params.margin; x <= effectiveBoardWidth - piece.width && !placed; x++) {
          if (canPlacePiece(grid, x, y, piece.width, piece.height, params.cutThickness)) {
            markPlacedPiece(grid, x, y, piece.width, piece.height)
            placements.push({
              pieceId: piece.pieceId,
              x,
              y,
              width: piece.width,
              height: piece.height,
              rotated: false,
            })
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
              placements.push({
                pieceId: piece.pieceId,
                x,
                y,
                width: piece.height,
                height: piece.width,
                rotated: true,
              })
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
    results.push({
      boardId: board.id,
      placements,
      wastePercentage,
      unusedArea: totalArea - usedArea,
    })
  })

  return results
}

// Check if a piece can be placed at a specific position
function canPlacePiece(
  grid: boolean[][],
  x: number,
  y: number,
  width: number,
  height: number,
  cutThickness: number,
): boolean {
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
function markPlacedPiece(grid: boolean[][], x: number, y: number, width: number, height: number): void {
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (grid[Math.floor(x + i)]) {
        grid[Math.floor(x + i)][Math.floor(y + j)] = true
      }
    }
  }
}

