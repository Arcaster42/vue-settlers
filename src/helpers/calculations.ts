import { Building, Road, RoadPath } from "../types/types"

export function isOnRoad(roads: Road[], roadPaths: RoadPath[], tileSize: number, x: number, y: number) {
  const halfRoadWidth = roads[0].width / 2
  for (const roadPath of roadPaths) {
    const isHorizontalRoad =
      y + tileSize / 2 >= roadPath.y1 - halfRoadWidth &&
      y + tileSize / 2 <= roadPath.y1 + halfRoadWidth
    const isVerticalRoad =
      x + tileSize / 2 >= roadPath.x2 - halfRoadWidth &&
      x + tileSize / 2 <= roadPath.x2 + halfRoadWidth

    if (
      (x + tileSize / 2 >= roadPath.x1 &&
        x + tileSize / 2 <= roadPath.x2 &&
        isHorizontalRoad) ||
      (y + tileSize / 2 >= roadPath.y1 &&
        y + tileSize / 2 <= roadPath.y2 &&
        isVerticalRoad)
    ) {
      return true
    }
  }
  return false
}

export function isClicked(x: number, y: number, w: number, h: number, mX: number, mY: number) {
  if ((mX >= x && mX <= x + w) && (mY >= y && mY <= y + h)) return true
  return false
}

export function setRoadPaths(roads: Road[], buildings: Building[]) {
  const roadPaths = []
  for (const road of roads) {
    const startBuilding = buildings.find(b => b.id === road.startId)
    const endBuilding = buildings.find(b => b.id === road.endId)
    if (startBuilding && endBuilding) {
      const startX = (startBuilding.x + startBuilding.size <= endBuilding.x) ? startBuilding.x + startBuilding.size : startBuilding.x
      const startY = (startBuilding.y + startBuilding.size <= endBuilding.y) ? startBuilding.y + startBuilding.size / 2 : startBuilding.y + startBuilding.size / 2
      const endX = (startBuilding.x + startBuilding.size <= endBuilding.x) ? endBuilding.x + endBuilding.size / 2 : endBuilding.x + endBuilding.size / 2
      const endY = (startBuilding.y + startBuilding.size <= endBuilding.y) ? endBuilding.y : endBuilding.y + endBuilding.size
      roadPaths.push({ x1: startX, x2: endX, y1: startY, y2: endY })
    }
  }
  return roadPaths
}