<template>
  <div id="app">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const canvasWidth = 600
const canvasHeight = 600
const targetFPS: number = 60
const targetFrameDuration: number = 1000 / targetFPS

const gameCanvas = ref<HTMLCanvasElement | null>(null)

const buildings = [
  { id: 0, name: 'farm', x: 200, y: 200, size: 50, color: '#FFFFFF' },
  { id: 1, name: 'warehouse', x: 350, y: 300, size: 50, color: '#FFFF00' }
]

const roads = [
  { id: 0, startId: 0, endId: 1, width: 10, color: '#808080' }
]

const units = [
  { name: 'settler', x: 35, y: 85, size: 10, color: '#63B2D7', speed: 1, carry: false, destinationId: 0 },
  { name: 'settler', x: 35, y: 100, size: 10, color: '#63B2D7', speed: 1, carry: false, destinationId: 0 },
  { name: 'settler', x: 35, y: 115, size: 10, color: '#63B2D7', speed: 1, carry: false, destinationId: 0 }
]

onMounted(() => {
  draw()
  requestAnimationFrame(gameLoop)
})

function draw() {
  if (gameCanvas.value) {
    const context = gameCanvas.value.getContext('2d')!
    for (const building of buildings) {
      context.fillStyle = building.color
      context.fillRect(building.x, building.y, building.size, building.size)
    }
    for (const unit of units) {
      context.fillStyle = unit.color
      context.fillRect(unit.x, unit.y, unit.size, unit.size)
    }
    for (const road of roads) {
      const startBuilding = buildings.find(b => b.id === road.startId)
      const endBuilding = buildings.find(b => b.id === road.endId)

      if (startBuilding && endBuilding) {
        const startX = (startBuilding.x + startBuilding.size <= endBuilding.x) ? startBuilding.x + startBuilding.size : startBuilding.x
        const startY = (startBuilding.y + startBuilding.size <= endBuilding.y) ? startBuilding.y + startBuilding.size / 2 : startBuilding.y + startBuilding.size / 2
        const endX = (startBuilding.x + startBuilding.size <= endBuilding.x) ? endBuilding.x + endBuilding.size / 2 : endBuilding.x + endBuilding.size / 2
        const endY = (startBuilding.y + startBuilding.size <= endBuilding.y) ? endBuilding.y : endBuilding.y + endBuilding.size

        context.beginPath()
        context.lineWidth = road.width
        context.strokeStyle = road.color

        // Draw horizontal line
        context.moveTo(startX, startY)
        context.lineTo(startX > endX ? endX - 5 : endX + 5, startY)
        context.stroke()

        // Draw vertical line
        context.moveTo(endX, startY)
        context.lineTo(endX, endY)
        context.stroke()
      }
    }
  }
}

function moveUnits() {
  // Location
  for (const unit of units) {
    const destination = buildings.filter(x => x.id === unit.destinationId)[0]
    if (unit.x > destination.x) unit.x -= unit.speed
    if (unit.x < destination.x) unit.x += unit.speed
    if (unit.y > destination.y) unit.y -= unit.speed
    if (unit.y < destination.y) unit.y += unit.speed
  }
  // Collision
  for (const unit of units) {
    const destination = buildings.filter(x => x.id === unit.destinationId)[0]
    if ((unit.x + unit.size >= destination.x && unit.x <= destination.x + destination.size ) && (unit.y + unit.size >= destination.y && unit.y <= destination.y + destination.size)) {
      unit.carry = !unit.carry
    }
  }
  // Destinations
  for (const unit of units) {
    if (unit.carry) unit.destinationId = 1
    else unit.destinationId = 0
  }
}

let prevTimestamp: number | null = null
function gameLoop(timestamp: number) {
  const elapsedTime = timestamp - (prevTimestamp || timestamp)
  prevTimestamp = timestamp
  const context = gameCanvas.value!.getContext('2d')!
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  moveUnits()
  draw()
  const timeout: number = Math.max(targetFrameDuration - elapsedTime, 0);
  setTimeout(() => requestAnimationFrame(gameLoop), timeout);
}
</script>
