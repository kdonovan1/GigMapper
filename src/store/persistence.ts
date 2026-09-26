import type { StagePlotProject } from '../types'

const STORAGE_KEY = 'stageplot:v1:projects'

/**
 * Reads the saved project list from localStorage. Any failure — storage
 * unavailable, corrupt/foreign JSON, a shape that isn't an array — just
 * starts empty rather than crashing the app.
 */
export function loadProjects(): StagePlotProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StagePlotProject[]) : []
  } catch {
    return []
  }
}

/** Best-effort save; swallows errors (storage disabled, quota exceeded, etc.) rather than crashing. */
export function saveProjects(projects: StagePlotProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // Nothing we can do here without disrupting the user's edit — the in-memory
    // state remains correct, it just won't survive a reload.
  }
}

export function exportProjectToJson(project: StagePlotProject): string {
  return JSON.stringify(project, null, 2)
}

/**
 * Parses a previously-exported project and assigns it a fresh id/timestamps
 * so it can be imported "into a new project slot" without colliding with an
 * existing one — every other field round-trips exactly as exported.
 */
export function importProjectFromJson(json: string): StagePlotProject {
  const parsed = JSON.parse(json) as StagePlotProject
  if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string' || !Array.isArray(parsed.elements)) {
    throw new Error('That file doesn’t look like a GigMapper project export.')
  }
  const now = new Date().toISOString()
  return {
    ...parsed,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
}
