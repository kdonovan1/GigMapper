import { useRef } from 'react'
import { useProjectStore } from '../store/projectStore'
import type { StagePlotProject } from '../types'

interface ProjectToolbarProps {
  project: StagePlotProject
  onBack: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: 2, fontSize: 12, color: '#555' }
const inputStyle = { padding: '4px 6px', fontSize: 13 }

export function ProjectToolbar({ project, onBack }: ProjectToolbarProps) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const duplicateProject = useProjectStore((s) => s.duplicateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const exportProject = useProjectStore((s) => s.exportProject)
  const importProject = useProjectStore((s) => s.importProject)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = exportProject(project.id)
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9-_]+/gi, '_') || 'project'}.json`
    a.click()
    // Revoking immediately can cancel the download in some browsers (notably Safari);
    // give it a beat to actually start before freeing the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importProject(String(reader.result))
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not import that file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ borderBottom: '1px solid #ddd', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onBack}>
          ← All projects
        </button>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <label style={fieldStyle}>
            Project name
            <input
              style={inputStyle}
              value={project.name}
              onChange={(e) => updateProject(project.id, { name: e.target.value })}
            />
          </label>
          <label style={fieldStyle}>
            Venue
            <input
              style={inputStyle}
              value={project.venue ?? ''}
              onChange={(e) => updateProject(project.id, { venue: e.target.value })}
            />
          </label>
          <label style={fieldStyle}>
            Show date
            <input
              type="date"
              style={inputStyle}
              value={project.showDate ?? ''}
              onChange={(e) => updateProject(project.id, { showDate: e.target.value })}
            />
          </label>
          <label style={fieldStyle}>
            Contact info
            <input
              style={inputStyle}
              value={project.contactInfo ?? ''}
              onChange={(e) => updateProject(project.id, { contactInfo: e.target.value })}
            />
          </label>
          <label style={fieldStyle}>
            Layout width (ft)
            <input
              type="number"
              min={1}
              max={500}
              style={{ ...inputStyle, width: 70 }}
              value={project.stageWidthFt}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (Number.isNaN(value)) return
                updateProject(project.id, { stageWidthFt: Math.min(Math.max(value, 1), 500) })
              }}
            />
          </label>
          <label style={fieldStyle}>
            Layout depth (ft)
            <input
              type="number"
              min={1}
              max={500}
              style={{ ...inputStyle, width: 70 }}
              value={project.stageDepthFt}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (Number.isNaN(value)) return
                updateProject(project.id, { stageDepthFt: Math.min(Math.max(value, 1), 500) })
              }}
            />
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={handleExport}>
          Export JSON
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        <button type="button" onClick={() => duplicateProject(project.id)}>
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${project.name}"? This can't be undone.`)) {
              deleteProject(project.id)
              onBack()
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
