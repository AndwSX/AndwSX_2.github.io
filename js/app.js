// Import necessary modules
import { Piece } from "./piece.js"
import { Board } from "./board.js"
import { UIManager } from "./ui-manager.js"
import { calculateCutsMultiple } from "./cutting-calculator.js"
import { getRandomColor } from "./utils.js"
import { SimulatorParams } from "./simulator-params.js"

// Main application logic

document.addEventListener("DOMContentLoaded", () => {
  // Initialize data
  let pieces = [new Piece("piece1", 60, 45, 4, getRandomColor())]

  let boards = [new Board("board1", 240, 180, "Tabla 1")]

  let results = []
  let activeBoard = "board1"

  // Initialize UI manager
  const ui = new UIManager()

  // Render initial state
  ui.renderPieces(pieces, updatePiece, deletePiece)
  ui.renderBoards(boards, updateBoard, deleteBoard)

  // Add event listeners
  document.getElementById("addPiece").addEventListener("click", addPiece)
  document.getElementById("addBoard").addEventListener("click", addBoard)
  document.getElementById("calculateCuts").addEventListener("click", calculateCuts)
  document.getElementById("saveProject").addEventListener("click", saveProject)
  document.getElementById("loadProject").addEventListener("click", loadProject)
  document.getElementById("exportImage").addEventListener("click", () => ui.exportImage(activeBoard))
  document
    .getElementById("printResult")
    .addEventListener("click", () => ui.printResult(activeBoard, boards, pieces, results))

  // Add piece function
  function addPiece() {
    const newPiece = new Piece()
    pieces.push(newPiece)
    ui.renderPieces(pieces, updatePiece, deletePiece)
    ui.showToast("Pieza añadida", "Se ha añadido una nueva pieza")
  }

  // Update piece function
  function updatePiece(updatedPiece, oldId) {
    // Check if ID already exists (except for the current piece)
    const existingPiece = pieces.find((p) => p.id === updatedPiece.id && p.id !== oldId)
    if (existingPiece) {
      ui.showToast("Error", "Ya existe una pieza con ese ID", "error")
      return
    }

    // Update the piece
    pieces = pieces.map((p) => (p.id === oldId ? updatedPiece : p))
    ui.renderPieces(pieces, updatePiece, deletePiece)
    ui.showToast("Pieza actualizada", "Se ha actualizado la pieza correctamente")
  }

  // Delete piece function
  function deletePiece(pieceId) {
    pieces = pieces.filter((p) => p.id !== pieceId)
    ui.renderPieces(pieces, updatePiece, deletePiece)
    ui.showToast("Pieza eliminada", "Se ha eliminado la pieza correctamente")
  }

  // Add board function
  function addBoard() {
    const newBoard = new Board()
    boards.push(newBoard)
    ui.renderBoards(boards, updateBoard, deleteBoard)
    ui.showToast("Tabla añadida", "Se ha añadido una nueva tabla")
  }

  // Update board function
  function updateBoard(updatedBoard, oldId) {
    // Check if ID already exists (except for the current board)
    const existingBoard = boards.find((b) => b.id === updatedBoard.id && b.id !== oldId)
    if (existingBoard) {
      ui.showToast("Error", "Ya existe una tabla con ese ID", "error")
      return
    }

    // Update the board
    boards = boards.map((b) => (b.id === oldId ? updatedBoard : b))
    ui.renderBoards(boards, updateBoard, deleteBoard)
    ui.showToast("Tabla actualizada", "Se ha actualizado la tabla correctamente")

    // Update active board if needed
    if (activeBoard === oldId) {
      activeBoard = updatedBoard.id
    }
  }

  // Delete board function
  function deleteBoard(boardId) {
    boards = boards.filter((b) => b.id !== boardId)
    ui.renderBoards(boards, updateBoard, deleteBoard)
    ui.showToast("Tabla eliminada", "Se ha eliminado la tabla correctamente")

    // Update active board if needed
    if (activeBoard === boardId && boards.length > 0) {
      activeBoard = boards[0].id
    }
  }

  // Calculate cuts function
  function calculateCuts() {
    if (pieces.length === 0) {
      ui.showToast("Error", "Debes añadir al menos una pieza", "error")
      return
    }

    if (boards.length === 0) {
      ui.showToast("Error", "Debes añadir al menos una tabla", "error")
      return
    }

    const params = ui.getSimulatorParams()
    results = calculateCutsMultiple(boards, pieces, params)

    // Set active board to the first one with results
    if (results.length > 0) {
      activeBoard = results[0].boardId
    }

    // Update UI
    ui.renderBoardTabs(results, boards, activeBoard, selectBoard)
    ui.drawCuts(results, boards, pieces, activeBoard)
    ui.updateResults(results, boards, pieces, activeBoard)

    ui.showToast("Cálculo completado", "Se han calculado los cortes correctamente")
  }

  // Select board function
  function selectBoard(boardId) {
    activeBoard = boardId
    ui.renderBoardTabs(results, boards, activeBoard, selectBoard)
    ui.drawCuts(results, boards, pieces, activeBoard)
    ui.updateResults(results, boards, pieces, activeBoard)
  }

  // Save project function
  function saveProject() {
    try {
      const projectData = {
        pieces,
        boards,
        params: ui.getSimulatorParams(),
      }

      localStorage.setItem("cuttingSimulatorProject", JSON.stringify(projectData))
      ui.showToast("Proyecto guardado", "Tu proyecto ha sido guardado en el navegador")
    } catch (error) {
      ui.showToast("Error al guardar", "No se pudo guardar el proyecto", "error")
    }
  }

  // Load project function
  function loadProject() {
    try {
      const savedProject = localStorage.getItem("cuttingSimulatorProject")

      if (!savedProject) {
        ui.showToast("No hay proyecto guardado", "No se encontró ningún proyecto guardado", "error")
        return
      }

      const projectData = JSON.parse(savedProject)

      // Load pieces
      if (projectData.pieces && Array.isArray(projectData.pieces)) {
        pieces = projectData.pieces.map((p) => new Piece(p.id, p.width, p.height, p.quantity, p.color))
        ui.renderPieces(pieces, updatePiece, deletePiece)
      }

      // Load boards
      if (projectData.boards && Array.isArray(projectData.boards)) {
        boards = projectData.boards.map((b) => new Board(b.id, b.width, b.height, b.name))
        ui.renderBoards(boards, updateBoard, deleteBoard)
      }

      // Load params
      if (projectData.params) {
        ui.setSimulatorParams(
          new SimulatorParams(
            projectData.params.cutThickness,
            projectData.params.margin,
            projectData.params.allowRotation,
          ),
        )
      }

      ui.showToast("Proyecto cargado", "Tu proyecto ha sido cargado correctamente")
    } catch (error) {
      ui.showToast("Error al cargar", "No se pudo cargar el proyecto", "error")
    }
  }
})

