import Konva from 'konva'
import type { Ref } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage, Transformer } from 'react-konva'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import type { StagePlotProject } from '../../types'
import { StageElementShape } from './StageElementShape'

interface StageCanvasProps {
  project: StagePlotProject
  stageRef?: Ref<Konva.Stage>
}

// Layout size is a free-typed number field (ProjectToolbar clamps it too, but this is
// the last line of defense against a 0 or absurdly large value hanging the canvas).
const MIN_STAGE_FT = 1
const MAX_STAGE_FT = 500

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

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function StageCanvas({ project, stageRef }: StageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const nodeRefs = useRef<Record<string, Konva.Group | null>>({})
  const transformerRef = useRef<Konva.Transformer>(null)

  const updateElement = useProjectStore((s) => s.updateElement)
  const removeElement = useProjectStore((s) => s.removeElement)
  const { selectedElementId, selectedChannelId, selectElement, activeTab } = useUiStore()

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Scoped to the Stage Plot tab specifically: the canvas (and its selection)
      // stays mounted on every tab so PNG export keeps working regardless of which
      // tab is visible, but that means a Delete/Backspace press on another tab
      // (e.g. with focus on a plain button, which isTypingTarget doesn't cover)
      // would otherwise silently delete an element the user can't currently see.
      if (
        activeTab !== 'stagePlot' ||
        (e.key !== 'Delete' && e.key !== 'Backspace') ||
        !selectedElementId ||
        isTypingTarget(e.target)
      ) {
        return
      }
      e.preventDefault()
      removeElement(project.id, selectedElementId)
      selectElement(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, project.id, removeElement, selectElement, activeTab])

  const stageWidthFt = Math.min(Math.max(project.stageWidthFt, MIN_STAGE_FT), MAX_STAGE_FT)
  const stageDepthFt = Math.min(Math.max(project.stageDepthFt, MIN_STAGE_FT), MAX_STAGE_FT)
  const pxPerFt = containerWidth / stageWidthFt
  const heightPx = stageDepthFt * pxPerFt
  const gridLines = buildGridLines(containerWidth, heightPx, pxPerFt, stageWidthFt, stageDepthFt)

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
        ref={stageRef}
        width={containerWidth}
        height={heightPx}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) selectElement(null)
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) selectElement(null)
        }}
      >
        <Layer listening={false}>
          {/* A solid backing so the exported PNG/print snapshot isn't transparent. */}
          <Rect x={0} y={0} width={containerWidth} height={heightPx} fill="#ffffff" />
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
              canvasWidthPx={containerWidth}
              canvasHeightPx={heightPx}
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
