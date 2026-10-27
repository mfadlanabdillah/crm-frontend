import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Case, UpdateCaseRequest } from '@crm/api-client'
import { caseKeys } from '@/lib/query-keys'
import { casesApi } from '../api/cases'

function applyPatch(current: Case, patch: UpdateCaseRequest): Case {
  return {
    ...current,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.queue ? { queue: patch.queue } : {}),
    ...(patch.priority ? { priority: patch.priority } : {}),
  }
}

interface MutationContext {
  previous?: Case
}

/** Update status/prioritas/antrean dengan optimistic update + rollback. */
export function useUpdateCase(caseId: string) {
  const queryClient = useQueryClient()

  return useMutation<Case, Error, UpdateCaseRequest, MutationContext>({
    mutationFn: (patch) => casesApi.update(caseId, patch),

    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: caseKeys.detail(caseId) })
      const previous = queryClient.getQueryData<Case>(caseKeys.detail(caseId))
      if (previous) {
        queryClient.setQueryData(caseKeys.detail(caseId), applyPatch(previous, patch))
      }
      return { previous }
    },

    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(caseKeys.detail(caseId), context.previous)
      }
    },

    onSuccess: (updated) => {
      queryClient.setQueryData(caseKeys.detail(caseId), updated)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary() })
    },
  })
}
