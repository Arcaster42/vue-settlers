import { Blueprint, Building, Button, RoadPath, Unit } from "../types/types";

export function drawHud(gameCanvas: HTMLCanvasElement, buttons: Button[], selectedBuilding?: string | undefined) {
  const hudHeight = 80;
  const padding = 10;
  const context = gameCanvas.getContext('2d')
  // Draw Hud
  // Draw the horizontal bar
  if (context) {
    context.fillStyle = 'gray';
    context.fillRect(0, gameCanvas.height - hudHeight, gameCanvas.width, hudHeight);
    
    for (const button of buttons) {
      context.fillStyle = 'blue';
      context.fillRect(button.x, button.y, button.w, button.h);
      
      context.fillStyle = 'white';
      context.font = 'bold 16px Arial';
      context.fillText(button.label, button.x + padding, gameCanvas.height - hudHeight / 1.35 + padding);
    }
  }
}

export function drawRoads(gameCanvas: HTMLCanvasElement, roadPaths: RoadPath[]) {
  const context = gameCanvas.getContext('2d')!
  for (const roadPath of roadPaths) {
      context.beginPath()
      context.lineWidth = 10
      context.strokeStyle = '#808080'

      // Draw horizontal line
      context.moveTo(roadPath.x1, roadPath.y1)
      context.lineTo(roadPath.x1 > roadPath.x2 ? roadPath.x2 - 5 : roadPath.x2 + 5, roadPath.y1)
      context.stroke()

      // Draw vertical line
      context.moveTo(roadPath.x2, roadPath.y1)
      context.lineTo(roadPath.x2, roadPath.y2)
      context.stroke()
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
  for (const building of buildings) {
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
  context.fillRect(x - (blueprint.size / 2), y - (blueprint.size / 2), blueprint.size, blueprint.size)
  context.strokeStyle = 'red'
  context.lineWidth = 2
  context.strokeRect(x - (blueprint.size / 2), y - (blueprint.size / 2), blueprint.size, blueprint.size)
  context.globalAlpha = 1
}