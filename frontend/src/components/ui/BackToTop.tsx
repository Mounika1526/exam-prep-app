import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    const onScroll = () => setVisible(main.scrollTop > 400)
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <Button
      size="icon"
      variant="secondary"
      className="fixed bottom-20 right-4 z-40 shadow-md rounded-full h-10 w-10"
      onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <ChevronUp className="h-4 w-4" />
    </Button>
  )
}
