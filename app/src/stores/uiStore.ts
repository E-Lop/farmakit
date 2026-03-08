import { create } from "zustand";

interface UiStore {
  activeCabinetId: string | null;
  setActiveCabinet: (id: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activeCabinetId: null,
  setActiveCabinet: (id) => set({ activeCabinetId: id }),
}));
