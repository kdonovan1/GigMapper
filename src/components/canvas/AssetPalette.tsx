import { assetLibrary, assetTypes } from '../../assets/assetLibrary'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import type { StagePlotProject } from '../../types'

interface AssetPaletteProps {
  project: StagePlotProject
}

export function AssetPalette({ project }: AssetPaletteProps) {
  const addElement = useProjectStore((s) => s.addElement)
  const selectElement = useUiStore((s) => s.selectElement)

  function handleAdd(type: (typeof assetTypes)[number]) {
    const entry = assetLibrary[type]
    // Stagger new placements slightly so repeated adds don't stack exactly on top of each other.
    const offset = (project.elements.length % 6) * 1.5
    const id = crypto.randomUUID()
    addElement(project.id, {
      id,
      type,
      label: entry.label,
      xFt: 1 + offset,
      yFt: 1 + offset,
      widthFt: entry.defaultWidthFt,
      depthFt: entry.defaultDepthFt,
      rotationDeg: 0,
      status: 'confirmed',
    })
    selectElement(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, overflowY: 'auto' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 13, textTransform: 'uppercase', color: '#666' }}>Add to plot</h3>
      {assetTypes.map((type) => {
        const entry = assetLibrary[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleAdd(type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 3, background: entry.fill, flexShrink: 0 }} />
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
