import type { AnyRouter } from '@tanstack/react-router'

type RouteViewTransition = NonNullable<AnyRouter['options']['defaultViewTransition']>

/**
 * Crossfade between pages. A view transition freezes the page while it runs, so it is for changing
 * pages only: filtering or paging a list changes the search and keeps the path, and is skipped.
 *
 * It is off when the agent asks for reduced motion, and in browsers that cannot skip a transition
 * per navigation (without `:active-view-transition-type` the router would run one for every change,
 * filters included). Both are read once, when the router is created.
 */
export function routeViewTransition(): RouteViewTransition {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  if (!window.CSS?.supports?.('selector(:active-view-transition-type(a))')) return false

  return { types: ({ pathChanged }) => (pathChanged ? ['route'] : false) }
}
