import { create } from 'zustand'
import { yamahaMG16XU } from '../data/mixerDefinitions'
import type {
  AuxLevel,
  InputChannel,
  StageElement,
  StagePlotProject,
  SwitchablePortMode,
} from '../types'
import { exportProjectToJson, importProjectFromJson, loadProjects, saveProjects } from './persistence'

export function createEmptyProject(name = 'Untitled Project'): StagePlotProject {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    stageWidthFt: 20,
    stageDepthFt: 20,
    mixerDefinitionId: yamahaMG16XU.id,
    auxAssignments: yamahaMG16XU.auxSends.map((aux) => ({
      auxId: aux.id,
      label: aux.label,
      ...(aux.switchablePrePost ? { prePost: 'pre' as const } : {}),
    })),
    switchablePortModes: [],
    elements: [],
    channels: [],
    createdAt: now,
    updatedAt: now,
  }
}

function cloneAsNewProject(source: StagePlotProject, name?: string): StagePlotProject {
  const now = new Date().toISOString()
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    name: name ?? source.name,
    createdAt: now,
    updatedAt: now,
  }
}

interface ProjectStoreState {
  projects: StagePlotProject[]
  activeProjectId: string | null

  createProject: (name?: string) => string
  duplicateProject: (id: string) => string | undefined
  deleteProject: (id: string) => void
  setActiveProjectId: (id: string | null) => void
  loadExampleProject: (seed: StagePlotProject) => string
  exportProject: (id: string) => string | undefined
  importProject: (json: string) => string

  updateProject: (id: string, patch: Partial<StagePlotProject>) => void

  addElement: (projectId: string, element: StageElement) => void
  updateElement: (projectId: string, elementId: string, patch: Partial<StageElement>) => void
  removeElement: (projectId: string, elementId: string) => void

  addChannel: (projectId: string, channel: InputChannel) => void
  updateChannel: (projectId: string, channelId: string, patch: Partial<InputChannel>) => void
  removeChannel: (projectId: string, channelId: string) => void

  setSwitchablePortMode: (projectId: string, mode: SwitchablePortMode) => void
  setAuxAssignmentLabel: (projectId: string, auxId: string, label: string) => void
  setAuxAssignmentPrePost: (projectId: string, auxId: string, prePost: 'pre' | 'post') => void
  setChannelAuxLevel: (projectId: string, channelId: string, auxLevel: AuxLevel) => void
}

/** Use as `useProjectStore(selectActiveProject)` — reactive, unlike calling `.find` on `get()` outside of render. */
export function selectActiveProject(state: ProjectStoreState): StagePlotProject | undefined {
  return state.projects.find((p) => p.id === state.activeProjectId)
}

function touch(project: StagePlotProject): StagePlotProject {
  return { ...project, updatedAt: new Date().toISOString() }
}

export const useProjectStore = create<ProjectStoreState>((set, get) => {
  function withProject(projectId: string, fn: (project: StagePlotProject) => StagePlotProject) {
    set((state) => {
      const projects = state.projects.map((p) => (p.id === projectId ? touch(fn(p)) : p))
      saveProjects(projects)
      return { projects }
    })
  }

  return {
    projects: loadProjects(),
    activeProjectId: null,

    createProject: (name) => {
      const project = createEmptyProject(name)
      set((state) => {
        const projects = [...state.projects, project]
        saveProjects(projects)
        return { projects, activeProjectId: project.id }
      })
      return project.id
    },

    duplicateProject: (id) => {
      const source = get().projects.find((p) => p.id === id)
      if (!source) return undefined
      const clone = cloneAsNewProject(source, `${source.name} (copy)`)
      set((state) => {
        const projects = [...state.projects, clone]
        saveProjects(projects)
        return { projects }
      })
      return clone.id
    },

    deleteProject: (id) => {
      set((state) => {
        const projects = state.projects.filter((p) => p.id !== id)
        saveProjects(projects)
        return {
          projects,
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }
      })
    },

    setActiveProjectId: (id) => set({ activeProjectId: id }),

    loadExampleProject: (seed) => {
      const clone = cloneAsNewProject(seed)
      set((state) => {
        const projects = [...state.projects, clone]
        saveProjects(projects)
        return { projects }
      })
      return clone.id
    },

    exportProject: (id) => {
      const project = get().projects.find((p) => p.id === id)
      return project ? exportProjectToJson(project) : undefined
    },

    importProject: (json) => {
      const imported = importProjectFromJson(json)
      set((state) => {
        const projects = [...state.projects, imported]
        saveProjects(projects)
        return { projects }
      })
      return imported.id
    },

    updateProject: (id, patch) => withProject(id, (p) => ({ ...p, ...patch })),

    addElement: (projectId, element) =>
      withProject(projectId, (p) => ({ ...p, elements: [...p.elements, element] })),

    updateElement: (projectId, elementId, patch) =>
      withProject(projectId, (p) => ({
        ...p,
        elements: p.elements.map((e) => (e.id === elementId ? { ...e, ...patch } : e)),
      })),

    removeElement: (projectId, elementId) =>
      withProject(projectId, (p) => ({
        ...p,
        elements: p.elements.filter((e) => e.id !== elementId),
        // Clear any channel that was pointing at the now-deleted element, rather than
        // leaving a dangling reference that would silently no-op on highlight.
        channels: p.channels.map((c) => (c.linkedElementId === elementId ? { ...c, linkedElementId: undefined } : c)),
      })),

    addChannel: (projectId, channel) =>
      withProject(projectId, (p) => ({ ...p, channels: [...p.channels, channel] })),

    updateChannel: (projectId, channelId, patch) =>
      withProject(projectId, (p) => ({
        ...p,
        channels: p.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)),
      })),

    removeChannel: (projectId, channelId) =>
      withProject(projectId, (p) => ({ ...p, channels: p.channels.filter((c) => c.id !== channelId) })),

    setSwitchablePortMode: (projectId, mode) =>
      withProject(projectId, (p) => ({
        ...p,
        switchablePortModes: [...p.switchablePortModes.filter((m) => m.portId !== mode.portId), mode],
      })),

    setAuxAssignmentLabel: (projectId, auxId, label) =>
      withProject(projectId, (p) => ({
        ...p,
        auxAssignments: p.auxAssignments.map((a) => (a.auxId === auxId ? { ...a, label } : a)),
      })),

    setAuxAssignmentPrePost: (projectId, auxId, prePost) =>
      withProject(projectId, (p) => ({
        ...p,
        auxAssignments: p.auxAssignments.map((a) => (a.auxId === auxId ? { ...a, prePost } : a)),
      })),

    setChannelAuxLevel: (projectId, channelId, auxLevel) =>
      withProject(projectId, (p) => ({
        ...p,
        channels: p.channels.map((c) =>
          c.id === channelId
            ? {
                ...c,
                auxLevels: [...c.auxLevels.filter((a) => a.auxId !== auxLevel.auxId), auxLevel],
              }
            : c,
        ),
      })),
  }
})
