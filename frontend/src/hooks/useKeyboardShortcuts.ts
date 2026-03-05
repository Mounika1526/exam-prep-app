import { useEffect, useRef } from 'react'

/**
 * Register global keyboard shortcuts.
 * @param handlers - Map of shortcut string to handler. Format: "ctrl+k", "alt+s", "escape"
 */
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  // Use ref so handlers don't need to be in the dep array (avoids infinite loops)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey  && 'ctrl',
        e.metaKey  && 'meta',
        e.altKey   && 'alt',
        e.shiftKey && 'shift',
        e.key.toLowerCase(),
      ].filter(Boolean).join('+')

      const handler = handlersRef.current[key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
