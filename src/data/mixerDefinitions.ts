import type { MixerDefinition, MixerPort } from '../types'

function monoPort(n: number): MixerPort {
  return {
    id: `ch${n}`,
    label: `CH${n}`,
    channelNumbers: [n],
    mode: 'mono',
    micCapable: true,
    lineCapable: true,
    instrumentCapable: true,
  }
}

/**
 * Verified against Yamaha's MG16XU documentation (cross-referenced multiple
 * independent sources; the primary manual PDF itself was unreachable from
 * this environment's network egress proxy):
 * - ch1-8: mono combo XLR/TRS, mic + line + instrument(Hi-Z) capable.
 * - ch9/10 & ch11/12: switchable mono/stereo pairs. In MONO mode each pair
 *   is ONE mic input (not two) — the pair collapses to a single assignable
 *   mono mic channel. In STEREO mode it's one stereo TRS line input.
 *   Max simultaneous mic inputs on the whole board = 10 = 8 + 1 + 1, which
 *   matches Yamaha's published "Max. 10 Mic / 16 Line" spec.
 * - ch13/14 & ch15/16: stereo TRS line-only, no mic/XLR at all.
 * - AUX1: fixed pre-fader, no switch.
 * - AUX2: has its OWN independent pre/post switch (NOT linked/grouped with AUX1
 *   — this corrects an earlier assumption that AUX1/AUX2 shared a linked switch).
 * - AUX3: fixed post-fader, no switch.
 * - AUX4: fixed post-fader, and this is the aux that doubles as the FX
 *   (built-in SPX effects) send (corrects an earlier assumption that both
 *   AUX2 and AUX4 shared the FX bus — only AUX4 does).
 */
export const yamahaMG16XU: MixerDefinition = {
  id: 'yamaha-mg16xu',
  name: 'Yamaha MG16XU',
  ports: [
    ...Array.from({ length: 8 }, (_, i) => monoPort(i + 1)),
    {
      id: 'ch9_10',
      label: 'CH9/10',
      channelNumbers: [9, 10],
      mode: 'switchable-mono-stereo',
      micCapable: true,
      lineCapable: true,
      instrumentCapable: false,
    },
    {
      id: 'ch11_12',
      label: 'CH11/12',
      channelNumbers: [11, 12],
      mode: 'switchable-mono-stereo',
      micCapable: true,
      lineCapable: true,
      instrumentCapable: false,
    },
    {
      id: 'ch13_14',
      label: 'CH13/14',
      channelNumbers: [13, 14],
      mode: 'stereo',
      micCapable: false,
      lineCapable: true,
      instrumentCapable: false,
    },
    {
      id: 'ch15_16',
      label: 'CH15/16',
      channelNumbers: [15, 16],
      mode: 'stereo',
      micCapable: false,
      lineCapable: true,
      instrumentCapable: false,
    },
  ],
  auxSends: [
    { id: 'aux1', label: 'AUX1', fixedPrePost: 'pre' },
    { id: 'aux2', label: 'AUX2', switchablePrePost: true },
    { id: 'aux3', label: 'AUX3', fixedPrePost: 'post' },
    { id: 'aux4', label: 'AUX4', fixedPrePost: 'post', sharesFx: true },
  ],
}

export const mixerDefinitions: MixerDefinition[] = [yamahaMG16XU]

export function getMixerDefinition(id: string): MixerDefinition | undefined {
  return mixerDefinitions.find((m) => m.id === id)
}
