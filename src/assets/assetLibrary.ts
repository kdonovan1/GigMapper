import type { AssetType } from '../types'

export interface AssetLibraryEntry {
  label: string
  defaultWidthFt: number
  defaultDepthFt: number
  /** Short text shown inside the shape on the canvas (functional, not polished art, for v1). */
  glyph: string
  fill: string
}

export const assetLibrary: Record<AssetType, AssetLibraryEntry> = {
  drumKit: { label: 'Drum Kit', defaultWidthFt: 6, defaultDepthFt: 5, glyph: 'DRUMS', fill: '#c97b63' },
  guitarAmp: { label: 'Guitar Amp', defaultWidthFt: 2, defaultDepthFt: 2, glyph: 'GTR AMP', fill: '#6b8f71' },
  bassAmp: { label: 'Bass Amp', defaultWidthFt: 2.5, defaultDepthFt: 2.5, glyph: 'BASS AMP', fill: '#4f7a8c' },
  keyboard: { label: 'Keyboard', defaultWidthFt: 4, defaultDepthFt: 2, glyph: 'KEYS', fill: '#8c6f9e' },
  micStand: { label: 'Mic Stand', defaultWidthFt: 1, defaultDepthFt: 1, glyph: 'MIC', fill: '#3a3a3a' },
  monitorWedge: { label: 'Monitor Wedge', defaultWidthFt: 2, defaultDepthFt: 1.5, glyph: 'WEDGE', fill: '#a67c52' },
  diBox: { label: 'DI Box', defaultWidthFt: 0.5, defaultDepthFt: 0.5, glyph: 'DI', fill: '#555555' },
  mixer: { label: 'Mixer', defaultWidthFt: 3, defaultDepthFt: 2, glyph: 'MIXER', fill: '#2f3b52' },
  table: { label: 'Table', defaultWidthFt: 4, defaultDepthFt: 2.5, glyph: 'TABLE', fill: '#9c8c6b' },
  paSpeaker: { label: 'PA Speaker', defaultWidthFt: 1.5, defaultDepthFt: 1.5, glyph: 'PA', fill: '#333f4d' },
  musician: { label: 'Musician', defaultWidthFt: 2, defaultDepthFt: 2, glyph: 'MUSICIAN', fill: '#b8934a' },
  custom: { label: 'Custom', defaultWidthFt: 2, defaultDepthFt: 2, glyph: '', fill: '#7a7a7a' },
}

export const assetTypes = Object.keys(assetLibrary) as AssetType[]
