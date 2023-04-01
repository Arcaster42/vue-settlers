export type RoadPath = { x1: number, x2: number, y1: number, y2: number }
export type Road = { id: number, startId: number, endId: number, width: number, color: string }
export type Blueprint = { name: string, size: number, color: string, newSettler: boolean }
export type Building = { id: number, name: string, x: number, y: number, size: number, color: string }
export type Unit = { id: number, name: string, x: number, y: number, size: number, color: string, speed: number, carry: boolean, warehouseId?: number, ownerId: number }
export type Button = { label: string, x: number, y: number, w: number, h: number }