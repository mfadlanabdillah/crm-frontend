import { create } from 'zustand'
import type { CreateReplyRequest } from '@crm/api-client'

export interface ReplyDraft {
  body: string
  visibility: CreateReplyRequest['visibility']
}

interface DraftsState {
  drafts: Record<string, ReplyDraft>
  setDraft: (key: string, draft: ReplyDraft) => void
  clearDraft: (key: string) => void
  reset: () => void
}

/** Kunci draf: `${userId}:${caseId}`, supaya agen lain di tab yang sama tidak melihat draf ini. */
export const draftKey = (userId: string, caseId: string) => `${userId}:${caseId}`

/**
 * Draf balasan yang belum terkirim, hanya di memori (bukan storage): bertahan saat sesi habis
 * lalu masuk lagi tanpa reload, hilang saat logout, reload, atau tab ditutup.
 */
export const useDraftsStore = create<DraftsState>((set) => ({
  drafts: {},

  setDraft: (key, draft) => set((state) => ({ drafts: { ...state.drafts, [key]: draft } })),

  clearDraft: (key) =>
    set((state) => {
      const { [key]: _removed, ...rest } = state.drafts
      return { drafts: rest }
    }),

  reset: () => set({ drafts: {} }),
}))
