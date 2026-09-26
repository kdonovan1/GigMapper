import Konva from 'konva'
import { Group, Rect, Text } from 'react-konva'
import { assetLibrary } from '../../assets/assetLibrary'
import type { StageElement } from '../../types'

const FEET_SNAP = 0.5

function roundToSnap(value: number): number {
  return Math.round(value / FEET_SNAP) * FEET_SNAP
}

interface StageElementShapeProps {
  element: StageElement
  pxPerFt: number
  canvasWidthPx: number
  canvasHeightPx: number
  isSelected: boolean
  isLinkedHighlight: boolean
  onSelect: () => void
  onChange: (patch: Partial<StageElement>) => void
  groupRef: (node: Konva.Group | null) => void
}

export function StageElementShape({
  element,
  pxPerFt,
  canvasWidthPx,
  canvasHeightPx,
  isSelected,
  isLinkedHighlight,
  onSelect,
  onChange,
  groupRef,
}: StageElementShapeProps) {
  const entry = assetLibrary[element.type]
  const widthPx = element.widthFt * pxPerFt
  const depthPx = element.depthFt * pxPerFt
  const isTentative = element.status === 'tentative'

  return (
    <Group
      ref={groupRef}
      x={element.xFt * pxPerFt}
      y={element.yFt * pxPerFt}
      offsetX={widthPx / 2}
      offsetY={depthPx / 2}
      rotation={element.rotationDeg}
      draggable
      dragBoundFunc={(pos) => ({
        x: Math.min(Math.max(pos.x, widthPx / 2), Math.max(widthPx / 2, canvasWidthPx - widthPx / 2)),
        y: Math.min(Math.max(pos.y, depthPx / 2), Math.max(depthPx / 2, canvasHeightPx - depthPx / 2)),
      })}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const xFt = roundToSnap(e.target.x() / pxPerFt)
        const yFt = roundToSnap(e.target.y() / pxPerFt)
        // react-konva only re-applies a prop when its value actually changes, so if the
        // snapped value equals what it already was, force the node back to the exact
        // snapped pixel position ourselves rather than leaving it wherever it was dropped.
        e.target.position({ x: xFt * pxPerFt, y: yFt * pxPerFt })
        onChange({ xFt, yFt })
      }}
      onTransformEnd={(e) => {
        const rotationDeg = Math.round(e.target.rotation())
        e.target.rotation(rotationDeg)
        onChange({ rotationDeg })
      }}
    >
      <Rect
        width={widthPx}
        height={depthPx}
        fill={entry.fill}
        opacity={isTentative ? 0.55 : 1}
        stroke={isSelected || isLinkedHighlight ? '#ffcc00' : '#1a1a1a'}
        strokeWidth={isSelected || isLinkedHighlight ? 3 : 1}
        dash={isTentative ? [8, 6] : undefined}
        cornerRadius={2}
      />
      <Text
        text={element.label || entry.glyph}
        width={widthPx}
        height={depthPx}
        align="center"
        verticalAlign="middle"
        fontSize={Math.max(10, Math.min(14, widthPx / 8))}
        fill="#ffffff"
        opacity={isTentative ? 0.75 : 1}
        listening={false}
      />
    </Group>
  )
}
