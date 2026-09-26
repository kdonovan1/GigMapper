import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject, selectActiveProject, useProjectStore } from './projectStore'

beforeEach(() => {
  localStorage.clear()
  useProjectStore.setState({ projects: [], activeProjectId: null })
})

describe('useProjectStore', () => {
  it('creates a project, makes it active, and persists it to localStorage', () => {
    const id = useProjectStore.getState().createProject('Porchfest')

    const state = useProjectStore.getState()
    expect(state.activeProjectId).toBe(id)
    expect(selectActiveProject(state)?.name).toBe('Porchfest')
    expect(localStorage.getItem('stageplot:v1:projects')).toContain('Porchfest')
  })

  it('duplicates a project with a new id and "(copy)" suffix, leaving the original untouched', () => {
    const id = useProjectStore.getState().createProject('Tap House 66')
    const copyId = useProjectStore.getState().duplicateProject(id)

    const projects = useProjectStore.getState().projects
    expect(projects).toHaveLength(2)
    expect(copyId).not.toBe(id)
    expect(projects.find((p) => p.id === copyId)?.name).toBe('Tap House 66 (copy)')
    expect(projects.find((p) => p.id === id)?.name).toBe('Tap House 66')
  })

  it('deletes a project and clears activeProjectId if it was the active one', () => {
    const id = useProjectStore.getState().createProject('To Delete')
    useProjectStore.getState().deleteProject(id)

    const state = useProjectStore.getState()
    expect(state.projects).toHaveLength(0)
    expect(state.activeProjectId).toBeNull()
  })

  it('adds, updates, and removes an element on the correct project only', () => {
    const idA = useProjectStore.getState().createProject('A')
    const idB = useProjectStore.getState().createProject('B')

    useProjectStore.getState().addElement(idA, {
      id: 'el1',
      type: 'drumKit',
      label: 'Drums',
      xFt: 0,
      yFt: 0,
      widthFt: 6,
      depthFt: 5,
      rotationDeg: 0,
      status: 'confirmed',
    })

    let projects = useProjectStore.getState().projects
    expect(projects.find((p) => p.id === idA)?.elements).toHaveLength(1)
    expect(projects.find((p) => p.id === idB)?.elements).toHaveLength(0)

    useProjectStore.getState().updateElement(idA, 'el1', { status: 'tentative' })
    projects = useProjectStore.getState().projects
    expect(projects.find((p) => p.id === idA)?.elements[0].status).toBe('tentative')

    useProjectStore.getState().removeElement(idA, 'el1')
    projects = useProjectStore.getState().projects
    expect(projects.find((p) => p.id === idA)?.elements).toHaveLength(0)
  })

  it('exports and re-imports a project as a new entry', () => {
    const id = useProjectStore.getState().createProject('Exportable')
    const json = useProjectStore.getState().exportProject(id)
    expect(json).toBeDefined()

    const importedId = useProjectStore.getState().importProject(json!)
    const projects = useProjectStore.getState().projects
    expect(projects).toHaveLength(2)
    expect(importedId).not.toBe(id)
    expect(projects.find((p) => p.id === importedId)?.name).toBe('Exportable')
  })

  it('loadExampleProject clones a seed into a new saved project rather than mutating it', () => {
    const seed = createEmptyProject('Seed Example')
    const clonedId = useProjectStore.getState().loadExampleProject(seed)

    const projects = useProjectStore.getState().projects
    expect(projects).toHaveLength(1)
    expect(clonedId).not.toBe(seed.id)
    expect(projects[0].name).toBe('Seed Example')
  })
})
