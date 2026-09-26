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
    // Stagger new placements slightly so repeated adds don't stack exactly on top of
    // each other, then clamp so the (center-based) position keeps the whole shape on
    // the visible layout area even on a small stage or after many adds.
    const stagger = (project.elements.length % 6) * 1.5
    const halfWidth = entry.defaultWidthFt / 2
    const halfDepth = entry.defaultDepthFt / 2
    const xFt = Math.min(halfWidth + 1 + stagger, Math.max(halfWidth, project.stageWidthFt - halfWidth))
    const yFt = Math.min(halfDepth + 1 + stagger, Math.max(halfDepth, project.stageDepthFt - halfDepth))
    const id = crypto.randomUUID()
    addElement(project.id, {
      id,
      type,
      label: entry.label,
      xFt,
      yFt,
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
