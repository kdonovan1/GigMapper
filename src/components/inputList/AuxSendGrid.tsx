import type { CSSProperties } from 'react'
import { getMixerDefinition } from '../../data/mixerDefinitions'
import { useProjectStore } from '../../store/projectStore'
import type { StagePlotProject } from '../../types'

const cellStyle: CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #eee', textAlign: 'center' }

interface AuxSendGridProps {
  project: StagePlotProject
}

export function AuxSendGrid({ project }: AuxSendGridProps) {
  const mixer = getMixerDefinition(project.mixerDefinitionId)
  const setAuxAssignmentLabel = useProjectStore((s) => s.setAuxAssignmentLabel)
  const setAuxAssignmentPrePost = useProjectStore((s) => s.setAuxAssignmentPrePost)
  const setChannelAuxLevel = useProjectStore((s) => s.setChannelAuxLevel)

  if (!mixer) return <div>Unknown mixer definition.</div>

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#f7f7f7' }}>
          <th style={{ ...cellStyle, textAlign: 'left' }}>Channel</th>
          {mixer.auxSends.map((aux) => {
            const assignment = project.auxAssignments.find((a) => a.auxId === aux.id)
            const prePost = aux.fixedPrePost ?? assignment?.prePost ?? 'pre'
            return (
              <th key={aux.id} style={cellStyle}>
                <input
                  value={assignment?.label ?? aux.label}
                  onChange={(e) => setAuxAssignmentLabel(project.id, aux.id, e.target.value)}
                  style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {aux.switchablePrePost ? (
                    <select
                      value={prePost}
                      onChange={(e) => setAuxAssignmentPrePost(project.id, aux.id, e.target.value as 'pre' | 'post')}
                      style={{ fontSize: 11 }}
                    >
                      <option value="pre">pre</option>
                      <option value="post">post</option>
                    </select>
                  ) : (
                    <span style={badgeStyle}>{aux.fixedPrePost}</span>
                  )}
                  {aux.sharesFx && <span style={{ ...badgeStyle, background: '#e5d5ff' }}>FX</span>}
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {project.channels.map((channel) => (
          <tr key={channel.id}>
            <td style={{ ...cellStyle, textAlign: 'left' }}>{channel.source}</td>
            {mixer.auxSends.map((aux) => {
              const level = channel.auxLevels.find((a) => a.auxId === aux.id)?.level ?? null
              return (
                <td key={aux.id} style={cellStyle}>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={level ?? ''}
                    placeholder="—"
                    onChange={(e) =>
                      setChannelAuxLevel(project.id, channel.id, {
                        auxId: aux.id,
                        level: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    style={{ width: 48, textAlign: 'center' }}
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const badgeStyle: CSSProperties = {
  fontSize: 10,
  padding: '1px 5px',
  borderRadius: 8,
  background: '#e0e0e0',
  color: '#333',
}
