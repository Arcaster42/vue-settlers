<template>
  <div id="app">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import easystar from 'easystarjs'
import { isOnRoad, isClicked, setRoadPaths } from './helpers/calculations'
import { RoadPath } from './types/types'
import { drawHud, drawRoads, drawUnits, drawBuildings, drawBuildingShadow } from './helpers/draws'

const eStar = new easystar.js()

const canvasWidth = 600
const canvasHeight = 600
const tileSize = 10
const gridWidth = Math.ceil(canvasWidth / tileSize)
const gridHeight = Math.ceil(canvasHeight / tileSize)
const targetFPS: number = 60
const targetFrameDuration: number = 1000 / targetFPS

const gameCanvas = ref<HTMLCanvasElement | null>(null)
let mouseX: number, mouseY: number

// HUD
const hudHeight = 80;
const padding = 10;
let buttons: { label: string, x: number, y: number, w: number, h: number }[] = []

// Building Creation
const selectedBuilding = ref<string | null>(null)

// Building Blueprints
const blueprints = [
  { name: 'warehouse', size: 50, color: '#FFFF00' },
  { name: 'farm', size: 50, color: '#FFFFFF' }
]

const buildings = [
  { id: 0, name: 'farm', x: 50, y: 100, size: 50, color: '#FFFFFF' },
  { id: 1, name: 'warehouse', x: 350, y: 300, size: 50, color: '#FFFF00' },
  { id: 2, name: 'farm', x: 120, y: 400, size: 50, color: '#FFFFFF' },
]
let nextFarmId = 0

const roads = [
  { id: 0, startId: 0, endId: 1, width: 10, color: '#808080' },
  { id: 1, startId: 2, endId: 1, width: 10, color: '#808080' }
]

let roadPaths: RoadPath[] = []
let grid: any[][]

const units = [
  { name: 'settler', x: 35, y: 85, size: 10, color: '#63B2D7', speed: 1, carry: false, destinationId: 0 },
  { name: 'settler', x: 35, y: 100, size: 10, color: '#63D788', speed: 1, carry: false, destinationId: 0 },
  { name: 'settler', x: 35, y: 115, size: 10, color: '#C463D7', speed: 1, carry: false, destinationId: 0 },
  { name: 'settler', x: 50, y: 100, size: 10, color: '#A5D357', speed: 1, carry: false, destinationId: 0 }
]

onMounted(() => {
  buttons = [
    { label: 'Farm', x: padding, y: gameCanvas.value!.height - hudHeight + padding, w: 100, h: hudHeight - 5 * padding },
    { label: 'Warehouse', x: 170 + padding, y: gameCanvas.value!.height - hudHeight + padding, w: 100, h: hudHeight - 5 * padding }
  ]

  // Track Mouse
  gameCanvas.value!.addEventListener('mousemove', (e) => {
    const rect = gameCanvas.value!.getBoundingClientRect()
    const scaleX = gameCanvas.value!.width / rect.width
    const scaleY = gameCanvas.value!.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    mouseX = x
    mouseY = y
    gameCanvas.value!.addEventListener('click', handleClick)
  })

  // Allow Right-Click
  gameCanvas.value!.addEventListener('contextmenu', e => {
    e.preventDefault()
    if (selectedBuilding.value) selectedBuilding.value = null
  })

  roadPaths = setRoadPaths(roads, buildings)
  draw()
  requestAnimationFrame(gameLoop)
})

function handleClick() {
  if (selectedBuilding.value) {
    const blueprint = blueprints.find(x => x.name === selectedBuilding.value)!
    buildings.push({ id: buildings.length, name: selectedBuilding.value, x: mouseX - (blueprint.size / 2), y: mouseY - (blueprint.size / 2), size: blueprint.size, color: blueprint.color })
    selectedBuilding.value = null
  }
  for (const button of buttons) {
    if (isClicked(button.x, button.y, button.w, button.h, mouseX, mouseY)) {
      selectedBuilding.value = button.label.toLowerCase()
    }
  }
}

function draw() {
  if (gameCanvas.value) {
    drawHud(gameCanvas.value, buttons)
    drawRoads(gameCanvas.value, roadPaths)
    drawUnits(gameCanvas.value, units)
    drawBuildings(gameCanvas.value, buildings)
    if (selectedBuilding.value) drawBuildingShadow(gameCanvas.value!, blueprints, selectedBuilding.value, mouseX, mouseY)
  }
}

function moveUnits() {
  // A*
  if (!grid) {
    grid = Array.from({ length: gridHeight }, () =>
    new Array(gridWidth).fill(1))
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const xPos = x * tileSize
        const yPos = y * tileSize
        if (isOnRoad(roads, roadPaths, tileSize, xPos, yPos)) {
          grid[y][x] = 0
        }
      }
    }
    eStar.setGrid(grid)
    eStar.setAcceptableTiles([0, 1])
    eStar.setTileCost(0, 1)
    eStar.setTileCost(1, 20)
  }

  // Location
  for (const unit of units) {
    const destination = buildings.filter(x => x.id === unit.destinationId)[0]
    const destX = destination.x + destination.size / 2 - unit.size / 2
    const destY = destination.y + destination.size / 2 - unit.size / 2
    const startX = Math.floor(unit.x / tileSize)
    const startY = Math.floor(unit.y / tileSize)
    const endX = Math.floor(destX / tileSize)
    const endY = Math.floor(destY / tileSize)
    eStar.findPath(startX, startY, endX, endY, (path) => {
      if (path && path.length) {
        const nextTile = path[1]
        const nextX = nextTile.x * tileSize + tileSize / 2 - unit.size / 2
        const nextY = nextTile.y * tileSize + tileSize / 2 - unit.size / 2
        if (unit.x > nextX) unit.x -= isOnRoad(roads, roadPaths, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.x < nextX) unit.x += isOnRoad(roads, roadPaths, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.y > nextY) unit.y -= isOnRoad(roads, roadPaths, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.y < nextY) unit.y += isOnRoad(roads, roadPaths, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
      } else console.error('no path')
    })
  }

  // Collision
  for (const unit of units) {
    const destination = buildings.filter(x => x.id === unit.destinationId)[0]
    if ((unit.x + unit.size >= destination.x && unit.x <= destination.x + destination.size ) && (unit.y + unit.size >= destination.y && unit.y <= destination.y + destination.size)) {
      unit.carry = !unit.carry
      unit.destinationId = nextFarmId
      nextFarmId = nextFarmId === 0 ? 2 : 0
    }
  }

  // Destinations
  for (const unit of units) {
    if (unit.carry) unit.destinationId = 1
  }

  eStar.calculate()
}

let prevTimestamp: number | null = null
function gameLoop(timestamp: number) {
  const elapsedTime = timestamp - (prevTimestamp || timestamp)
  prevTimestamp = timestamp
  const context = gameCanvas.value!.getContext('2d')!
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  moveUnits()
  roadPaths = setRoadPaths(roads, buildings)
  draw()
  const timeout: number = Math.max(targetFrameDuration - elapsedTime, 0);
  setTimeout(() => requestAnimationFrame(gameLoop), timeout);
}
</script>
