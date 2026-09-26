import { create } from 'zustand'

export type EditorTab = 'stagePlot' | 'inputList' | 'monitorMixes'

interface UiState {
  selectedElementId: string | null
  selectedChannelId: string | null
  activeTab: EditorTab
  selectElement: (id: string | null) => void
  selectChannel: (id: string | null) => void
  setActiveTab: (tab: EditorTab) => void
  resetSelection: () => void
}

/**
 * Transient, non-persisted UI selection state shared between the canvas and
 * the input list so clicking an element highlights its linked channel row
 * (and vice versa) regardless of which tab is currently visible.
 */
export const useUiStore = create<UiState>((set) => ({
  selectedElementId: null,
  selectedChannelId: null,
  activeTab: 'stagePlot',
  selectElement: (id) => set({ selectedElementId: id }),
  selectChannel: (id) => set({ selectedChannelId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  resetSelection: () => set({ selectedElementId: null, selectedChannelId: null }),
}))
