import * as React from 'react'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 300   // ms after dismiss before DOM removal
const TOAST_AUTO_DISMISS  = 5000 // ms before auto-dismiss

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ActionType =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

interface State { toasts: Toast[] }

let count = 0
function genId() { return (++count).toString() }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function reducer(state: State, action: ActionType): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case 'UPDATE_TOAST':
      return { ...state, toasts: state.toasts.map(t => t.id === action.toast.id ? { ...t, ...action.toast } : t) }
    case 'DISMISS_TOAST': {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId)
      else state.toasts.forEach(t => addToRemoveQueue(t.id))
      return { ...state, toasts: state.toasts.map(t => (!toastId || t.id === toastId) ? { ...t, open: false } : t) }
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: action.toastId ? state.toasts.filter(t => t.id !== action.toastId) : [] }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(l => l(memoryState))
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: 'REMOVE_TOAST', toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = genId()
  dispatch({ type: 'ADD_TOAST', toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dispatch({ type: 'DISMISS_TOAST', toastId: id }) } } })
  // Auto-dismiss after TOAST_AUTO_DISMISS ms
  setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), TOAST_AUTO_DISMISS)
  return { id, dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }) }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => { const idx = listeners.indexOf(setState); if (idx > -1) listeners.splice(idx, 1) }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}
