import { Blueprint, Building, Button, RoadPath, Unit } from "../types/types"
import { snapToGrid } from "./calculations"

export function drawHud(gameCanvas: HTMLCanvasElement, buttons: Button[], selectedBuilding?: string | undefined) {
  const hudHeight = 80
  const padding = 10
  const context = gameCanvas.getContext('2d')
  // Draw Hud
  // Draw the horizontal bar
  if (context) {
    context.fillStyle = 'gray'
    context.fillRect(0, gameCanvas.height - hudHeight, gameCanvas.width, hudHeight)
    
    for (const button of buttons) {
      context.fillStyle = 'blue'
      context.fillRect(button.x, button.y, button.w, button.h)
      
      context.fillStyle = 'white'
      context.font = 'bold 16px Arial'
      context.fillText(button.label, button.x + padding, gameCanvas.height - hudHeight / 1.35 + padding)
    }
  }
}

export function drawRoads(gameCanvas: HTMLCanvasElement, buildings: Building[]) {
  const context = gameCanvas.getContext('2d')!
  for (const road of buildings) {
    context.fillStyle = road.color
    context.fillRect(road.x, road.y, road.size, road.size)
  }
}

export function drawUnits(gameCanvas: HTMLCanvasElement, units: Unit[]) {
  const context = gameCanvas.getContext('2d')!
  for (const unit of units) {
      context.fillStyle = unit.color
      context.fillRect(unit.x, unit.y, unit.size, unit.size)
    }
}

export function drawBuildings(gameCanvas: HTMLCanvasElement, buildings: Building[]) {
  const context = gameCanvas.getContext('2d')!
  for (const building of buildings.filter(x => x.name !== 'road')) {
    context.fillStyle = building.color
    context.fillRect(building.x, building.y, building.size, building.size)
  }
}

export function drawBuildingShadow(gameCanvas: HTMLCanvasElement, blueprints: Blueprint[], selectedBuilding: string, x: number, y: number) {
  const context = gameCanvas.getContext('2d')!
  const blueprint = blueprints.find(x => x.name === selectedBuilding)!
  if (!blueprint) console.error('BAD BLUEPRINT')
  context.fillStyle = blueprint.color
  context.globalAlpha = 0.5
  const snappedX = snapToGrid(x - (blueprint.size / 2))
  const snappedY = snapToGrid(y - (blueprint.size / 2))
  context.fillRect(snappedX, snappedY, blueprint.size, blueprint.size)
  context.strokeStyle = 'red'
  context.lineWidth = 2
  context.strokeRect(snappedX, snappedY, blueprint.size, blueprint.size)
  context.globalAlpha = 1
}