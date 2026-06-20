import { useEffect } from 'react'
import { useUserStore } from '../stores'

export function AppProvider({ children }) {
  const theme = useUserStore(s => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light')
  }, [theme])

  return children
}

export function useApp() {
  const store = useUserStore()
  return store
}
