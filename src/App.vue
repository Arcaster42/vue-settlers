<template>
  <div id="app">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import easystar from 'easystarjs'
import { isOnRoad, isClicked, snapToGrid } from './helpers/calculations'
import { Building, RoadPath, Unit, Blueprint } from './types/types'
import { drawHud, drawRoads, drawUnits, drawBuildings, drawBuildingShadow } from './helpers/draws'
import { FPS, TILE_SIZE } from './helpers/constants'

const eStar = new easystar.js()

const canvasWidth = 600
const canvasHeight = 600
const tileSize = TILE_SIZE
const gridWidth = Math.ceil(canvasWidth / tileSize)
const gridHeight = Math.ceil(canvasHeight / tileSize)
const targetFPS: number = FPS
const targetFrameDuration: number = 1000 / targetFPS

const gameCanvas = ref<HTMLCanvasElement | null>(null)
let mouseX: number, mouseY: number
let mouseDown = ref(false)

// HUD
const hudHeight = 80
const padding = 10
let buttons: { label: string, x: number, y: number, w: number, h: number }[] = []

// Game State
const resources = reactive({
  grain: 0
})

// Building Creation
const selectedBlueprint = ref<string | null>(null)

// Building Blueprints
const blueprints: Blueprint[] = [
  { name: 'road', size: 10, color: '#808080', newSettler: false },
  { name: 'warehouse', size: 50, color: '#FFFF00', newSettler: false },
  { name: 'farm', size: 50, color: '#FFFFFF', newSettler: true }
]

const buildings: Building[] = reactive([
  // { id: 0, name: 'farm', x: 50, y: 100, size: 50, color: '#FFFFFF' },
  // { id: 1, name: 'warehouse', x: 350, y: 300, size: 50, color: '#FFFF00' },
  // { id: 2, name: 'farm', x: 120, y: 400, size: 50, color: '#FFFFFF' },
])

const roads: any = [
  // { id: 0, startId: 0, endId: 1, width: 10, color: '#808080' },
  // { id: 1, startId: 2, endId: 1, width: 10, color: '#808080' }
]

let roadPaths: RoadPath[] = []
let grid: any[][]

const units: Unit[] = [
  // { name: 'settler', x: 35, y: 85, size: 10, color: '#63B2D7', speed: 1, carry: false, destinationId: 0 },
  // { name: 'settler', x: 35, y: 100, size: 10, color: '#63D788', speed: 1, carry: false, destinationId: 0 },
  // { name: 'settler', x: 35, y: 115, size: 10, color: '#C463D7', speed: 1, carry: false, destinationId: 0 },
  // { name: 'settler', x: 50, y: 100, size: 10, color: '#A5D357', speed: 1, carry: false, destinationId: 0 }
]

onMounted(() => {
  buttons = [
    { label: 'Farm', x: padding, y: gameCanvas.value!.height - hudHeight + padding, w: 100, h: hudHeight - 5 * padding },
    { label: 'Warehouse', x: 170 + padding, y: gameCanvas.value!.height - hudHeight + padding, w: 100, h: hudHeight - 5 * padding },
    { label: 'Road', x: 340 + padding, y: gameCanvas.value!.height - hudHeight + padding, w: 100, h: hudHeight - 5 * padding },
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
    gameCanvas.value!.addEventListener('mousedown', e => mouseDown.value = true)
    gameCanvas.value!.addEventListener('mouseup', e => mouseDown.value = false)
  })

  // Allow Right-Click
  gameCanvas.value!.addEventListener('contextmenu', e => {
    e.preventDefault()
    if (selectedBlueprint.value) selectedBlueprint.value = null
  })

  draw()
  requestAnimationFrame(gameLoop)
})

