/** Convert viewport (clientX, clientY) to canvas-relative coordinates */
export const getCanvasCoords = (
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

/** Convert canvas coordinates to viewport (for overlays like text input) */
export const canvasToViewport = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = rect.width / canvas.width
  const scaleY = rect.height / canvas.height
  return { x: rect.left + x * scaleX, y: rect.top + y * scaleY }
}
