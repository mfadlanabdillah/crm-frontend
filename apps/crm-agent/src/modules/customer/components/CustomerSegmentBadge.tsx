import { useTranslation } from 'react-i18next'
import type { CustomerSegment } from '@crm/api-client'
import { Badge } from '@crm/ui'
import type { BadgeTone } from '@crm/ui'

const tones: Record<CustomerSegment, BadgeTone> = {
  regular: 'neutral',
  business: 'info',
  priority: 'warning',
}

export function CustomerSegmentBadge({ segment }: { segment: CustomerSegment }) {
  const { t } = useTranslation()
  return <Badge tone={tones[segment]}>{t(`customer.segments.${segment}`)}</Badge>
}
