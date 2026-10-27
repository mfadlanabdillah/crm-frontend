import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { CreateCaseRequest } from '@crm/api-client'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useMasterData } from '../queries/useMasterData'
import { EMPTY_CREATE_CASE_FORM, createCaseSchema, toCreateCaseRequest } from '../schemas/create'
import type { CreateCaseForm } from '../schemas/create'

interface CaseFormProps {
  onSubmit: (values: CreateCaseRequest) => void
  onCancel: () => void
  isPending?: boolean
  /** Server-side failure (e.g. a 422), shown above the buttons. */
  error?: string | undefined
}

/**
 * Reference form: react-hook-form + a zod schema, errors as i18n keys, fields wired through
 * `FormField`. The component only emits a request; the page owns the mutation and navigation.
 */
export function CaseForm({ onSubmit, onCancel, isPending = false, error }: CaseFormProps) {
  const { t } = useTranslation()
  const { data: masterData } = useMasterData()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCaseForm>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: EMPTY_CREATE_CASE_FORM,
  })

  const message = (key: string | undefined) => (key ? t(key) : undefined)

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(toCreateCaseRequest(values)))}
      className="flex flex-col gap-4"
    >
      <FormField
        label={t('cases.create.subject')}
        hint={t('cases.create.subjectHint')}
        error={message(errors.subject?.message)}
      >
        {(control) => (
          <Input type="text" autoComplete="off" {...control} {...register('subject')} />
        )}
      </FormField>

      <FormField label={t('cases.create.description')} error={message(errors.description?.message)}>
        {(control) => <Textarea {...control} {...register('description')} />}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('cases.priority')} error={message(errors.priority?.message)}>
          {(control) => (
            <Select className="w-full" {...control} {...register('priority')}>
              <option value="">{t('cases.create.choose')}</option>
              {masterData?.priorities.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label={t('cases.queue')} error={message(errors.queue?.message)}>
          {(control) => (
            <Select className="w-full" {...control} {...register('queue')}>
              <option value="">{t('cases.create.choose')}</option>
              {masterData?.queues.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('cases.create.submitting') : t('cases.create.submit')}
        </Button>
      </div>
    </form>
  )
}
