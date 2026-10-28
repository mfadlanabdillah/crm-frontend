import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { cn } from './cn'

/** The look of a text link; use it on a router `Link` or any anchor. */
export const textLinkClasses = 'font-medium text-brand-strong hover:underline'

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Called on a plain left click instead of following the `href`. The `href` stays real, so
   * "open in a new tab", copy link, and middle click keep working.
   */
  onNavigate?: () => void
  /** Underline always: required for a link inside running text, which color alone cannot mark. */
  inline?: boolean
}

export function TextLink({
  onNavigate,
  inline = false,
  className,
  onClick,
  href,
  children,
  ...props
}: TextLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !onNavigate) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    onNavigate()
  }

  return (
    <a
      className={cn(textLinkClasses, inline && 'underline underline-offset-2', className)}
      onClick={handleClick}
      href={href}
      {...props}
    >
      {children}
    </a>
  )
}
