"use client"

import type React from "react"

import { useState } from "react"
import type { Board } from "./cutting-simulator"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Check, X } from "lucide-react"

interface TablesManagerProps {
  boards: Board[]
  onUpdateBoard: (board: Board) => void
  onDeleteBoard: (boardId: string) => void
}

export function TablesManager({ boards, onUpdateBoard, onDeleteBoard }: TablesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Board | null>(null)

  const handleEdit = (board: Board) => {
    setEditingId(board.id)
    setEditForm({ ...board })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdateBoard(editForm)
      setEditingId(null)
      setEditForm(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return

    const { name, value } = e.target
    setEditForm({
      ...editForm,
      [name]: name === "id" || name === "name" ? value : Number.parseFloat(value) || 0,
    })
  }

  return (
    <div className="space-y-4">
      {boards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay tablas. Añade una tabla para comenzar.</div>
      ) : (
        boards.map((board) => (
          <Card key={board.id}>
            <CardContent className="p-4">
              {editingId === board.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ID</label>
                      <Input name="id" value={editForm?.id || ""} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nombre</label>
                      <Input name="name" value={editForm?.name || ""} onChange={handleChange} />
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
                  <div>
                    <h3 className="font-medium">{board.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {board.width}×{board.height} cm
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(board)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDeleteBoard(board.id)}>
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

