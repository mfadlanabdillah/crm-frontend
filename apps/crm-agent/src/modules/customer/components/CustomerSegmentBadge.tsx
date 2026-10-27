import { useTranslation } from 'react-i18next'
import type { CustomerSegment } from '@crm/api-client'
import { Badge } from '@/components/ui/badge'
import type { BadgeTone } from '@/components/ui/badge'

const tones: Record<CustomerSegment, BadgeTone> = {
  regular: 'neutral',
  business: 'info',
  priority: 'warning',
}

export function CustomerSegmentBadge({ segment }: { segment: CustomerSegment }) {
  const { t } = useTranslation()
  return <Badge tone={tones[segment]}>{t(`customer.segments.${segment}`)}</Badge>
}
