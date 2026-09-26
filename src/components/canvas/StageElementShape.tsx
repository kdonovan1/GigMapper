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
  isSelected: boolean
  isLinkedHighlight: boolean
  onSelect: () => void
  onChange: (patch: Partial<StageElement>) => void
  groupRef: (node: Konva.Group | null) => void
}

export function StageElementShape({
  element,
  pxPerFt,
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
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          xFt: roundToSnap(e.target.x() / pxPerFt),
          yFt: roundToSnap(e.target.y() / pxPerFt),
        })
      }}
      onTransformEnd={(e) => {
        onChange({ rotationDeg: Math.round(e.target.rotation()) })
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
