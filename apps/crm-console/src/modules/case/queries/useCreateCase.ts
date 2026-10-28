import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateCaseRequest } from '@crm/api-client'
import { casesApi } from '../api/cases'
import { caseKeys } from './keys'

export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateCaseRequest) => casesApi.create(body),
    onSuccess: (created) => {
      queryClient.setQueryData(caseKeys.detail(created.id), created)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary() })
    },
  })
}
