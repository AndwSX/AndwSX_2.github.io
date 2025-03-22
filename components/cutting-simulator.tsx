"use client"

import { useState, useRef, useEffect } from "react"
import { SimulatorForm } from "./simulator-form"
import { SimulatorResults } from "./simulator-results"
import { Button } from "@/components/ui/button"
import { calculateCutsMultiple } from "@/lib/cutting-utils"
import { Download, Printer, Plus, Save, Database } from "lucide-react"
import { TablesManager } from "./tables-manager"
import { PiecesManager } from "./pieces-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export type Piece = {
  id: string
  width: number
  height: number
  quantity: number
  color?: string
}

export type Board = {
  id: string
  width: number
  height: number
  name: string
}

export type CutResult = {
  boardId: string
  placements: {
    pieceId: string
    x: number
    y: number
    width: number
    height: number
    rotated: boolean
  }[]
  wastePercentage: number
  unusedArea: number
}

export type SimulatorParams = {
  cutThickness: number
  margin: number
  allowRotation: boolean
}

// Generate a random color for pieces
const getRandomColor = () => {
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

export function CuttingSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const [results, setResults] = useState<CutResult[]>([])
  const [params, setParams] = useState<SimulatorParams>({
    cutThickness: 0.3,
    margin: 0,
    allowRotation: true,
  })

  const [pieces, setPieces] = useState<Piece[]>([
    { id: "piece1", width: 60, height: 45, quantity: 4, color: getRandomColor() },
  ])

  const [boards, setBoards] = useState<Board[]>([{ id: "board1", width: 240, height: 180, name: "Tabla 1" }])

  const [activeBoard, setActiveBoard] = useState<string>("board1")

  const handleParamsChange = (newParams: SimulatorParams) => {
    setParams(newParams)
  }

  const handleCalculate = () => {
    if (pieces.length === 0) {
      toast({
        title: "Error",
        description: "Debes añadir al menos una pieza",
        variant: "destructive",
      })
      return
    }

    if (boards.length === 0) {
      toast({
        title: "Error",
        description: "Debes añadir al menos una tabla",
        variant: "destructive",
      })
      return
    }

    const results = calculateCutsMultiple(boards, pieces, params)
    setResults(results)

    // Set active board to the first one with results
    if (results.length > 0) {
      setActiveBoard(results[0].boardId)
    }
  }

  const handleAddPiece = () => {
    const newId = `piece${pieces.length + 1}`
    setPieces([
      ...pieces,
      {
        id: newId,
        width: 50,
        height: 30,
        quantity: 1,
        color: getRandomColor(),
      },
    ])
  }

  const handleUpdatePiece = (updatedPiece: Piece) => {
    setPieces(pieces.map((p) => (p.id === updatedPiece.id ? updatedPiece : p)))
  }

  const handleDeletePiece = (pieceId: string) => {
    setPieces(pieces.filter((p) => p.id !== pieceId))
  }

  const handleAddBoard = () => {
    const newId = `board${boards.length + 1}`
    setBoards([...boards, { id: newId, width: 240, height: 180, name: `Tabla ${boards.length + 1}` }])
  }

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoards(boards.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)))
  }

  const handleDeleteBoard = (boardId: string) => {
    setBoards(boards.filter((b) => b.id !== boardId))
    if (activeBoard === boardId && boards.length > 1) {
      setActiveBoard(boards[0].id === boardId ? boards[1].id : boards[0].id)
    }
  }

  useEffect(() => {
    if (results.length > 0 && canvasRef.current) {
      drawCuts()
    }
  }, [results, activeBoard])

  const drawCuts = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Find the active board and its result
    const activeResult = results.find((r) => r.boardId === activeBoard)
    if (!activeResult) return

    const activeboardObj = boards.find((b) => b.id === activeBoard)
    if (!activeboardObj) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions based on aspect ratio
    const maxCanvasWidth = 800
    const maxCanvasHeight = 600

    const aspectRatio = activeboardObj.width / activeboardObj.height
    let canvasWidth, canvasHeight

    if (aspectRatio > maxCanvasWidth / maxCanvasHeight) {
      canvasWidth = maxCanvasWidth
      canvasHeight = canvasWidth / aspectRatio
    } else {
      canvasHeight = maxCanvasHeight
      canvasWidth = canvasHeight * aspectRatio
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Scaling factors
    const scaleX = canvasWidth / activeboardObj.width
    const scaleY = canvasHeight / activeboardObj.height

    // Draw board background
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw board outline
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight)

    // Draw pieces
    activeResult.placements.forEach((placement) => {
      const piece = pieces.find((p) => p.id === placement.pieceId)
      if (!piece) return

      const x = placement.x * scaleX
      const y = placement.y * scaleY
      const width = placement.width * scaleX
      const height = placement.height * scaleY

      // Draw piece
      ctx.fillStyle = piece.color || "#76b5c5"
      ctx.fillRect(x, y, width, height)

      // Draw piece border
      ctx.strokeStyle = "#333"
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, width, height)

      // Draw piece dimensions and ID
      ctx.fillStyle = "#333"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"

      const displayText = placement.rotated
        ? `${placement.height}×${placement.width}`
        : `${placement.width}×${placement.height}`

      ctx.fillText(displayText, x + width / 2, y + height / 2 - 5)

      ctx.fillText(piece.id, x + width / 2, y + height / 2 + 10)
    })

    // Draw board dimensions
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText(
      `${activeboardObj.name}: ${activeboardObj.width}×${activeboardObj.height} cm`,
      canvasWidth / 2,
      canvasHeight - 10,
    )
  }

  const handleExportImage = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `simulador-cortes-${activeBoard}.png`
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
  }

  const handlePrint = () => {
    if (!canvasRef.current) return

    const dataUrl = canvasRef.current.toDataURL("image/png")
    const activeboardObj = boards.find((b) => b.id === activeBoard)
    if (!activeboardObj) return

    const activeResult = results.find((r) => r.boardId === activeBoard)
    if (!activeResult) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Count pieces by type
    const pieceCounts: Record<string, number> = {}
    activeResult.placements.forEach((placement) => {
      const pieceId = placement.pieceId
      pieceCounts[pieceId] = (pieceCounts[pieceId] || 0) + 1
    })

    // Generate piece list HTML
    let pieceListHtml = ""
    Object.entries(pieceCounts).forEach(([pieceId, count]) => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (piece) {
        pieceListHtml += `
          <tr>
            <td>${pieceId}</td>
            <td>${piece.width}×${piece.height} cm</td>
            <td>${count}</td>
          </tr>
        `
      }
    })

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
    `)
    printWindow.document.close()
  }

  const handleSaveProject = () => {
    try {
      const projectData = {
        pieces,
        boards,
        params,
      }

      localStorage.setItem("cuttingSimulatorProject", JSON.stringify(projectData))

      toast({
        title: "Proyecto guardado",
        description: "Tu proyecto ha sido guardado en el navegador",
      })
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el proyecto",
        variant: "destructive",
      })
    }
  }

  const handleLoadProject = () => {
    try {
      const savedProject = localStorage.getItem("cuttingSimulatorProject")

      if (!savedProject) {
        toast({
          title: "No hay proyecto guardado",
          description: "No se encontró ningún proyecto guardado",
          variant: "destructive",
        })
        return
      }

      const projectData = JSON.parse(savedProject)

      setPieces(projectData.pieces || [])
      setBoards(projectData.boards || [])
      setParams(
        projectData.params || {
          cutThickness: 0.3,
          margin: 0,
          allowRotation: true,
        },
      )

      toast({
        title: "Proyecto cargado",
        description: "Tu proyecto ha sido cargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={handleSaveProject}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Proyecto
          </Button>
          <Button variant="outline" onClick={handleLoadProject}>
            <Database className="h-4 w-4 mr-2" />
            Cargar Proyecto
          </Button>
        </div>
        <Button onClick={handleCalculate} variant="default">
          Calcular Cortes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Tabs defaultValue="pieces">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pieces">Piezas</TabsTrigger>
              <TabsTrigger value="boards">Tablas</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="pieces" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Piezas a Cortar</h2>
                <Button onClick={handleAddPiece} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Pieza
                </Button>
              </div>

              <PiecesManager pieces={pieces} onUpdatePiece={handleUpdatePiece} onDeletePiece={handleDeletePiece} />
            </TabsContent>

            <TabsContent value="boards" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tablas Disponibles</h2>
                <Button onClick={handleAddBoard} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Tabla
                </Button>
              </div>

              <TablesManager boards={boards} onUpdateBoard={handleUpdateBoard} onDeleteBoard={handleDeleteBoard} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold">Configuración</h2>
              <SimulatorForm params={params} onParamsChange={handleParamsChange} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Visualización de Cortes</h2>

              {results.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportImage}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {results.map((result) => {
                    const board = boards.find((b) => b.id === result.boardId)
                    return (
                      <Button
                        key={result.boardId}
                        variant={activeBoard === result.boardId ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveBoard(result.boardId)}
                      >
                        {board?.name || result.boardId}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="border rounded-md overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ minHeight: "300px", background: "#f5f5f5" }}
              ></canvas>
            </div>
          </div>

          {results.length > 0 && (
            <SimulatorResults results={results} boards={boards} pieces={pieces} activeBoard={activeBoard} />
          )}
        </div>
      </div>
    </div>
  )
}

