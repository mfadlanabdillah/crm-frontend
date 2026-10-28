import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  DescriptionItem,
  DescriptionList,
  EmptyState,
  ErrorState,
  FormField,
  Inline,
  Input,
  PageHeader,
  Pagination,
  SectionHeading,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  StatCard,
  Table,
  TBody,
  Td,
  TextLink,
  Textarea,
  Th,
  THead,
  Tr,
} from '@crm/ui'
import type { BadgeTone } from '@crm/ui'

/**
 * Every shared component in every state, on one page (dev only: /design-system). It is the place to
 * check a change by eye, and e2e/a11y.spec.ts scans it with axe so no state ships inaccessible.
 * The texts are English on purpose: this page is a developer tool, not product UI.
 */
const TONES: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger', 'muted']

const SWATCHES = [
  ['surface', 'bg-surface'],
  ['surface-raised', 'bg-surface-raised'],
  ['surface-muted', 'bg-surface-muted'],
  ['border-subtle', 'bg-border-subtle'],
  ['ink', 'bg-ink'],
  ['ink-muted', 'bg-ink-muted'],
  ['brand', 'bg-brand'],
  ['brand-strong', 'bg-brand-strong'],
  ['brand-soft', 'bg-brand-soft'],
  ['success', 'bg-success'],
  ['success-soft', 'bg-success-soft'],
  ['warning', 'bg-warning'],
  ['warning-soft', 'bg-warning-soft'],
  ['danger', 'bg-danger'],
  ['danger-soft', 'bg-danger-soft'],
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`ds-${title}`} className="space-y-3">
      <h3 id={`ds-${title}`} className="text-sm font-semibold text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function Gallery() {
  const [page, setPage] = useState(2)
  const [visibility, setVisibility] = useState<'customer' | 'internal'>('customer')

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <PageHeader
          title="Design system"
          description="Shared components from @crm/ui and the tokens they use. Development only."
        />

        <Section title="Color tokens">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {SWATCHES.map(([name, cls]) => (
              <li key={name} className="text-xs text-ink-muted">
                <span className={`mb-1 block h-8 rounded-lg border border-border-subtle ${cls}`} />
                {name}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Subject" hint="3 to 120 characters.">
              {(control) => <Input type="text" {...control} />}
            </FormField>
            <FormField label="Subject with an error" error="Subject needs at least 3 characters.">
              {(control) => <Input type="text" defaultValue="ab" {...control} />}
            </FormField>
            <FormField label="Priority">
              {(control) => (
                <Select {...control}>
                  <option>Normal</option>
                  <option>Urgent</option>
                </Select>
              )}
            </FormField>
            <FormField label="Description">{(control) => <Textarea {...control} />}</FormField>
          </div>
          <SegmentedControl
            aria-label="Visibility"
            value={visibility}
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'internal', label: 'Internal' },
            ]}
            onChange={setVisibility}
          />
        </Section>

        <Section title="Alert">
          <Alert>Could not save. Check the connection and try again.</Alert>
          <Alert tone="success">Saved.</Alert>
          <Alert tone="warning">The SLA is due in one hour.</Alert>
          <Alert tone="info">Drafts are kept until you sign out.</Alert>
        </Section>

        <Section title="Card and description list">
          <Card>
            <DescriptionList layout="grid">
              <DescriptionItem label="Phone">0812 3000 0007</DescriptionItem>
              <DescriptionItem label="City">Makassar</DescriptionItem>
            </DescriptionList>
          </Card>
        </Section>

        <Section title="Table, link, and pagination">
          <Card padded={false} className="overflow-hidden">
            <Table>
              <THead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Segment</Th>
                </Tr>
              </THead>
              <TBody>
                <Tr>
                  <Td>
                    <TextLink href="#table">Siti Lestari</TextLink>
                  </Td>
                  <Td>
                    <Badge tone="info">Regular</Badge>
                  </Td>
                </Tr>
              </TBody>
            </Table>
            <Pagination page={page} totalPages={5} onPageChange={setPage} />
          </Card>
          <p className="text-sm text-ink">
            A link inside running text is always underlined:{' '}
            <TextLink href="#inline" inline>
              open the case
            </TextLink>
            .
          </p>
        </Section>

        <Section title="Layout and figures">
          <Stack gap="sm">
            <SectionHeading>A section heading</SectionHeading>
            <Inline justify="between">
              <StatCard label="Unassigned" value="2.760" />
              <StatCard label="Overdue" value={<TextLink href="#overdue">7.790</TextLink>} />
            </Inline>
          </Stack>
        </Section>

        <Section title="Loading, empty, and error">
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
          <Card padded={false}>
            <EmptyState title="No cases yet" description="Change the filters or search again." />
          </Card>
          <Card padded={false}>
            <ErrorState onRetry={() => {}} />
          </Card>
        </Section>
      </div>
    </div>
  )
}
