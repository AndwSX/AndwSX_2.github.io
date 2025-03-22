import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Board, CutResult, Piece } from "./cutting-simulator"

interface SimulatorResultsProps {
  results: CutResult[]
  boards: Board[]
  pieces: Piece[]
  activeBoard: string
}

export function SimulatorResults({ results, boards, pieces, activeBoard }: SimulatorResultsProps) {
  // Find the active result
  const activeResult = results.find((r) => r.boardId === activeBoard)
  if (!activeResult) return null

  // Find the active board
  const board = boards.find((b) => b.id === activeBoard)
  if (!board) return null

  // Calculate total pieces placed
  const totalPiecesPlaced = activeResult.placements.length

  // Count pieces by type
  const pieceCounts: Record<string, number> = {}
  activeResult.placements.forEach((placement) => {
    const pieceId = placement.pieceId
    pieceCounts[pieceId] = (pieceCounts[pieceId] || 0) + 1
  })

  // Calculate total area
  const boardArea = board.width * board.height
  const usedArea = boardArea * (1 - activeResult.wastePercentage / 100)
  const wasteArea = boardArea - usedArea

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados - {board.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total de piezas colocadas</p>
            <p className="text-2xl font-bold">{totalPiecesPlaced}</p>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium mb-2">Piezas por tipo</h3>
            <div className="space-y-2">
              {Object.entries(pieceCounts).map(([pieceId, count]) => {
                const piece = pieces.find((p) => p.id === pieceId)
                if (!piece) return null

                return (
                  <div key={pieceId} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 mr-2 rounded-sm"
                        style={{ backgroundColor: piece.color || "#76b5c5" }}
                      ></div>
                      <span>
                        {pieceId} ({piece.width}×{piece.height} cm)
                      </span>
                    </div>
                    <span className="font-medium">
                      {count} / {piece.quantity}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium mb-2">Eficiencia</h3>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${100 - activeResult.wastePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Utilizado: {(100 - activeResult.wastePercentage).toFixed(2)}%</span>
                <span>Desperdicio: {activeResult.wastePercentage.toFixed(2)}%</span>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <p>Área total: {boardArea.toFixed(2)} cm²</p>
              <p>Área utilizada: {usedArea.toFixed(2)} cm²</p>
              <p>Área desperdiciada: {wasteArea.toFixed(2)} cm²</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium mb-2">Resumen de todas las tablas</h3>
            <div className="space-y-2">
              {results.map((result) => {
                const board = boards.find((b) => b.id === result.boardId)
                if (!board) return null

                return (
                  <div key={result.boardId} className="flex justify-between items-center">
                    <span>{board.name}</span>
                    <span>
                      {result.placements.length} piezas ({(100 - result.wastePercentage).toFixed(2)}% utilizado)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

