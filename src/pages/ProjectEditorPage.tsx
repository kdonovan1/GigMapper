import { useEffect } from 'react'
import { AssetPalette } from '../components/canvas/AssetPalette'
import { StageCanvas } from '../components/canvas/StageCanvas'
import { AuxSendGrid } from '../components/inputList/AuxSendGrid'
import { InputListTable } from '../components/inputList/InputListTable'
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

  useEffect(() => {
    if (!project) onBack()
  }, [project, onBack])

  if (!project) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ProjectToolbar project={project} onBack={onBack} />

      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
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
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {activeTab === 'stagePlot' && (
          <div style={{ display: 'flex', gap: 12, height: '100%' }}>
            <div style={{ width: 180, flexShrink: 0, border: '1px solid #eee', borderRadius: 6 }}>
              <AssetPalette project={project} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <StageCanvas project={project} />
            </div>
          </div>
        )}
        {activeTab === 'inputList' && <InputListTable project={project} />}
        {activeTab === 'monitorMixes' && <AuxSendGrid project={project} />}
      </div>
    </div>
  )
}
