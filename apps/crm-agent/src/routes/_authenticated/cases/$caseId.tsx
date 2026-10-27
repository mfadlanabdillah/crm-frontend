import { createFileRoute } from '@tanstack/react-router'
import { CaseDetailPage } from '@/modules/case/pages/CaseDetailPage'

export const Route = createFileRoute('/_authenticated/cases/$caseId')({
  component: CaseDetailPage,
})
