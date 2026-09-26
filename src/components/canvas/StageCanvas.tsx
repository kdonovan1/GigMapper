import Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Layer, Line, Stage, Transformer } from 'react-konva'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import type { StagePlotProject } from '../../types'
import { StageElementShape } from './StageElementShape'

interface StageCanvasProps {
  project: StagePlotProject
}

function buildGridLines(widthPx: number, heightPx: number, pxPerFt: number, stageWidthFt: number, stageDepthFt: number) {
  const lines: { points: number[]; bold: boolean }[] = []
  for (let ft = 0; ft <= stageWidthFt; ft++) {
    const x = ft * pxPerFt
    lines.push({ points: [x, 0, x, heightPx], bold: ft % 5 === 0 })
  }
  for (let ft = 0; ft <= stageDepthFt; ft++) {
    const y = ft * pxPerFt
    lines.push({ points: [0, y, widthPx, y], bold: ft % 5 === 0 })
  }
  return lines
}

export function StageCanvas({ project }: StageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const nodeRefs = useRef<Record<string, Konva.Group | null>>({})
  const transformerRef = useRef<Konva.Transformer>(null)

  const updateElement = useProjectStore((s) => s.updateElement)
  const { selectedElementId, selectedChannelId, selectElement } = useUiStore()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setContainerWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pxPerFt = containerWidth / project.stageWidthFt
  const heightPx = project.stageDepthFt * pxPerFt
  const gridLines = buildGridLines(containerWidth, heightPx, pxPerFt, project.stageWidthFt, project.stageDepthFt)

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    const node = selectedElementId ? nodeRefs.current[selectedElementId] : null
    transformer.nodes(node ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [selectedElementId, project.elements])

  const linkedElementId = project.channels.find((c) => c.id === selectedChannelId)?.linkedElementId ?? null

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Stage
        width={containerWidth}
        height={heightPx}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) selectElement(null)
        }}
      >
        <Layer listening={false}>
          {gridLines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.bold ? '#b8b8b8' : '#e6e6e6'}
              strokeWidth={line.bold ? 1.5 : 0.75}
            />
          ))}
        </Layer>
        <Layer>
          {project.elements.map((element) => (
            <StageElementShape
              key={element.id}
              element={element}
              pxPerFt={pxPerFt}
              isSelected={element.id === selectedElementId}
              isLinkedHighlight={element.id === linkedElementId}
              onSelect={() => selectElement(element.id)}
              onChange={(patch) => updateElement(project.id, element.id, patch)}
              groupRef={(node) => {
                nodeRefs.current[element.id] = node
              }}
            />
          ))}
          <Transformer
            ref={transformerRef}
            resizeEnabled={false}
            rotateEnabled
            borderEnabled={false}
            anchorSize={9}
          />
        </Layer>
      </Stage>
    </div>
  )
}
