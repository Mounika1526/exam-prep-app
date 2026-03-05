import { useState, useEffect } from 'react'

/**
 * Fixed reading-progress bar pinned to the very top of the viewport.
 * Reads scroll position from the <main> element (the layout's scrollable container).
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = main
      const scrollable = scrollHeight - clientHeight
      setProgress(scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0)
    }

    main.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initialise on mount
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
