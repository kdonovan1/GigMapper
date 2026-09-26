import type { CSSProperties } from 'react'
import { getMixerDefinition } from '../../data/mixerDefinitions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import type { ConnectorType, InputChannel, SourceKind, StagePlotProject } from '../../types'
import { validateProject } from '../../utils/mixerValidation'
import { PortAssignmentPicker } from './PortAssignmentPicker'

const SOURCE_KINDS: SourceKind[] = ['mic', 'di', 'lineFromDevice', 'instrumentDirect']
const CONNECTOR_TYPES: ConnectorType[] = ['XLR', 'TRS', 'TS']

const cellStyle: CSSProperties = { padding: '4px 6px', verticalAlign: 'top', borderBottom: '1px solid #eee' }
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box' }

interface InputListTableProps {
  project: StagePlotProject
}

function SwitchablePortModeControls({ project }: { project: StagePlotProject }) {
  const mixer = getMixerDefinition(project.mixerDefinitionId)
  const setSwitchablePortMode = useProjectStore((s) => s.setSwitchablePortMode)
  if (!mixer) return null

  const switchablePorts = mixer.ports.filter((p) => p.mode === 'switchable-mono-stereo')
  if (switchablePorts.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 16, padding: '8px 0', fontSize: 13 }}>
      {switchablePorts.map((port) => {
        const current = project.switchablePortModes.find((m) => m.portId === port.id)?.mode ?? 'mono'
        return (
          <label key={port.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {port.label} mode:
            <select
              value={current}
              onChange={(e) => setSwitchablePortMode(project.id, { portId: port.id, mode: e.target.value as 'mono' | 'stereo' })}
            >
              <option value="mono">Mono (mic)</option>
              <option value="stereo">Stereo (line)</option>
            </select>
          </label>
        )
      })}
    </div>
  )
}

function emptyChannel(channelNumber: number): InputChannel {
  return {
    id: crypto.randomUUID(),
    channelNumber,
    source: 'New Source',
    sourceKind: 'mic',
    connectorType: 'XLR',
    phantomPower: false,
    status: 'confirmed',
    auxLevels: [],
  }
}

export function InputListTable({ project }: InputListTableProps) {
  const mixer = getMixerDefinition(project.mixerDefinitionId)
  const addChannel = useProjectStore((s) => s.addChannel)
  const updateChannel = useProjectStore((s) => s.updateChannel)
  const removeChannel = useProjectStore((s) => s.removeChannel)
  const { selectedElementId, selectedChannelId, selectChannel } = useUiStore()

  if (!mixer) return <div>Unknown mixer definition.</div>

  const issues = validateProject(project, mixer)
  const projectLevelIssues = issues.filter((i) => !i.channelId)

  function issuesFor(channelId: string) {
    return issues.filter((i) => i.channelId === channelId).map((i) => i.message)
  }

  return (
    <div>
      <SwitchablePortModeControls project={project} />

      {projectLevelIssues.length > 0 && (
        <div style={{ background: '#fff4e5', border: '1px solid #f0c36d', borderRadius: 4, padding: 8, marginBottom: 8 }}>
          {projectLevelIssues.map((issue) => (
            <div key={issue.id} style={{ fontSize: 13, color: '#8a4b00' }}>
              ⚠ {issue.message}
            </div>
          ))}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', background: '#f7f7f7' }}>
            <th style={cellStyle}>#</th>
            <th style={cellStyle}>Source</th>
            <th style={cellStyle}>Kind</th>
            <th style={cellStyle}>Connector</th>
            <th style={cellStyle}>Intermediate device</th>
            <th style={cellStyle}>Mixer port</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Notes</th>
            <th style={cellStyle} />
          </tr>
        </thead>
        <tbody>
          {project.channels.map((channel) => {
            const rowIssues = issuesFor(channel.id)
            const isSelected = channel.id === selectedChannelId
            const isLinkedHighlight = !isSelected && !!selectedElementId && channel.linkedElementId === selectedElementId
            return (
              <tr
                key={channel.id}
                onClick={() => selectChannel(channel.id)}
                style={{
                  background: isSelected ? '#fff9e0' : isLinkedHighlight ? '#fffbcc' : undefined,
                  cursor: 'pointer',
                }}
              >
                <td style={cellStyle}>
                  <input
                    type="number"
                    value={channel.channelNumber}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (Number.isNaN(value)) return
                      updateChannel(project.id, channel.id, { channelNumber: value })
                    }}
                    style={{ ...inputStyle, width: 48 }}
                  />
                </td>
                <td style={cellStyle}>
                  <input
                    value={channel.source}
                    onChange={(e) => updateChannel(project.id, channel.id, { source: e.target.value })}
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <label style={{ fontSize: 11, color: '#666' }}>
                      <input
                        type="checkbox"
                        checked={channel.phantomPower}
                        onChange={(e) => updateChannel(project.id, channel.id, { phantomPower: e.target.checked })}
                      />{' '}
                      +48V
                    </label>
                  </div>
                </td>
                <td style={cellStyle}>
                  <select
                    value={channel.sourceKind}
                    onChange={(e) => updateChannel(project.id, channel.id, { sourceKind: e.target.value as SourceKind })}
                    style={inputStyle}
                  >
                    {SOURCE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={cellStyle}>
                  <select
                    value={channel.connectorType}
                    onChange={(e) => updateChannel(project.id, channel.id, { connectorType: e.target.value as ConnectorType })}
                    style={inputStyle}
                  >
                    {CONNECTOR_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={cellStyle}>
                  <input
                    value={channel.intermediateDevice ?? ''}
                    placeholder="e.g. Fender Rumble 40, XLR line out"
                    onChange={(e) => updateChannel(project.id, channel.id, { intermediateDevice: e.target.value || undefined })}
                    style={inputStyle}
                  />
                </td>
                <td style={{ ...cellStyle, minWidth: 140 }}>
                  <PortAssignmentPicker
                    mixer={mixer}
                    value={channel.mixerPortId}
                    onChange={(portId) => updateChannel(project.id, channel.id, { mixerPortId: portId })}
                    warnings={rowIssues}
                  />
                </td>
                <td style={cellStyle}>
                  <select
                    value={channel.status}
                    onChange={(e) => updateChannel(project.id, channel.id, { status: e.target.value as InputChannel['status'] })}
                    style={inputStyle}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="tentative">Tentative</option>
                  </select>
                </td>
                <td style={cellStyle}>
                  <input
                    value={channel.notes ?? ''}
                    onChange={(e) => updateChannel(project.id, channel.id, { notes: e.target.value || undefined })}
                    style={inputStyle}
                  />
                </td>
                <td style={cellStyle}>
                  <button type="button" onClick={() => removeChannel(project.id, channel.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button
        type="button"
        style={{ marginTop: 8 }}
        onClick={() => {
          const nextChannelNumber = project.channels.reduce((max, c) => Math.max(max, c.channelNumber), 0) + 1
          addChannel(project.id, emptyChannel(nextChannelNumber))
        }}
      >
        + Add input
      </button>
    </div>
  )
}
