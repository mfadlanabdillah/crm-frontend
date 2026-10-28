import { createFileRoute, notFound } from '@tanstack/react-router'
import { lazy } from 'react'

// A static DEV guard lets the bundler drop the gallery (and this import) from production builds.
const Gallery = import.meta.env.DEV
  ? lazy(() => import('@/app/design-system/Gallery').then((m) => ({ default: m.Gallery })))
  : null

export const Route = createFileRoute('/_authenticated/design-system')({
  beforeLoad: () => {
    if (!Gallery) throw notFound()
  },
  component: () => (Gallery ? <Gallery /> : null),
})
