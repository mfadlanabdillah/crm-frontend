import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CaseForm } from '@/modules/case/components/CaseForm'
import { useCreateCase } from '@/modules/case/queries/useCreateCase'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'

export function CaseCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateCase()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">{t('cases.create.title')}</h2>
        <CaseForm
          isPending={create.isPending}
          error={create.error?.message}
          onCancel={() => void navigate({ to: '/cases', search: DEFAULT_CASE_SEARCH })}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (created) =>
                void navigate({ to: '/cases/$caseId', params: { caseId: created.id } }),
            })
          }
        />
      </div>
    </div>
  )
}
