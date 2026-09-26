import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { AssetPalette } from '../components/canvas/AssetPalette'
import { ElementInspector } from '../components/canvas/ElementInspector'
import { StageCanvas } from '../components/canvas/StageCanvas'
import { AuxSendGrid } from '../components/inputList/AuxSendGrid'
import { InputListTable } from '../components/inputList/InputListTable'
import { PrintView } from '../components/PrintView'
import { ProjectToolbar } from '../components/ProjectToolbar'
import { useProjectStore } from '../store/projectStore'
import { type EditorTab, useUiStore } from '../store/uiStore'

interface ProjectEditorPageProps {
  projectId: string
  onBack: () => void
}

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'stagePlot', label: 'Stage Plot' },
  { id: 'inputList', label: 'Input List & Signal Plan' },
  { id: 'monitorMixes', label: 'Monitor Mixes' },
]

export function ProjectEditorPage({ projectId, onBack }: ProjectEditorPageProps) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const { activeTab, setActiveTab } = useUiStore()
  const stageRef = useRef<Konva.Stage>(null)
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!project) onBack()
  }, [project, onBack])

  function captureSnapshot(): string | null {
    const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null
    setSnapshotDataUrl(dataUrl)
    return dataUrl
  }

  function handleExportPrint() {
    captureSnapshot()
    // Let the snapshot state update (and the print-only view re-render with it)
    // before the browser's print dialog takes over the render loop.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()))
  }

  function handleDownloadPng() {
    const dataUrl = captureSnapshot()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${project?.name.replace(/[^a-z0-9-_]+/gi, '_') || 'stage-plot'}.png`
    a.click()
  }

  if (!project) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ProjectToolbar project={project} onBack={onBack} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #333' : '2px solid transparent',
                background: 'none',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={handleExportPrint}>
            Export / Print
          </button>
          <button type="button" onClick={handleDownloadPng}>
            Download PNG
          </button>
        </div>

        {/*
          scrollbarGutter: 'stable' reserves the vertical scrollbar's width whether or
          not it's actually showing. Without it, a tall canvas (e.g. a deep Porchfest
          layout) can trigger a feedback loop: the scrollbar appears -> the canvas's
          measured container width shrinks -> pxPerFt drops -> canvas height shrinks
          below the scroll threshold -> scrollbar disappears -> width grows back ->
          repeat, so the ResizeObserver never settles.
        */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12, position: 'relative', scrollbarGutter: 'stable' }}>
          {/* Every tab's content stays mounted (hidden via CSS rather than unmounted) so
              the Konva stage keeps its ref/canvas alive for PNG export regardless of
              which tab is currently visible. */}
          <div style={{ display: activeTab === 'stagePlot' ? 'flex' : 'none', gap: 12, height: '100%' }}>
            <div style={{ width: 180, flexShrink: 0, border: '1px solid #eee', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
              <AssetPalette project={project} />
              <ElementInspector project={project} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <StageCanvas project={project} stageRef={stageRef} />
            </div>
          </div>
          <div style={{ display: activeTab === 'inputList' ? 'block' : 'none' }}>
            <InputListTable project={project} />
          </div>
          <div style={{ display: activeTab === 'monitorMixes' ? 'block' : 'none' }}>
            <AuxSendGrid project={project} />
          </div>
        </div>
      </div>

      <div className="print-only">
        <PrintView project={project} snapshotDataUrl={snapshotDataUrl} />
      </div>
    </div>
  )
}
