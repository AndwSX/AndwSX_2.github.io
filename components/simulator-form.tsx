"use client"

import type React from "react"

import type { SimulatorParams } from "./cutting-simulator"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SimulatorFormProps {
  params: SimulatorParams
  onParamsChange: (params: SimulatorParams) => void
}

export function SimulatorForm({ params, onParamsChange }: SimulatorFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    onParamsChange({
      ...params,
      [name]: Number.parseFloat(value) || 0,
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    onParamsChange({
      ...params,
      allowRotation: checked,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cutThickness">Grosor del corte (cm)</Label>
            <Input
              id="cutThickness"
              name="cutThickness"
              type="number"
              min="0"
              step="0.1"
              value={params.cutThickness}
              onChange={handleChange}
            />
            <p className="text-sm text-muted-foreground">Espacio que ocupa la sierra al realizar el corte</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="margin">Margen de borde (cm)</Label>
            <Input
              id="margin"
              name="margin"
              type="number"
              min="0"
              step="0.1"
              value={params.margin}
              onChange={handleChange}
            />
            <p className="text-sm text-muted-foreground">Espacio entre el borde de la tabla y el primer corte</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="allowRotation" checked={params.allowRotation} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="allowRotation">Permitir rotación de piezas</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

