import type { MixerDefinition } from '../../types'

interface PortAssignmentPickerProps {
  mixer: MixerDefinition
  value: string | undefined
  onChange: (portId: string | undefined) => void
  warnings: string[]
}

export function PortAssignmentPicker({ mixer, value, onChange, warnings }: PortAssignmentPickerProps) {
  return (
    <div>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        style={{ width: '100%' }}
      >
        <option value="">Unassigned</option>
        {mixer.ports.map((port) => (
          <option key={port.id} value={port.id}>
            {port.label}
          </option>
        ))}
      </select>
      {warnings.map((warning, i) => (
        <div key={i} style={{ fontSize: 11, color: '#a8380d', marginTop: 2 }}>
          ⚠ {warning}
        </div>
      ))}
    </div>
  )
}
