import type { MixerDefinition, MixerPort, StagePlotProject } from '../types'

export interface ValidationIssue {
  id: string
  /** Set for a channel-specific issue; absent for a project-level issue (e.g. mono capacity). */
  channelId?: string
  message: string
}

export interface EffectivePortCapability {
  micCapable: boolean
  lineCapable: boolean
  instrumentCapable: boolean
  /** True if, in its current mode, this port is a single mono channel (vs. a stereo pair). */
  isMonoSlot: boolean
}

/**
 * Resolves a port's actual capability for THIS project, given its current
 * switch position (for switchable-mono-stereo ports) recorded in
 * `project.switchablePortModes`. A switchable port with no recorded mode
 * defaults to 'mono' — the more common case for a band needing extra mic
 * inputs — so a fresh project without an explicit choice still validates
 * sensibly rather than silently ignoring the port.
 */
export function resolveEffectivePortCapability(
  port: MixerPort,
  project: Pick<StagePlotProject, 'switchablePortModes'>,
): EffectivePortCapability {
  if (port.mode !== 'switchable-mono-stereo') {
    return {
      micCapable: port.micCapable,
      lineCapable: port.lineCapable,
      instrumentCapable: port.instrumentCapable,
      isMonoSlot: port.mode === 'mono',
    }
  }

  const override = project.switchablePortModes.find((m) => m.portId === port.id)
  const mode = override?.mode ?? 'mono'

  if (mode === 'mono') {
    // A mono/stereo pair collapses to ONE mic input in mono mode, not two —
    // confirmed against Yamaha's published "8 + 1 + 1 = 10 max mic" spec.
    return {
      micCapable: port.micCapable,
      lineCapable: false,
      instrumentCapable: false,
      isMonoSlot: true,
    }
  }
  return {
    micCapable: false,
    lineCapable: port.lineCapable,
    instrumentCapable: false,
    isMonoSlot: false,
  }
}

function countPortsWhere(
  mixer: MixerDefinition,
  project: Pick<StagePlotProject, 'switchablePortModes'>,
  predicate: (capability: EffectivePortCapability) => boolean,
): number {
  return mixer.ports.reduce((count, port) => {
    return predicate(resolveEffectivePortCapability(port, project)) ? count + 1 : count
  }, 0)
}

/** Signal-level source kinds that need a mic-capable input (a DI box outputs mic-level, not line-level). */
function needsMicLevelInput(sourceKind: string): boolean {
  return sourceKind === 'mic' || sourceKind === 'di'
}

