"use client"

import type React from "react"

import { useState } from "react"
import type { Piece } from "./cutting-simulator"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Check, X } from "lucide-react"

interface PiecesManagerProps {
  pieces: Piece[]
  onUpdatePiece: (piece: Piece) => void
  onDeletePiece: (pieceId: string) => void
}

export function PiecesManager({ pieces, onUpdatePiece, onDeletePiece }: PiecesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Piece | null>(null)

  const handleEdit = (piece: Piece) => {
    setEditingId(piece.id)
    setEditForm({ ...piece })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdatePiece(editForm)
      setEditingId(null)
      setEditForm(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return

    const { name, value } = e.target
    setEditForm({
      ...editForm,
      [name]: name === "id" ? value : Number.parseFloat(value) || 0,
    })
  }

  return (
    <div className="space-y-4">
      {pieces.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay piezas. Añade una pieza para comenzar.</div>
      ) : (
        pieces.map((piece) => (
          <Card key={piece.id}>
            <CardContent className="p-4">
              {editingId === piece.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ID</label>
                      <Input name="id" value={editForm?.id || ""} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cantidad</label>
                      <Input
                        name="quantity"
                        type="number"
                        min="1"
                        value={editForm?.quantity || 0}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ancho (cm)</label>
                      <Input
                        name="width"
                        type="number"
                        min="1"
                        step="0.1"
                        value={editForm?.width || 0}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Alto (cm)</label>
                      <Input
                        name="height"
                        type="number"
                        min="1"
                        step="0.1"
                        value={editForm?.height || 0}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-sm mr-3"
                      style={{ backgroundColor: piece.color || "#76b5c5" }}
                    ></div>
                    <div>
                      <h3 className="font-medium">{piece.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {piece.width}×{piece.height} cm - Cantidad: {piece.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(piece)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDeletePiece(piece.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

