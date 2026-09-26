import type { CSSProperties } from 'react'
import { getMixerDefinition } from '../data/mixerDefinitions'
import type { StagePlotProject } from '../types'
import { validateProject } from '../utils/mixerValidation'

interface PrintViewProps {
  project: StagePlotProject
  snapshotDataUrl: string | null
}

const th: CSSProperties = { textAlign: 'left', borderBottom: '1px solid #000', padding: '2px 6px', fontSize: 10 }
const td: CSSProperties = { borderBottom: '1px solid #ccc', padding: '2px 6px', fontSize: 10, breakInside: 'avoid' }

export function PrintView({ project, snapshotDataUrl }: PrintViewProps) {
  const mixer = getMixerDefinition(project.mixerDefinitionId)
  if (!mixer) return null

  const issues = validateProject(project, mixer)
  const issuesByChannel = new Map<string, string[]>()
  const projectLevelIssues: string[] = []
  for (const issue of issues) {
    if (issue.channelId) {
      issuesByChannel.set(issue.channelId, [...(issuesByChannel.get(issue.channelId) ?? []), issue.message])
    } else {
      projectLevelIssues.push(issue.message)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#000', padding: '0.25in' }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>{project.name}</h1>
        <div style={{ fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {project.venue && <span>Venue: {project.venue}</span>}
          {project.showDate && <span>Date: {project.showDate}</span>}
          {project.contactInfo && <span>Contact: {project.contactInfo}</span>}
          <span>Mixer: {mixer.name}</span>
        </div>
      </header>

      <section style={{ breakAfter: 'page' }}>
        <h2 style={{ fontSize: 14, margin: '0 0 6px' }}>Stage Plot</h2>
        {snapshotDataUrl ? (
          <img src={snapshotDataUrl} alt="Stage plot layout" style={{ maxWidth: '100%', height: 'auto', border: '1px solid #999' }} />
        ) : (
          <p style={{ fontSize: 12, color: '#666' }}>No snapshot captured yet — open the Stage Plot tab and try Export/Print again.</p>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 6px' }}>Input List &amp; Signal Plan</h2>
        {projectLevelIssues.length > 0 && (
          <div style={{ fontSize: 11, marginBottom: 6 }}>
            {projectLevelIssues.map((msg, i) => (
              <div key={i}>⚠ {msg}</div>
            ))}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Source</th>
              <th style={th}>Kind</th>
              <th style={th}>Connector</th>
              <th style={th}>Intermediate device</th>
              <th style={th}>Port</th>
              <th style={th}>Status</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {project.channels.map((channel) => {
              const port = mixer.ports.find((p) => p.id === channel.mixerPortId)
              const rowIssues = issuesByChannel.get(channel.id) ?? []
              return (
                <tr key={channel.id}>
                  <td style={td}>{channel.channelNumber}</td>
                  <td style={td}>
                    {channel.source}
                    {channel.status === 'tentative' && ' (tentative)'}
                  </td>
                  <td style={td}>{channel.sourceKind}</td>
                  <td style={td}>{channel.connectorType}</td>
                  <td style={td}>{channel.intermediateDevice ?? ''}</td>
                  <td style={td}>
                    {port?.label ?? '—'}
                    {rowIssues.length > 0 && (
                      <div style={{ color: '#a8380d' }}>
                        {rowIssues.map((msg, i) => (
                          <div key={i}>⚠ {msg}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={td}>{channel.status}</td>
                  <td style={td}>{channel.notes ?? ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 14, margin: '0 0 6px' }}>Monitor Mixes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Channel</th>
              {mixer.auxSends.map((aux) => {
                const assignment = project.auxAssignments.find((a) => a.auxId === aux.id)
                const prePost = aux.fixedPrePost ?? assignment?.prePost ?? 'pre'
                return (
                  <th key={aux.id} style={th}>
                    {assignment?.label ?? aux.label} ({prePost}
                    {aux.sharesFx ? ', FX' : ''})
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {project.channels.map((channel) => (
              <tr key={channel.id}>
                <td style={td}>{channel.source}</td>
                {mixer.auxSends.map((aux) => {
                  const level = channel.auxLevels.find((a) => a.auxId === aux.id)?.level ?? null
                  return (
                    <td key={aux.id} style={{ ...td, textAlign: 'center' }}>
                      {level ?? '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
