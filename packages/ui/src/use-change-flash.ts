import { useEffect, useState } from 'react'

/**
 * True for a moment after `value` changes while the component stays mounted, never on the first
 * render: use it to tint a row or cell that someone else just updated (`animate-change-flash`). Reduced
 * motion cuts the animation itself; this only decides when the class is on.
 */
export function useChangeFlash(value: string | number | null | undefined, duration = 1200) {
  const [seen, setSeen] = useState(value)
  const [flashing, setFlashing] = useState(false)

  // Comparing during render, rather than in an effect, avoids a frame with the old value.
  if (seen !== value) {
    setSeen(value)
    setFlashing(true)
  }

  useEffect(() => {
    if (!flashing) return
    const timer = setTimeout(() => setFlashing(false), duration)
    return () => clearTimeout(timer)
  }, [flashing, duration, value])

  return flashing
}
