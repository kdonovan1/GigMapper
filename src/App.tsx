import { useState } from 'react'
import { ProjectEditorPage } from './pages/ProjectEditorPage'
import { ProjectListPage } from './pages/ProjectListPage'
import { useUiStore } from './store/uiStore'

function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null)
  const resetSelection = useUiStore((s) => s.resetSelection)

  function openProject(id: string | null) {
    resetSelection()
    setOpenProjectId(id)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {openProjectId ? (
        <ProjectEditorPage projectId={openProjectId} onBack={() => openProject(null)} />
      ) : (
        <ProjectListPage onOpenProject={openProject} />
      )}
    </div>
  )
}

export default App
