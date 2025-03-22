// ===== MODELS =====

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
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Generate a unique ID
  function generateId(prefix) {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
  }
  
  // Piece class
  class Piece {
    constructor(id, width, height, quantity, color) {
      this.id = id || generateId("piece_");
      this.width = width || 50;
      this.height = height || 30;
      this.quantity = quantity || 1;
      this.color = color || getRandomColor();
    }
  }
  
  // Board class
  class Board {
    constructor(id, width, height, name) {
      this.id = id || generateId("board_");
      this.width = width || 240;
      this.height = height || 180;
      this.name = name || `Tabla ${Math.floor(Math.random() * 1000)}`;
    }
  }
  
  // Placement class (for results)
  class Placement {
    constructor(pieceId, x, y, width, height, rotated) {
      this.pieceId = pieceId;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.rotated = rotated || false;
    }
  }
  
  // Cut result class
  class CutResult {
    constructor(boardId, placements, wastePercentage, unusedArea) {
      this.boardId = boardId;
      this.placements = placements || [];
      this.wastePercentage = wastePercentage || 0;
      this.unusedArea = unusedArea || 0;
    }
  }
  
  // Simulator parameters class
  class SimulatorParams {
    constructor(cutThickness, margin, allowRotation) {
      this.cutThickness = cutThickness || 0.3;
      this.margin = margin || 0;
      this.allowRotation = allowRotation !== undefined ? allowRotation : true;
    }
  }
  
  // ===== CUTTING UTILITIES =====
  
  // Check if a piece can be placed at a specific position
  function canPlacePiece(grid, x, y, width, height, cutThickness) {
    // Check if any cell in the piece area is already occupied
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        if (grid[Math.floor(x + i)] && grid[Math.floor(x + i)][Math.floor(y + j)]) {
          return false;
        }
      }
    }
  
    // Also check the cut thickness area if applicable
    if (cutThickness > 0) {
      // Check right edge
      for (let j = 0; j < height; j++) {
        const checkX = Math.floor(x + width);
        const checkY = Math.floor(y + j);
        if (checkX < grid.length && grid[checkX] && checkY < grid[0].length && grid[checkX][checkY]) {
          return false;
        }
      }
  
      // Check bottom edge
      for (let i = 0; i < width; i++) {
        const checkX = Math.floor(x + i);
        const checkY = Math.floor(y + height);
        if (checkX < grid.length && grid[checkX] && checkY < grid[0].length && grid[checkX][checkY]) {
          return false;
        }
      }
    }
  
    return true;
  }
  
  // Mark a piece as placed in the grid
  function markPlacedPiece(grid, x, y, width, height) {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        if (grid[Math.floor(x + i)]) {
          grid[Math.floor(x + i)][Math.floor(y + j)] = true;
        }
      }
    }
  }
  
  // Calculate cuts for multiple boards and pieces
  function calculateCutsMultiple(boards, pieces, params) {
    const results = [];
  
    // Process each board
    boards.forEach(board => {
      // Calculate effective dimensions considering margins
      const effectiveBoardWidth = board.width - 2 * params.margin;
      const effectiveBoardHeight = board.height - 2 * params.margin;
  
      // Create a grid to track used space
      const grid = Array(Math.ceil(effectiveBoardWidth))
        .fill(false)
        .map(() => Array(Math.ceil(effectiveBoardHeight)).fill(false));
  
      // Create a list of pieces to place
      const piecesToPlace = [];
  
      // Expand pieces based on quantity
      pieces.forEach(piece => {
        for (let i = 0; i < piece.quantity; i++) {
          piecesToPlace.push({
            pieceId: piece.id,
            width: piece.width,
            height: piece.height,
            quantity: 1
          });
        }
      });
  
      // Sort pieces by area (largest first)
      piecesToPlace.sort((a, b) => b.width * b.height - a.width * a.height);
  
      // Placements for this board
      const placements = [];
  
      // Try to place each piece
      piecesToPlace.forEach(piece => {
        let placed = false;
  
        // Try to place the piece in its original orientation
        for (let y = params.margin; y <= effectiveBoardHeight - piece.height && !placed; y++) {
          for (let x = params.margin; x <= effectiveBoardWidth - piece.width && !placed; x++) {
            if (canPlacePiece(grid, x, y, piece.width, piece.height, params.cutThickness)) {
              markPlacedPiece(grid, x, y, piece.width, piece.height);
              placements.push(new Placement(
                piece.pieceId,
                x,
                y,
                piece.width,
                piece.height,
                false
              ));
              placed = true;
            }
          }
        }
  
        // If rotation is allowed and piece wasn't placed, try rotating it
        if (!placed && params.allowRotation && piece.width !== piece.height) {
          for (let y = params.margin; y <= effectiveBoardHeight - piece.width && !placed; y++) {
            for (let x = params.margin; x <= effectiveBoardWidth - piece.height && !placed; x++) {
              if (canPlacePiece(grid, x, y, piece.height, piece.width, params.cutThickness)) {
                markPlacedPiece(grid, x, y, piece.height, piece.width);
                placements.push(new Placement(
                  piece.pieceId,
                  x,
                  y,
                  piece.height,
                  piece.width,
                  true
                ));
                placed = true;
              }
            }
          }
        }
      });
  
      // Calculate waste percentage
      const totalArea = board.width * board.height;
      let usedArea = 0;
  
      placements.forEach(placement => {
        usedArea += placement.width * placement.height;
      });
  
      const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
  
      // Add result for this board
      results.push(new CutResult(
        board.id,
        placements,
        wastePercentage,
        totalArea - usedArea
      ));
    });
  
    return results;
  }
  
  // ===== UI MANAGER =====
  
  class UIManager {
    constructor() {
      // DOM elements
      this.piecesContainer = document.getElementById('piecesContainer');
      this.boardsContainer = document.getElementById('boardsContainer');
      this.canvas = document.getElementById('cutCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.boardTabs = document.getElementById('boardTabs');
      this.resultActions = document.getElementById('resultActions');
      this.resultsCard = document.getElementById('resultsCard');
      this.resultsTitle = document.getElementById('resultsTitle');
      this.totalPieces = document.getElementById('totalPieces');
      this.piecesList = document.getElementById('piecesList');
      this.usageBar = document.getElementById('usageBar');
      this.usedPercentage = document.getElementById('usedPercentage');
      this.wastePercentage = document.getElementById('wastePercentage');
      this.totalArea = document.getElementById('totalArea');
      this.usedArea = document.getElementById('usedArea');
      this.wasteArea = document.getElementById('wasteArea');
      this.boardsSummary = document.getElementById('boardsSummary');
      
      // Form elements
      this.cutThicknessInput = document.getElementById('cutThickness');
      this.marginInput = document.getElementById('margin');
      this.allowRotationInput = document.getElementById('allowRotation');
    }
  
    // Show toast notification
    showToast(title, message, type = 'success') {
      alert(`${title}: ${message}`);
    }
  
    // Get simulator parameters from form
    getSimulatorParams() {
      return new SimulatorParams(
        parseFloat(this.cutThicknessInput.value) || 0.3,
        parseFloat(this.marginInput.value) || 0,
        this.allowRotationInput.checked
      );
    }
  
    // Set simulator parameters to form
    setSimulatorParams(params) {
      this.cutThicknessInput.value = params.cutThickness;
      this.marginInput.value = params.margin;
      this.allowRotationInput.checked = params.allowRotation;
    }
  
    // Render pieces list
    renderPieces(pieces, onUpdate, onDelete) {
      this.piecesContainer.innerHTML = '';
      
      if (pieces.length === 0) {
        this.piecesContainer.innerHTML = '<div class="text-center py-4 text-muted">No hay piezas. Añade una pieza para comenzar.</div>';
        return;
      }
      
      pieces.forEach(piece => {
        const pieceCard = document.createElement('div');
        pieceCard.className = 'card mb-3';
        pieceCard.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <div class="piece-color" style="background-color: ${piece.color}"></div>
                <div>
                  <h6 class="mb-0">${piece.id}</h6>
                  <small class="text-muted">${piece.width}×${piece.height} cm - Cantidad: ${piece.quantity}</small>
                </div>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-primary edit-piece me-1" data-id="${piece.id}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-piece" data-id="${piece.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div class="edit-form-${piece.id}" style="display: none;">
              <hr>
              <div class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label">ID</label>
                  <input type="text" class="form-control form-control-sm piece-id" value="${piece.id}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cantidad</label>
                  <input type="number" class="form-control form-control-sm piece-quantity" min="1" value="${piece.quantity}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ancho (cm)</label>
                  <input type="number" class="form-control form-control-sm piece-width" min="1" step="0.1" value="${piece.width}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Alto (cm)</label>
                  <input type="number" class="form-control form-control-sm piece-height" min="1" step="0.1" value="${piece.height}">
                </div>
                <div class="col-12 text-end">
                  <button class="btn btn-sm btn-outline-secondary cancel-edit me-1" data-id="${piece.id}">
                    <i class="bi bi-x me-1"></i>Cancelar
                  </button>
                  <button class="btn btn-sm btn-primary save-piece" data-id="${piece.id}">
                    <i class="bi bi-check me-1"></i>Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        this.piecesContainer.appendChild(pieceCard);
        
        // Add event listeners
        pieceCard.querySelector(`.edit-piece[data-id="${piece.id}"]`).addEventListener('click', () => {
          pieceCard.querySelector(`.edit-form-${piece.id}`).style.display = 'block';
        });
        
        pieceCard.querySelector(`.cancel-edit[data-id="${piece.id}"]`).addEventListener('click', () => {
          pieceCard.querySelector(`.edit-form-${piece.id}`).style.display = 'none';
        });
        
        pieceCard.querySelector(`.save-piece[data-id="${piece.id}"]`).addEventListener('click', () => {
          const updatedPiece = new Piece(
            pieceCard.querySelector('.piece-id').value,
            parseFloat(pieceCard.querySelector('.piece-width').value),
            parseFloat(pieceCard.querySelector('.piece-height').value),
            parseInt(pieceCard.querySelector('.piece-quantity').value),
            piece.color
          );
          onUpdate(updatedPiece, piece.id);
          pieceCard.querySelector(`.edit-form-${piece.id}`).style.display = 'none';
        });
        
        pieceCard.querySelector(`.delete-piece[data-id="${piece.id}"]`).addEventListener('click', () => {
          if (confirm(`¿Estás seguro de eliminar la pieza ${piece.id}?`)) {
            onDelete(piece.id);
          }
        });
      });
    }
  
    // Render boards list
    renderBoards(boards, onUpdate, onDelete) {
      this.boardsContainer.innerHTML = '';
      
      if (boards.length === 0) {
        this.boardsContainer.innerHTML = '<div class="text-center py-4 text-muted">No hay tablas. Añade una tabla para comenzar.</div>';
        return;
      }
      
      boards.forEach(board => {
        const boardCard = document.createElement('div');
        boardCard.className = 'card mb-3';
        boardCard.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-0">${board.name}</h6>
                <small class="text-muted">${board.width}×${board.height} cm</small>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-primary edit-board me-1" data-id="${board.id}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-board" data-id="${board.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div class="edit-form-${board.id}" style="display: none;">
              <hr>
              <div class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label">ID</label>
                  <input type="text" class="form-control form-control-sm board-id" value="${board.id}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nombre</label>
                  <input type="text" class="form-control form-control-sm board-name" value="${board.name}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ancho (cm)</label>
                  <input type="number" class="form-control form-control-sm board-width" min="1" step="0.1" value="${board.width}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Alto (cm)</label>
                  <input type="number" class="form-control form-control-sm board-height" min="1" step="0.1" value="${board.height}">
                </div>
                <div class="col-12 text-end">
                  <button class="btn btn-sm btn-outline-secondary cancel-edit me-1" data-id="${board.id}">
                    <i class="bi bi-x me-1"></i>Cancelar
                  </button>
                  <button class="btn btn-sm btn-primary save-board" data-id="${board.id}">
                    <i class="bi bi-check me-1"></i>Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        this.boardsContainer.appendChild(boardCard);
        
        // Add event listeners
        boardCard.querySelector(`.edit-board[data-id="${board.id}"]`).addEventListener('click', () => {
          boardCard.querySelector(`.edit-form-${board.id}`).style.display = 'block';
        });
        
        boardCard.querySelector(`.cancel-edit[data-id="${board.id}"]`).addEventListener('click', () => {
          boardCard.querySelector(`.edit-form-${board.id}`).style.display = 'none';
        });
        
        boardCard.querySelector(`.save-board[data-id="${board.id}"]`).addEventListener('click', () => {
          const updatedBoard = new Board(
            boardCard.querySelector('.board-id').value,
            parseFloat(boardCard.querySelector('.board-width').value),
            parseFloat(boardCard.querySelector('.board-height').value),
            boardCard.querySelector('.board-name').value
          );
          onUpdate(updatedBoard, board.id);
          boardCard.querySelector(`.edit-form-${board.id}`).style.display = 'none';
        });
        
        boardCard.querySelector(`.delete-board[data-id="${board.id}"]`).addEventListener('click', () => {
          if (confirm(`¿Estás seguro de eliminar la tabla ${board.name}?`)) {
            onDelete(board.id);
          }
        });
      });
    }
  
    // Render board tabs
    renderBoardTabs(results, boards, activeBoard, onBoardSelect) {
      this.boardTabs.innerHTML = '';
  
      if (results.length === 0) {
        this.boardTabs.classList.add('d-none');
        return;
      }
  
      this.boardTabs.classList.remove('d-none');
      
      // Create board tabs
      const tabsDiv = document.createElement('div');
      tabsDiv.className = 'btn-group';
      tabsDiv.setAttribute('role', 'group');
      
      results.forEach(result => {
        const board = boards.find(b => b.id === result.boardId);
        if (!board) return;
        
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.className = `btn btn-${result.boardId === activeBoard ? 'primary' : 'outline-primary'} btn-sm`;
        tabButton.textContent = board.name;
        tabButton.dataset.boardId = result.boardId;
        
        tabButton.addEventListener('click', () => {
          onBoardSelect(result.boardId);
        });
        
        tabsDiv.appendChild(tabButton);
      });
      
      this.boardTabs.appendChild(tabsDiv);
    }
  
    // Draw cuts on canvas
    drawCuts(results, boards, pieces, activeBoard) {
      if (!this.canvas || results.length === 0) return;
      
      // Find the active board and its result
      const activeResult = results.find(r => r.boardId === activeBoard);
      if (!activeResult) return;
      
      const activeboardObj = boards.find(b => b.id === activeBoard);
      if (!activeboardObj) return;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Set canvas dimensions based on aspect ratio
      const maxCanvasWidth = 800;
      const maxCanvasHeight = 600;
      
      const aspectRatio = activeboardObj.width / activeboardObj.height;
      let canvasWidth, canvasHeight;
      
      if (aspectRatio > maxCanvasWidth / maxCanvasHeight) {
        canvasWidth = maxCanvasWidth;
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        canvasHeight = maxCanvasHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      
      // Scaling factors
      const scaleX = canvasWidth / activeboardObj.width;
      const scaleY = canvasHeight / activeboardObj.height;
      
      // Draw board background
      this.ctx.fillStyle = "#f5f5f5";
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw board outline
      this.ctx.strokeStyle = "#333";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw pieces
      activeResult.placements.forEach(placement => {
        const piece = pieces.find(p => p.id === placement.pieceId);
        if (!piece) return;
        
        const x = placement.x * scaleX;
        const y = placement.y * scaleY;
        const width = placement.width * scaleX;
        const height = placement.height * scaleY;
        
        // Draw piece
        this.ctx.fillStyle = piece.color || "#76b5c5";
        this.ctx.fillRect(x, y, width, height);
        
        // Draw piece border
        this.ctx.strokeStyle = "#333";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw piece dimensions and ID
        this.ctx.fillStyle = "#333";
        this.ctx.font = "10px Arial";
        this.ctx.textAlign = "center";
        
        const displayText = placement.rotated
          ? `${placement.height}×${placement.width}`
          : `${placement.width}×${placement.height}`;
        
        this.ctx.fillText(displayText, x + width / 2, y + height / 2 - 5);
        this.ctx.fillText(piece.id, x + width / 2, y + height / 2 + 10);
      });
      
      // Draw board dimensions
      this.ctx.fillStyle = "#333";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        `${activeboardObj.name}: ${activeboardObj.width}×${activeboardObj.height} cm`,
        canvasWidth / 2,
        canvasHeight - 10
      );
    }
  
    // Update results display
    updateResults(results, boards, pieces, activeBoard) {
      // Find the active result
      const activeResult = results.find(r => r.boardId === activeBoard);
      if (!activeResult) return;
      
      // Find the active board
      const board = boards.find(b => b.id === activeBoard);
      if (!board) return;
      
      // Show results card
      this.resultsCard.classList.remove('d-none');
      this.resultActions.classList.remove('d-none');
      
      // Update title
      this.resultsTitle.textContent = `Resultados - ${board.name}`;
      
      // Calculate total pieces placed
      const totalPiecesPlaced = activeResult.placements.length;
      this.totalPieces.textContent = totalPiecesPlaced;
      
      // Count pieces by type
      const pieceCounts = {};
      activeResult.placements.forEach(placement => {
        const pieceId = placement.pieceId;
        pieceCounts[pieceId] = (pieceCounts[pieceId] || 0) + 1;
      });
      
      // Update pieces list
      this.piecesList.innerHTML = '';
      Object.entries(pieceCounts).forEach(([pieceId, count]) => {
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece) return;
        
        const pieceItem = document.createElement('div');
        pieceItem.className = 'd-flex justify-content-between align-items-center mb-2';
        pieceItem.innerHTML = `
          <div class="d-flex align-items-center">
            <div class="piece-color" style="background-color: ${piece.color || '#76b5c5'}"></div>
            <span>${pieceId} (${piece.width}×${piece.height} cm)</span>
          </div>
          <span class="fw-medium">${count} / ${piece.quantity}</span>
        `;
        
        this.piecesList.appendChild(pieceItem);
      });
      
      // Calculate total area
      const boardArea = board.width * board.height;
      const usedArea = boardArea * (1 - activeResult.wastePercentage / 100);
      const wasteArea = boardArea - usedArea;
      
      // Update efficiency display
      this.usageBar.style.width = `${100 - activeResult.wastePercentage}%`;
      this.usedPercentage.textContent = `Utilizado: ${(100 - activeResult.wastePercentage).toFixed(2)}%`;
      this.wastePercentage.textContent = `Desperdicio: ${activeResult.wastePercentage.toFixed(2)}%`;
      
      // Update area information
      this.totalArea.textContent = `Área total: ${boardArea.toFixed(2)} cm²`;
      this.usedArea.textContent = `Área utilizada: ${usedArea.toFixed(2)} cm²`;
      this.wasteArea.textContent = `Área desperdiciada: ${wasteArea.toFixed(2)} cm²`;
      
      // Update boards summary
      this.boardsSummary.innerHTML = '';
      results.forEach(result => {
        const board = boards.find(b => b.id === result.boardId);
        if (!board) return;
        
        const summaryItem = document.createElement('div');
        summaryItem.className = 'd-flex justify-content-between align-items-center mb-2';
        summaryItem.innerHTML = `
          <span>${board.name}</span>
          <span>${result.placements.length} piezas (${(100 - result.wastePercentage).toFixed(2)}% utilizado)</span>
        `;
        
        this.boardsSummary.appendChild(summaryItem);
      });
    }
  
    // Export canvas as image
    exportImage(activeBoard) {
      if (!this.canvas) return;
      
      const link = document.createElement('a');
      link.download = `simulador-cortes-${activeBoard}.png`;
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    }
  
    // Print result
    printResult(activeBoard, boards, pieces, results) {
      if (!this.canvas) return;
      
      const dataUrl = this.canvas.toDataURL('image/png');
      const activeboardObj = boards.find(b => b.id === activeBoard);
      if (!activeboardObj) return;
      
      const activeResult = results.find(r => r.boardId === activeBoard);
      if (!activeResult) return;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      // Count pieces by type
      const pieceCounts = {};
      activeResult.placements.forEach(placement => {
        const pieceId = placement.pieceId;
        pieceCounts[pieceId] = (pieceCounts[pieceId] || 0) + 1;
      });
      
      // Generate piece list HTML
      let pieceListHtml = '';
      Object.entries(pieceCounts).forEach(([pieceId, count]) => {
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
          pieceListHtml += `
            <tr>
              <td>${pieceId}</td>
              <td>${piece.width}×${piece.height} cm</td>
              <td>${count}</td>
            </tr>
          `;
        }
      });
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Simulador de Cortes - ${activeboardObj.name}</title>
            <style>
              body { margin: 0; display: flex; flex-direction: column; align-items: center; font-family: Arial; }
              img { max-width: 100%; height: auto; margin-top: 20px; }
              .info { margin: 20px; width: 100%; max-width: 800px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="info">
              <h2>Plan de Corte: ${activeboardObj.name}</h2>
              <p>Dimensiones: ${activeboardObj.width}×${activeboardObj.height} cm</p>
              <p>Desperdicio: ${activeResult.wastePercentage.toFixed(2)}%</p>
              
              <h3>Piezas en esta tabla:</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Dimensiones</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  ${pieceListHtml}
                </tbody>
              </table>
            </div>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
  
  // ===== MAIN APPLICATION =====
  
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize data
    let pieces = [
      new Piece("piece1", 60, 45, 4, getRandomColor())
    ];
    
    let boards = [
      new Board("board1", 240, 180, "Tabla 1")
    ];
    
    let results = [];
    let activeBoard = "board1";
    
    // Initialize UI manager
    const ui = new UIManager();
    
    // Render initial state
    ui.renderPieces(pieces, updatePiece, deletePiece);
    ui.renderBoards(boards, updateBoard, deleteBoard);
    
    // Add event listeners
    document.getElementById("addPiece").addEventListener("click", addPiece);
    document.getElementById("addBoard").addEventListener("click", addBoard);
    document.getElementById("calculateCuts").addEventListener("click", calculateCuts);
    document.getElementById("saveProject").addEventListener("click", saveProject);
    document.getElementById("loadProject").addEventListener("click", loadProject);
    document.getElementById("exportImage").addEventListener("click", () => ui.exportImage(activeBoard));
    document.getElementById("printResult").addEventListener("click", () => ui.printResult(activeBoard, boards, pieces, results));
    
    // Add piece function
    function addPiece() {
      const newPiece = new Piece();
      pieces.push(newPiece);
      ui.renderPieces(pieces, updatePiece, deletePiece);
      ui.showToast("Pieza añadida", "Se ha añadido una nueva pieza");
    }
    
    // Update piece function
    function updatePiece(updatedPiece, oldId) {
      // Check if ID already exists (except for the current piece)
      const existingPiece = pieces.find(p => p.id === updatedPiece.id && p.id !== oldId);
      if (existingPiece) {
        ui.showToast("Error", "Ya existe una pieza con ese ID", "error");
        return;
      }
      
      // Update the piece
      pieces = pieces.map(p => p.id === oldId ? updatedPiece : p);
      ui.renderPieces(pieces, updatePiece, deletePiece);
      ui.showToast("Pieza actualizada", "Se ha actualizado la pieza correctamente");
    }
    
    // Delete piece function
    function deletePiece(pieceId) {
      pieces = pieces.filter(p => p.id !== pieceId);
      ui.renderPieces(pieces, updatePiece, deletePiece);
      ui.showToast("Pieza eliminada", "Se ha eliminado la pieza correctamente");
    }
    
    // Add board function
    function addBoard() {
      const newBoard = new Board();
      boards.push(newBoard);
      ui.renderBoards(boards, updateBoard, deleteBoard);
      ui.showToast("Tabla añadida", "Se ha añadido una nueva tabla");
    }
    
    // Update board function
    function updateBoard(updatedBoard, oldId) {
      // Check if ID already exists (except for the current board)
      const existingBoard = boards.find(b => b.id === updatedBoard.id && b.id !== oldId);
      if (existingBoard) {
        ui.showToast("Error", "Ya existe una tabla con ese ID", "error");
        return;
      }
      
      // Update the board
      boards = boards.map(b => b.id === oldId ? updatedBoard : b);
      ui.renderBoards(boards, updateBoard, deleteBoard);
      ui.showToast("Tabla actualizada", "Se ha actualizado la tabla correctamente");
      
      // Update active board if needed
      if (activeBoard === oldId) {
        activeBoard = updatedBoard.id;
      }
    }
    
    // Delete board function
    function deleteBoard(boardId) {
      boards = boards.filter(b => b.id !== boardId);
      ui.renderBoards(boards, updateBoard, deleteBoard);
      ui.showToast("Tabla eliminada", "Se ha eliminado la tabla correctamente");
      
      // Update active board if needed
      if (activeBoard === boardId && boards.length > 0) {
        activeBoard = boards[0].id;
      }
    }
    
    // Calculate cuts function
    function calculateCuts() {
      if (pieces.length === 0) {
        ui.showToast("Error", "Debes añadir al menos una pieza", "error");
        return;
      }
      
      if (boards.length === 0) {
        ui.showToast("Error", "Debes añadir al menos una tabla", "error");
        return;
      }
      
      const params = ui.getSimulatorParams();
      results = calculateCutsMultiple(boards, pieces, params);
      
      // Set active board to the first one with results
      if (results.length > 0) {
        activeBoard = results[0].boardId;
      }
      
      // Update UI
      ui.renderBoardTabs(results, boards, activeBoard, selectBoard);
      ui.drawCuts(results, boards, pieces, activeBoard);
      ui.updateResults(results, boards, pieces, activeBoard);
      
      ui.showToast("Cálculo completado", "Se han calculado los cortes correctamente");
    }
    
    // Select board function
    function selectBoard(boardId) {
      activeBoard = boardId;
      ui.renderBoardTabs(results, boards, activeBoard, selectBoard);
      ui.drawCuts(results, boards, pieces, activeBoard);
      ui.updateResults(results, boards, pieces, activeBoard);
    }
    
    // Save project function
    function saveProject() {
      try {
        const projectData = {
          pieces,
          boards,
          params: ui.getSimulatorParams()
        };
        
        localStorage.setItem("cuttingSimulatorProject", JSON.stringify(projectData));
        ui.showToast("Proyecto guardado", "Tu proyecto ha sido guardado en el navegador");
      } catch (error) {
        ui.showToast("Error al guardar", "No se pudo guardar el proyecto", "error");
      }
    }
    
    // Load project function
    function loadProject() {
      try {
        const savedProject = localStorage.getItem("cuttingSimulatorProject");
        
        if (!savedProject) {
          ui.showToast("No hay proyecto guardado", "No se encontró ningún proyecto guardado", "error");
          return;
        }
        
        const projectData = JSON.parse(savedProject);
        
        // Load pieces
        if (projectData.pieces && Array.isArray(projectData.pieces)) {
          pieces = projectData.pieces.map(p => new Piece(p.id, p.width, p.height, p.quantity, p.color));
          ui.renderPieces(pieces, updatePiece, deletePiece);
        }
        
        // Load boards
        if (projectData.boards && Array.isArray(projectData.boards)) {
          boards = projectData.boards.map(b => new Board(b.id, b.width, b.height, b.name));
          ui.renderBoards(boards, updateBoard, deleteBoard);
        }
        
        // Load params
        if (projectData.params) {
          ui.setSimulatorParams(new SimulatorParams(
            projectData.params.cutThickness,
            projectData.params.margin,
            projectData.params.allowRotation
          ));
        }
        
        ui.showToast("Proyecto cargado", "Tu proyecto ha sido cargado correctamente");
      } catch (error) {
        ui.showToast("Error al cargar", "No se pudo cargar el proyecto", "error");
      }
    }
  });