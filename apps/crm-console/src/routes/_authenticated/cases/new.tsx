import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/app/auth/guard'
import { CaseCreatePage } from '@/modules/case/pages/CaseCreatePage'

export const Route = createFileRoute('/_authenticated/cases/new')({
  beforeLoad: requirePermission('case.create'),
  component: CaseCreatePage,
})
