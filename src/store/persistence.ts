import { getMixerDefinition, yamahaMG16XU } from '../data/mixerDefinitions'
import type { InputChannel, StageElement, StagePlotProject } from '../types'

const STORAGE_KEY = 'stageplot:v1:projects'

function normalizeElement(raw: Partial<StageElement>): StageElement {
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    type: raw.type ?? 'custom',
    label: typeof raw.label === 'string' ? raw.label : '',
    xFt: typeof raw.xFt === 'number' ? raw.xFt : 1,
    yFt: typeof raw.yFt === 'number' ? raw.yFt : 1,
    widthFt: typeof raw.widthFt === 'number' && raw.widthFt > 0 ? raw.widthFt : 2,
    depthFt: typeof raw.depthFt === 'number' && raw.depthFt > 0 ? raw.depthFt : 2,
    rotationDeg: typeof raw.rotationDeg === 'number' ? raw.rotationDeg : 0,
    status: raw.status === 'tentative' ? 'tentative' : 'confirmed',
    notes: raw.notes,
    linkedChannelId: raw.linkedChannelId,
    outletId: raw.outletId,
  }
}

function normalizeChannel(raw: Partial<InputChannel>): InputChannel {
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    channelNumber: typeof raw.channelNumber === 'number' ? raw.channelNumber : 1,
    source: typeof raw.source === 'string' ? raw.source : '',
    sourceKind: raw.sourceKind ?? 'mic',
    connectorType: raw.connectorType ?? 'XLR',
    intermediateDevice: raw.intermediateDevice,
    standType: raw.standType,
    phantomPower: raw.phantomPower === true,
    notes: raw.notes,
    status: raw.status === 'tentative' ? 'tentative' : 'confirmed',
    linkedElementId: raw.linkedElementId,
    mixerPortId: raw.mixerPortId,
    auxLevels: Array.isArray(raw.auxLevels) ? raw.auxLevels : [],
  }
}

/**
 * Fills in every array/collection field a project needs so the rest of the
 * app can safely assume they exist, rather than crashing on a hand-edited or
 * partially-exported file that's missing e.g. auxAssignments or channels.
 */
function normalizeProject(raw: Partial<StagePlotProject>): Omit<StagePlotProject, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Imported Project',
    venue: raw.venue,
    showDate: raw.showDate,
    contactInfo: raw.contactInfo,
    stageWidthFt: typeof raw.stageWidthFt === 'number' && raw.stageWidthFt > 0 ? raw.stageWidthFt : 20,
    stageDepthFt: typeof raw.stageDepthFt === 'number' && raw.stageDepthFt > 0 ? raw.stageDepthFt : 20,
    // Fall back to the MG16XU rather than an unrecognized id — the latter would
    // silently render a blank print view and an "Unknown mixer definition" input list.
    mixerDefinitionId:
      typeof raw.mixerDefinitionId === 'string' && getMixerDefinition(raw.mixerDefinitionId)
        ? raw.mixerDefinitionId
        : yamahaMG16XU.id,
    auxAssignments: Array.isArray(raw.auxAssignments) ? raw.auxAssignments : [],
    switchablePortModes: Array.isArray(raw.switchablePortModes) ? raw.switchablePortModes : [],
    elements: Array.isArray(raw.elements) ? raw.elements.map(normalizeElement) : [],
    channels: Array.isArray(raw.channels) ? raw.channels.map(normalizeChannel) : [],
  }
}

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
    if (!Array.isArray(parsed)) return []
    return parsed.map((p: Partial<StagePlotProject>) => ({
      ...normalizeProject(p),
      id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    }))
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
  const parsed = JSON.parse(json) as Partial<StagePlotProject>
  const looksLikeProject =
    !!parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    (typeof parsed.name === 'string' || Array.isArray(parsed.elements) || Array.isArray(parsed.channels))
  if (!looksLikeProject) {
    throw new Error('That file doesn’t look like a GigMapper project export.')
  }
  const now = new Date().toISOString()
  return {
    ...normalizeProject(parsed),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
}
