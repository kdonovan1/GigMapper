export type AssetType =
  | 'drumKit'
  | 'guitarAmp'
  | 'bassAmp'
  | 'keyboard'
  | 'micStand'
  | 'monitorWedge'
  | 'diBox'
  | 'mixer'
  | 'table'
  | 'paSpeaker'
  | 'musician'
  | 'custom'

export type LifecycleStatus = 'confirmed' | 'tentative'

export interface StageElement {
  id: string
  type: AssetType
  label: string
  /** Position on the whole layout area (stage + yard/driveway/FOH), not just a riser. */
  xFt: number
  yFt: number
  widthFt: number
  depthFt: number
  rotationDeg: number
  status: LifecycleStatus
  notes?: string
  linkedChannelId?: string
  /** Reserved for a future power-outlet mapping feature; unused in v1. */
  outletId?: string
}

export type ConnectorType = 'XLR' | 'TRS' | 'TS'
export type SourceKind = 'mic' | 'di' | 'lineFromDevice' | 'instrumentDirect'

export interface AuxLevel {
  auxId: string
  /** 0-10 rough level, or null if this channel isn't sent to this aux at all. */
  level: number | null
}

export interface InputChannel {
  id: string
  channelNumber: number
  source: string
  sourceKind: SourceKind
  connectorType: ConnectorType
  intermediateDevice?: string
  standType?: string
  phantomPower: boolean
  notes?: string
  status: LifecycleStatus
  linkedElementId?: string
  /** Assigned MixerPort.id from the project's MixerDefinition, if placed. */
  mixerPortId?: string
  auxLevels: AuxLevel[]
}

export type PortMode = 'mono' | 'stereo' | 'switchable-mono-stereo'

export interface MixerPort {
  id: string
  label: string
  channelNumbers: number[]
  mode: PortMode
  /**
   * Capability flags describe what this port CAN do across all its modes.
   * For a 'switchable-mono-stereo' port, both micCapable and lineCapable are
   * true here (each is only available in one of the two switch positions) —
   * resolve the port's EFFECTIVE capability for a specific project with
   * `resolveEffectivePortCapability` in utils/mixerValidation.ts, which reads
   * the project's `switchablePortModes` to know which position it's in.
   */
  micCapable: boolean
  lineCapable: boolean
  instrumentCapable: boolean
}

/**
 * An aux send is either hard-wired to one pre/post position, or has its own
 * independent switch — never both, and never neither. Modeled as a
 * discriminated union so an impossible/ambiguous combination can't be built.
 */
export type AuxSend = { id: string; label: string; sharesFx?: boolean } & (
  | { fixedPrePost: 'pre' | 'post'; switchablePrePost?: false }
  | { switchablePrePost: true; fixedPrePost?: undefined }
)

export interface MixerDefinition {
  id: string
  name: string
  ports: MixerPort[]
  auxSends: AuxSend[]
}

export interface AuxAssignment {
  auxId: string
  /** Per-gig relabel, e.g. "Drummer wedge". */
  label: string
  /** Only meaningful when the corresponding AuxSend.switchablePrePost is true. */
  prePost?: 'pre' | 'post'
}

export interface SwitchablePortMode {
  /** Must reference a MixerPort with mode 'switchable-mono-stereo' on this project's mixer. */
  portId: string
  mode: 'mono' | 'stereo'
}

export interface StagePlotProject {
  id: string
  name: string
  venue?: string
  showDate?: string
  contactInfo?: string
  stageWidthFt: number
  stageDepthFt: number
  mixerDefinitionId: string
  auxAssignments: AuxAssignment[]
  switchablePortModes: SwitchablePortMode[]
  elements: StageElement[]
  channels: InputChannel[]
  createdAt: string
  updatedAt: string
}