export function validateProject(project: StagePlotProject, mixer: MixerDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (project.mixerDefinitionId !== mixer.id) {
    return [
      {
        id: 'wrong-mixer-definition',
        message: `This project is set up for a different mixer ("${project.mixerDefinitionId}"), not the ${mixer.name} being validated against.`,
      },
    ]
  }

  const portById = new Map(mixer.ports.map((p) => [p.id, p]))
  const portAssignments = new Map<string, string[]>() // portId -> channelIds assigned to it
  const channelNumberUses = new Map<number, string[]>() // channelNumber -> channelIds using it

  for (const channel of project.channels) {
    channelNumberUses.set(channel.channelNumber, [
      ...(channelNumberUses.get(channel.channelNumber) ?? []),
      channel.id,
    ])

    if (!channel.mixerPortId) continue

    const port = portById.get(channel.mixerPortId)
    if (!port) {
      issues.push({
        id: `${channel.id}-unknown-port`,
        channelId: channel.id,
        message: `Assigned to a port ("${channel.mixerPortId}") that isn't part of the ${mixer.name}.`,
      })
      continue
    }

    portAssignments.set(port.id, [...(portAssignments.get(port.id) ?? []), channel.id])

    if (!port.channelNumbers.includes(channel.channelNumber)) {
      issues.push({
        id: `${channel.id}-channel-number-mismatch`,
        channelId: channel.id,
        message: `${channel.source}: labeled channel ${channel.channelNumber}, but assigned to ${port.label} (channel${port.channelNumbers.length > 1 ? 's' : ''} ${port.channelNumbers.join('/')}).`,
      })
    }

    const effective = resolveEffectivePortCapability(port, project)

    if (needsMicLevelInput(channel.sourceKind) && !effective.micCapable) {
      issues.push({
        id: `${channel.id}-mic-mismatch`,
        channelId: channel.id,
        message: `${channel.source}: a mic-level source is assigned to ${port.label}, which doesn't accept mic input in its current mode.`,
      })
    }

    if (channel.sourceKind === 'instrumentDirect' && !effective.instrumentCapable) {
      issues.push({
        id: `${channel.id}-instrument-mismatch`,
        channelId: channel.id,
        message: `${channel.source}: an instrument-direct source is assigned to ${port.label}, which isn't instrument-capable.`,
      })
    }

    if (channel.sourceKind === 'lineFromDevice' && !effective.lineCapable) {
      issues.push({
        id: `${channel.id}-line-mismatch`,
        channelId: channel.id,
        message: `${channel.source}: a line-level source is assigned to ${port.label}, which doesn't accept line input in its current mode.`,
      })
    }

    if (channel.connectorType === 'XLR' && !effective.micCapable) {
      issues.push({
        id: `${channel.id}-no-xlr-jack`,
        channelId: channel.id,
        message: `${channel.source}: uses an XLR connector, but ${port.label} has no XLR input available in its current mode.`,
      })
    }

    if (
      (channel.connectorType === 'TRS' || channel.connectorType === 'TS') &&
      !effective.lineCapable &&
      !effective.instrumentCapable
    ) {
      issues.push({
        id: `${channel.id}-no-trs-jack`,
        channelId: channel.id,
        message: `${channel.source}: uses a ${channel.connectorType} connector, but ${port.label} has no line/instrument input available in its current mode.`,
      })
    }
  }

  for (const [portId, channelIds] of portAssignments) {
    const port = portById.get(portId)!
    const effective = resolveEffectivePortCapability(port, project)
    // A stereo pair (static, or a switchable pair currently in stereo mode) can
    // legitimately hold two channels (L and R); anything else holds at most one.
    const capacity = port.channelNumbers.length > 1 && !effective.isMonoSlot ? 2 : 1
    if (channelIds.length > capacity) {
      for (const channelId of channelIds) {
        issues.push({
          id: `${channelId}-duplicate-port-${portId}`,
          channelId,
          message: `${port.label} has more channels assigned to it (${channelIds.length}) than it can take (${capacity}) in its current mode.`,
        })
      }
    }
  }

  for (const [channelNumber, channelIds] of channelNumberUses) {
    if (channelIds.length > 1) {
      for (const channelId of channelIds) {
        issues.push({
          id: `${channelId}-duplicate-channel-number-${channelNumber}`,
          channelId,
          message: `Channel number ${channelNumber} is used by more than one input-list row.`,
        })
      }
    }
  }

  const micLevelChannels = project.channels.filter((c) => needsMicLevelInput(c.sourceKind))
  const instrumentChannels = project.channels.filter((c) => c.sourceKind === 'instrumentDirect')
  const micCapacity = countPortsWhere(mixer, project, (c) => c.micCapable && c.isMonoSlot)
  const instrumentCapacity = countPortsWhere(mixer, project, (c) => c.instrumentCapable)

  // Mic and instrument sources contend for the same physical mono slots where
  // a port supports both (e.g. ch1-8), so check the combined total against
  // all mono-capable slots as well as each kind against its own ceiling.
  const totalMonoNeeding = micLevelChannels.length + instrumentChannels.length
  const totalMonoCapacity = countPortsWhere(mixer, project, (c) => (c.micCapable || c.instrumentCapable) && c.isMonoSlot)

  if (instrumentChannels.length > instrumentCapacity) {
    issues.push({
      id: 'instrument-capacity-exceeded',
      message: `${instrumentChannels.length} instrument-direct sources planned, but the ${mixer.name} only has ${instrumentCapacity} instrument-capable inputs in the current switch configuration.`,
    })
  } else if (totalMonoNeeding > totalMonoCapacity) {
    issues.push({
      id: 'mono-capacity-exceeded',
      message: `${totalMonoNeeding} mic/DI/instrument sources planned, but the ${mixer.name} only has ${totalMonoCapacity} mono inputs available in the current switch configuration.`,
    })
  } else if (micLevelChannels.length > micCapacity) {
    issues.push({
      id: 'mic-capacity-exceeded',
      message: `${micLevelChannels.length} mic/DI sources planned, but the ${mixer.name} only has ${micCapacity} mono mic inputs available in the current switch configuration.`,
    })
  }

  return issues
}
