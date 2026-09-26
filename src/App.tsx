import { useState } from 'react'
import { ProjectEditorPage } from './pages/ProjectEditorPage'
import { ProjectListPage } from './pages/ProjectListPage'

function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {openProjectId ? (
        <ProjectEditorPage projectId={openProjectId} onBack={() => setOpenProjectId(null)} />
      ) : (
        <ProjectListPage onOpenProject={setOpenProjectId} />
      )}
    </div>
  )
}

export default App
