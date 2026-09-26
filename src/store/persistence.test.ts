import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyProject } from './projectStore'
import { exportProjectToJson, importProjectFromJson, loadProjects, saveProjects } from './persistence'

beforeEach(() => {
  localStorage.clear()
})

describe('loadProjects', () => {
  it('returns an empty array when nothing has been saved', () => {
    expect(loadProjects()).toEqual([])
  })

  it('returns an empty array instead of throwing on corrupt JSON', () => {
    localStorage.setItem('stageplot:v1:projects', '{not valid json')
    expect(loadProjects()).toEqual([])
  })

  it('returns an empty array if the stored value is not an array', () => {
    localStorage.setItem('stageplot:v1:projects', JSON.stringify({ oops: true }))
    expect(loadProjects()).toEqual([])
  })

  it('returns an empty array if localStorage access throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(loadProjects()).toEqual([])
    spy.mockRestore()
  })
})

describe('saveProjects / loadProjects round-trip', () => {
  it('persists and reloads a project list exactly', () => {
    const project = createEmptyProject('My Gig')
    saveProjects([project])
    expect(loadProjects()).toEqual([project])
  })
})

describe('exportProjectToJson / importProjectFromJson', () => {
  it('round-trips every field except id/createdAt/updatedAt, and assigns a fresh id', () => {
    const project = createEmptyProject('My Gig')
    const json = exportProjectToJson(project)
    const imported = importProjectFromJson(json)

    expect(imported.id).not.toBe(project.id)
    expect({ ...imported, id: undefined, createdAt: undefined, updatedAt: undefined }).toEqual({
      ...project,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    })
  })

  it('throws a clear error on input that is not a project export', () => {
    expect(() => importProjectFromJson('{"foo": "bar"}')).toThrow()
    expect(() => importProjectFromJson('not json at all')).toThrow()
  })
})
