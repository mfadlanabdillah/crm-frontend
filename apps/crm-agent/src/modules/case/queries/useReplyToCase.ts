import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Case, CreateReplyRequest, TimelineEntry } from '@crm/api-client'
import { caseKeys } from './keys'
import { casesApi } from '../api/cases'

export function useReplyToCase(caseId: string) {
  const queryClient = useQueryClient()

  return useMutation<TimelineEntry, Error, CreateReplyRequest>({
    mutationFn: (body) => casesApi.reply(caseId, body),

    onSuccess: (entry) => {
      queryClient.setQueryData<Case>(caseKeys.detail(caseId), (current) =>
        current
          ? {
              ...current,
              updatedAt: entry.createdAt,
              timeline: [...current.timeline, entry],
            }
          : current,
      )
      // Daftar menampilkan "diperbarui", jadi tandai stale tanpa refetch paksa.
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists(), refetchType: 'none' })
    },
  })
}
