import { describe, expect, it } from 'vitest'
import { yamahaMG16XU } from '../data/mixerDefinitions'
import type { InputChannel, StagePlotProject } from '../types'
import { validateProject } from './mixerValidation'

function makeChannel(overrides: Partial<InputChannel> & Pick<InputChannel, 'id' | 'source' | 'sourceKind'>): InputChannel {
  return {
    channelNumber: 1,
    connectorType: 'XLR',
    phantomPower: false,
    status: 'confirmed',
    auxLevels: [],
    ...overrides,
  }
}

function makeProject(overrides: Partial<StagePlotProject> = {}): StagePlotProject {
  return {
    id: 'p1',
    name: 'Test Project',
    stageWidthFt: 20,
    stageDepthFt: 20,
    mixerDefinitionId: yamahaMG16XU.id,
    auxAssignments: [],
    switchablePortModes: [],
    elements: [],
    channels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('validateProject', () => {
  it('flags a mono mic source assigned to a stereo-only port', () => {
    const channel = makeChannel({ id: 'c1', source: 'Lead Vocal', sourceKind: 'mic', channelNumber: 13, mixerPortId: 'ch13_14' })
    const project = makeProject({ channels: [channel] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes("doesn't accept mic input"))).toBe(true)
  })

  it('flags an instrument-direct source assigned to a port with instrumentCapable: false', () => {
    const channel = makeChannel({
      id: 'c1',
      source: 'Acoustic Guitar',
      sourceKind: 'instrumentDirect',
      connectorType: 'TS',
      channelNumber: 9,
      mixerPortId: 'ch9_10',
    })
    const project = makeProject({ channels: [channel], switchablePortModes: [{ portId: 'ch9_10', mode: 'mono' }] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes('instrument-capable'))).toBe(true)
  })

  it('treats a DI box as a mic-level source: fine on a mono mic slot, flagged on a line-only port', () => {
    const onMonoSlot = makeChannel({
      id: 'c1',
      source: 'Bass DI',
      sourceKind: 'di',
      connectorType: 'XLR',
      channelNumber: 9,
      mixerPortId: 'ch9_10',
    })
    const okProject = makeProject({
      channels: [onMonoSlot],
      switchablePortModes: [{ portId: 'ch9_10', mode: 'mono' }],
    })
    expect(validateProject(okProject, yamahaMG16XU)).toHaveLength(0)

    const onLineOnlyPort = makeChannel({
      id: 'c2',
      source: 'Bass DI',
      sourceKind: 'di',
      connectorType: 'XLR',
      channelNumber: 13,
      mixerPortId: 'ch13_14',
    })
    const badProject = makeProject({ channels: [onLineOnlyPort] })
    const issues = validateProject(badProject, yamahaMG16XU)
    expect(issues.some((i) => i.channelId === 'c2' && i.message.includes("doesn't accept mic input"))).toBe(true)
  })

  it('flags a line-level source assigned to a switchable port currently in mono (mic-only) mode', () => {
    const channel = makeChannel({
      id: 'c1',
      source: 'Keyboard line out',
      sourceKind: 'lineFromDevice',
      connectorType: 'TRS',
      channelNumber: 9,
      mixerPortId: 'ch9_10',
    })
    const project = makeProject({ channels: [channel], switchablePortModes: [{ portId: 'ch9_10', mode: 'mono' }] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes("doesn't accept line input"))).toBe(true)
  })

  it('does not flag a line-level source on the same port when it is switched to stereo', () => {
    const channel = makeChannel({
      id: 'c1',
      source: 'Keyboard L/R',
      sourceKind: 'lineFromDevice',
      connectorType: 'TRS',
      channelNumber: 9,
      mixerPortId: 'ch9_10',
    })
    const project = makeProject({ channels: [channel], switchablePortModes: [{ portId: 'ch9_10', mode: 'stereo' }] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues).toHaveLength(0)
  })

  it('flags an XLR-connector source assigned to a port with no XLR jack in its current mode', () => {
    const channel = makeChannel({
      id: 'c1',
      source: "Drummer's amp XLR line out",
      sourceKind: 'lineFromDevice',
      connectorType: 'XLR',
      channelNumber: 13,
      mixerPortId: 'ch13_14',
    })
    const project = makeProject({ channels: [channel] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes('no XLR input available'))).toBe(true)
  })

  it('allows two channels (L/R) on a genuine stereo pair without flagging a duplicate', () => {
    const left = makeChannel({ id: 'c1', source: 'Keys L', sourceKind: 'lineFromDevice', connectorType: 'TRS', channelNumber: 13, mixerPortId: 'ch13_14' })
    const right = makeChannel({ id: 'c2', source: 'Keys R', sourceKind: 'lineFromDevice', connectorType: 'TRS', channelNumber: 14, mixerPortId: 'ch13_14' })
    const project = makeProject({ channels: [left, right] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.filter((i) => i.message.includes('more channels assigned'))).toHaveLength(0)
  })

  it('flags every channel sharing a duplicate mono port assignment', () => {
    const c1 = makeChannel({ id: 'c1', source: 'Vocal 1', sourceKind: 'mic', connectorType: 'XLR', channelNumber: 1, mixerPortId: 'ch1' })
    const c2 = makeChannel({ id: 'c2', source: 'Vocal 2', sourceKind: 'mic', connectorType: 'XLR', channelNumber: 1, mixerPortId: 'ch1' })
    const project = makeProject({ channels: [c1, c2] })

    const issues = validateProject(project, yamahaMG16XU)

    const duplicateIssues = issues.filter((i) => i.message.includes('more channels assigned'))
    expect(duplicateIssues.map((i) => i.channelId).sort()).toEqual(['c1', 'c2'])
  })

  it('flags a channel whose channelNumber does not match its assigned port', () => {
    const channel = makeChannel({ id: 'c1', source: 'Vocal', sourceKind: 'mic', connectorType: 'XLR', channelNumber: 3, mixerPortId: 'ch1' })
    const project = makeProject({ channels: [channel] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes('labeled channel 3'))).toBe(true)
  })

  it('flags two channels sharing the same channelNumber even if unassigned to a port', () => {
    const c1 = makeChannel({ id: 'c1', source: 'Vocal 1', sourceKind: 'mic', channelNumber: 5 })
    const c2 = makeChannel({ id: 'c2', source: 'Vocal 2', sourceKind: 'mic', channelNumber: 5 })
    const project = makeProject({ channels: [c1, c2] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes('used by more than one'))).toBe(true)
    expect(issues.some((i) => i.channelId === 'c2' && i.message.includes('used by more than one'))).toBe(true)
  })

  it('flags a channel assigned to a port id from a different mixer', () => {
    const channel = makeChannel({ id: 'c1', source: 'Vocal', sourceKind: 'mic', mixerPortId: 'nonexistent-port' })
    const project = makeProject({ channels: [channel] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues.some((i) => i.channelId === 'c1' && i.message.includes("isn't part of"))).toBe(true)
  })

  it('reports a single issue when validated against the wrong mixer definition', () => {
    const project = makeProject({ mixerDefinitionId: 'some-other-mixer' })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues).toEqual([expect.objectContaining({ id: 'wrong-mixer-definition' })])
  })

  it('accounts for switchable-port mode when computing mono mic capacity', () => {
    // 8 fixed mono channels + ch9/10 in mono + ch11/12 in stereo = capacity 9, not 10.
    const monoChannels: InputChannel[] = Array.from({ length: 9 }, (_, i) =>
      makeChannel({ id: `mic${i}`, source: `Mic ${i}`, sourceKind: 'mic' }),
    )
    const project = makeProject({
      channels: monoChannels,
      switchablePortModes: [
        { portId: 'ch9_10', mode: 'mono' },
        { portId: 'ch11_12', mode: 'stereo' },
      ],
    })

    const issuesAtCapacity = validateProject(project, yamahaMG16XU)
    expect(issuesAtCapacity.some((i) => i.id.includes('capacity-exceeded'))).toBe(false)

    const overCapacityProject = makeProject({
      channels: [...monoChannels, makeChannel({ id: 'mic9', source: 'Mic 9', sourceKind: 'mic' })],
      switchablePortModes: project.switchablePortModes,
    })
    const issuesOverCapacity = validateProject(overCapacityProject, yamahaMG16XU)
    expect(issuesOverCapacity.some((i) => i.id === 'mono-capacity-exceeded')).toBe(true)
  })

  it('defaults an unset switchable port to mono for capacity purposes', () => {
    const monoChannels: InputChannel[] = Array.from({ length: 10 }, (_, i) =>
      makeChannel({ id: `mic${i}`, source: `Mic ${i}`, sourceKind: 'mic' }),
    )
    // No switchablePortModes entries at all -> both ch9/10 and ch11/12 default to mono -> capacity 10.
    const project = makeProject({ channels: monoChannels })

    const issues = validateProject(project, yamahaMG16XU)
    expect(issues.some((i) => i.id.includes('capacity-exceeded'))).toBe(false)
  })

  it('flags DI sources counting toward mono mic capacity, not a separate free pool', () => {
    // 8 mic (fills ch1-8) + 3 DI (only 2 switchable-mono slots exist) -> 11 > 10.
    const mics: InputChannel[] = Array.from({ length: 8 }, (_, i) => makeChannel({ id: `mic${i}`, source: `Mic ${i}`, sourceKind: 'mic' }))
    const dis: InputChannel[] = Array.from({ length: 3 }, (_, i) => makeChannel({ id: `di${i}`, source: `DI ${i}`, sourceKind: 'di' }))
    const project = makeProject({ channels: [...mics, ...dis] })

    const issues = validateProject(project, yamahaMG16XU)
    expect(issues.some((i) => i.id === 'mono-capacity-exceeded')).toBe(true)
  })

  it('flags instrument-direct sources exceeding the instrument-capable slot count even though mono capacity is not exceeded', () => {
    // 9 instrument-direct sources: only ch1-8 (8 ports) are instrumentCapable, even though 10 mono slots exist overall.
    const channels: InputChannel[] = Array.from({ length: 9 }, (_, i) =>
      makeChannel({ id: `inst${i}`, source: `Guitar ${i}`, sourceKind: 'instrumentDirect', connectorType: 'TS' }),
    )
    const project = makeProject({ channels })

    const issues = validateProject(project, yamahaMG16XU)
    expect(issues.some((i) => i.id === 'instrument-capacity-exceeded')).toBe(true)
  })

  it('both switchable pairs in stereo mode leaves only 8 mono mic slots', () => {
    const mics: InputChannel[] = Array.from({ length: 9 }, (_, i) => makeChannel({ id: `mic${i}`, source: `Mic ${i}`, sourceKind: 'mic' }))
    const project = makeProject({
      channels: mics,
      switchablePortModes: [
        { portId: 'ch9_10', mode: 'stereo' },
        { portId: 'ch11_12', mode: 'stereo' },
      ],
    })

    const issues = validateProject(project, yamahaMG16XU)
    expect(issues.some((i) => i.id.includes('capacity-exceeded'))).toBe(true)
  })

  it('does not flag an instrumentDirect channel just for lacking an intermediateDevice', () => {
    const channel = makeChannel({
      id: 'c1',
      source: 'Acoustic Guitar',
      sourceKind: 'instrumentDirect',
      connectorType: 'TS',
      channelNumber: 1,
      mixerPortId: 'ch1',
    })
    const project = makeProject({ channels: [channel] })

    const issues = validateProject(project, yamahaMG16XU)

    expect(issues).toHaveLength(0)
  })

  it('clears a previously-flagged issue once the port assignment is fixed', () => {
    const channel = makeChannel({ id: 'c1', source: 'Lead Vocal', sourceKind: 'mic', channelNumber: 13, mixerPortId: 'ch13_14' })
    const badProject = makeProject({ channels: [channel] })
    expect(validateProject(badProject, yamahaMG16XU).length).toBeGreaterThan(0)

    const fixedChannel = { ...channel, channelNumber: 1, mixerPortId: 'ch1' }
    const fixedProject = makeProject({ channels: [fixedChannel] })
    expect(validateProject(fixedProject, yamahaMG16XU)).toHaveLength(0)
  })
})