function handleClick() {
  if (selectedBlueprint.value) {
    const blueprint = blueprints.find(x => x.name === selectedBlueprint.value)!
    const snappedX = snapToGrid(mouseX - (blueprint.size / 2))
    const snappedY = snapToGrid(mouseY - (blueprint.size / 2))
    const buildingId = buildings.length
    buildings.push({ id: buildings.length, name: selectedBlueprint.value, x: snappedX, y: snappedY, size: blueprint.size, color: blueprint.color })
    selectedBlueprint.value = null
    if (blueprint.newSettler) {
      const warehouse = buildings.find(x => x.name === 'warehouse')
      if (warehouse === undefined) console.log('no warehouse on unit creation')
      units.push({ id: units.length, name: 'settler', x: snappedX, y: snappedY, size: 10, color: '#63B2D7', speed: 1, carry: true, ownerId: buildingId, warehouseId: warehouse?.id })
    }
    drawGrid()
  }
  for (const button of buttons) {
    if (isClicked(button.x, button.y, button.w, button.h, mouseX, mouseY)) {
      selectedBlueprint.value = button.label.toLowerCase()
    }
  }
}

function draw() {
  if (gameCanvas.value) {
    drawHud(gameCanvas.value, buttons)
    drawRoads(gameCanvas.value, buildings)
    drawUnits(gameCanvas.value, units)
    drawBuildings(gameCanvas.value, buildings)
    if (selectedBlueprint.value) drawBuildingShadow(gameCanvas.value!, blueprints, selectedBlueprint.value, mouseX, mouseY)
  }
}

function moveUnits() {
  // A*
  if (!grid) {
    drawGrid()
  }
  
  eStar.calculate()

  // Location
  for (const unit of units) {
    if (unit.warehouseId === undefined) {
      console.log('no warehouse')
      if (buildings.filter(x => x.name === 'warehouse').length) {
        const closestWarehouse = buildings
        .filter(building => building.name === 'warehouse')
        .reduce((prev, current) => {
          const prevDist = Math.sqrt((prev.x - unit.x) ** 2 + (prev.y - unit.y) ** 2)
          const currDist = Math.sqrt((current.x - unit.x) ** 2 + (current.y - unit.y) ** 2)
          return currDist < prevDist ? current : prev
        })
        console.log('no warehouse found')
        if (!closestWarehouse) return
        else unit.warehouseId = closestWarehouse.id
      }
    }
    if (unit.warehouseId === undefined) continue
    const destination = unit.carry ? buildings.find(x => x.id === unit.warehouseId) : buildings.find(x => x.id === unit.ownerId)
    if (!destination) continue
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
        if (unit.x > nextX) unit.x -= isOnRoad(buildings, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.x < nextX) unit.x += isOnRoad(buildings, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.y > nextY) unit.y -= isOnRoad(buildings, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
        if (unit.y < nextY) unit.y += isOnRoad(buildings, tileSize, unit.x, unit.y) ? unit.speed + 1 : unit.speed
      } else console.error('no path')
    })
  }

  // Collision & New Destination
  for (const unit of units) {
    const destination = unit.carry ? buildings.find(x => x.id === unit.warehouseId) : buildings.find(x => x.id === unit.ownerId)
    if (destination === undefined) continue
    if ((unit.x + unit.size >= destination.x && unit.x <= destination.x + destination.size ) && (unit.y + unit.size >= destination.y && unit.y <= destination.y + destination.size)) {
      unit.carry = !unit.carry
    }
  }
}

function drawGrid() {
  grid = Array.from({ length: gridHeight }, () =>
    new Array(gridWidth).fill(1))
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const xPos = x * tileSize
        const yPos = y * tileSize
        if (isOnRoad(buildings, tileSize, xPos, yPos)) {
          grid[y][x] = 0
        }
      }
    }
  eStar.setGrid(grid)
  eStar.setAcceptableTiles([0, 1])
  eStar.setTileCost(0, 1)
  eStar.setTileCost(1, 20)
}

let prevTimestamp: number | null = null
function gameLoop(timestamp: number) {
  const elapsedTime = timestamp - (prevTimestamp || timestamp)
  prevTimestamp = timestamp
  const context = gameCanvas.value!.getContext('2d')!
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  moveUnits()
  // roadPaths = setRoadPaths(roads, buildings)
  draw()
  const timeout: number = Math.max(targetFrameDuration - elapsedTime, 0)
  setTimeout(() => requestAnimationFrame(gameLoop), timeout)
}
</script>
