/**
 * Legacy route: /test/:sessionId/results
 * Redirect to the canonical /test/:sessionId/result
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/test/$sessionId/results')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to:     '/test/$sessionId/result',
      params: { sessionId: params.sessionId },
    })
  },
  component: () => null,
})
