import { useRef } from 'react'
import { porchfestProject } from '../seed/porchfest'
import { tapHouse66Project } from '../seed/tapHouse66'
import { useProjectStore } from '../store/projectStore'

interface ProjectListPageProps {
  onOpenProject: (id: string) => void
}

export function ProjectListPage({ onOpenProject }: ProjectListPageProps) {
  const projects = useProjectStore((s) => s.projects)
  const createProject = useProjectStore((s) => s.createProject)
  const duplicateProject = useProjectStore((s) => s.duplicateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const loadExampleProject = useProjectStore((s) => s.loadExampleProject)
  const importProject = useProjectStore((s) => s.importProject)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleNew() {
    const id = createProject('Untitled Project')
    onOpenProject(id)
  }

  function handleLoadExample(seed: typeof porchfestProject) {
    const id = loadExampleProject(seed)
    onOpenProject(id)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const id = importProject(String(reader.result))
        onOpenProject(id)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not import that file.')
      }
    }
    reader.readAsText(file)
  }

  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>GigMapper</h1>
      <p style={{ color: '#666', marginTop: 0 }}>Stage plots and mixer-aware signal plans for Gowdy Station.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={handleNew}>
          + New project
        </button>
        <button type="button" onClick={() => handleLoadExample(porchfestProject)}>
          Load example: Binghamton Porchfest
        </button>
        <button type="button" onClick={() => handleLoadExample(tapHouse66Project)}>
          Load example: Tap House 66
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: '#888' }}>No projects yet — create one or load an example above.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((project) => (
            <li
              key={project.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', flex: 1 }}
              >
                <div style={{ fontWeight: 'bold' }}>{project.name}</div>
                <div style={{ fontSize: 12, color: '#777' }}>
                  {project.venue || 'No venue set'}
                  {project.showDate ? ` · ${project.showDate}` : ''}
                </div>
              </button>
              <button type="button" onClick={() => duplicateProject(project.id)}>
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${project.name}"? This can't be undone.`)) deleteProject(project.id)
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
