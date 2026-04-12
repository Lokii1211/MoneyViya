import { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [phone, setPhone] = useState(localStorage.getItem('mv_phone')||'')
  const [token, setToken] = useState(localStorage.getItem('mv_token')||'')
  const [theme, setThemeState] = useState(localStorage.getItem('mv_theme') || 'light')
  const isLoggedIn = !!token

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mv_theme', theme)
  }, [theme])

  function toggleTheme() {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  function setTheme(t) {
    setThemeState(t)
  }

  function login(p, t, u) {
    const c = p.replace(/[+\s]/g,'')
    setPhone(c); setToken(t); setUser(u)
    localStorage.setItem('mv_phone',c)
    localStorage.setItem('mv_token',t)
    localStorage.setItem('mv_user',JSON.stringify(u||{}))
  }

  function logout() {
    setPhone(''); setToken(''); setUser(null)
    localStorage.removeItem('mv_phone')
    localStorage.removeItem('mv_token')
    localStorage.removeItem('mv_user')
  }

  useEffect(()=>{ if(token) try{ setUser(JSON.parse(localStorage.getItem('mv_user')||'{}')) }catch{} },[token])

  return (
    <Ctx.Provider value={{user,setUser,phone,token,isLoggedIn,login,logout,theme,toggleTheme,setTheme}}>
      {children}
    </Ctx.Provider>
  )
}
export const useApp = () => useContext(Ctx)
