import { assetLibrary } from '../../assets/assetLibrary'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import type { StagePlotProject } from '../../types'

interface ElementInspectorProps {
  project: StagePlotProject
}

export function ElementInspector({ project }: ElementInspectorProps) {
  const updateElement = useProjectStore((s) => s.updateElement)
  const removeElement = useProjectStore((s) => s.removeElement)
  const { selectedElementId, selectElement } = useUiStore()

  const element = project.elements.find((e) => e.id === selectedElementId)
  if (!element) return null

  return (
    <div style={{ borderTop: '1px solid #eee', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 13, textTransform: 'uppercase', color: '#666' }}>
        {assetLibrary[element.type].label}
      </h3>
      <label style={{ fontSize: 12, color: '#555' }}>
        Label
        <input
          value={element.label}
          onChange={(e) => updateElement(project.id, element.id, { label: e.target.value })}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 2 }}
        />
      </label>
      <label style={{ fontSize: 12, color: '#555' }}>
        Status
        <select
          value={element.status}
          onChange={(e) => updateElement(project.id, element.id, { status: e.target.value as 'confirmed' | 'tentative' })}
          style={{ width: '100%', marginTop: 2 }}
        >
          <option value="confirmed">Confirmed</option>
          <option value="tentative">Tentative</option>
        </select>
      </label>
      <label style={{ fontSize: 12, color: '#555' }}>
        Notes
        <textarea
          value={element.notes ?? ''}
          onChange={(e) => updateElement(project.id, element.id, { notes: e.target.value || undefined })}
          rows={2}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 2, resize: 'vertical' }}
        />
      </label>
      <label style={{ fontSize: 12, color: '#555' }}>
        Width (ft)
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={element.widthFt}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (!Number.isNaN(value) && value > 0) updateElement(project.id, element.id, { widthFt: value })
          }}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 2 }}
        />
      </label>
      <label style={{ fontSize: 12, color: '#555' }}>
        Depth (ft)
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={element.depthFt}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (!Number.isNaN(value) && value > 0) updateElement(project.id, element.id, { depthFt: value })
          }}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 2 }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          removeElement(project.id, element.id)
          selectElement(null)
        }}
        style={{ marginTop: 4 }}
      >
        Delete from plot
      </button>
    </div>
  )
}
