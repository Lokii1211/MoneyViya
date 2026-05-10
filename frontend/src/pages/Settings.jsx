// Settings — Full settings hub with toggles
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Moon, Shield, Smartphone, Mail, MessageCircle, Globe, Trash2, LogOut, ChevronRight, Volume2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { useApp } from '../lib/store'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

function SettingsToggle({ label, desc, value, onChange, icon: Icon }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="var(--text-secondary)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>}
      </div>
      <div style={{
        width: 46, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
        background: value ? 'var(--viya-primary-500)' : 'var(--bg-secondary)',
        transition: 'background 0.2s',
      }}>
        <motion.div animate={{ x: value ? 20 : 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </motion.div>
  )
}

function SettingsLink({ label, desc, icon: Icon, onClick, danger }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? '#F4433618' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={danger ? '#F44336' : 'var(--text-secondary)'} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? '#F44336' : 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>}
      </div>
      <ChevronRight size={16} color="var(--text-tertiary)" />
    </motion.div>
  )
}

export default function Settings() {
  const { theme, setTheme } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [pushNotifs, setPushNotifs] = useState(true)
  const [whatsappNotifs, setWhatsappNotifs] = useState(true)
  const [smsAccess, setSmsAccess] = useState(false)
  const [haptics, setHaptics] = useState(true)
  const [darkMode, setDarkMode] = useState(theme === 'dark')

  const toggleDark = (val) => {
    setDarkMode(val)
    setTheme(val ? 'dark' : 'light')
    toast.show(val ? 'Dark mode on 🌙' : 'Light mode on ☀️', 'info')
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Settings</h1>
          <p className="body-s text-secondary">Customize your Viya ⚙️</p>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '4px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', padding: '12px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notifications</div>
          <SettingsToggle label="Push Notifications" desc="Bill reminders, habit nudges" value={pushNotifs} onChange={setPushNotifs} icon={Bell} />
          <SettingsToggle label="WhatsApp Alerts" desc="Daily briefs, proactive messages" value={whatsappNotifs} onChange={setWhatsappNotifs} icon={MessageCircle} />
          <SettingsToggle label="Sound & Haptics" desc="Vibration on interactions" value={haptics} onChange={setHaptics} icon={Volume2} />
        </div>

        {/* Permissions */}
        <div className="card" style={{ padding: '4px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', padding: '12px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Permissions</div>
          <SettingsToggle label="SMS Access" desc="Auto-detect bank transactions" value={smsAccess} onChange={setSmsAccess} icon={Smartphone} />
          <SettingsLink label="Email Access" desc="Connected via Gmail" icon={Mail} onClick={() => nav('/email')} />
        </div>

        {/* Appearance */}
        <div className="card" style={{ padding: '4px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', padding: '12px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Appearance</div>
          <SettingsToggle label="Dark Mode" desc="Easy on the eyes" value={darkMode} onChange={toggleDark} icon={Moon} />
        </div>

        {/* About & Legal */}
        <div className="card" style={{ padding: '4px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', padding: '12px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>About</div>
          <SettingsLink label="Privacy Policy" icon={Shield} onClick={() => nav('/privacy')} />
          <SettingsLink label="Terms of Service" icon={Globe} onClick={() => nav('/terms')} />
          <SettingsLink label="Help & Support" icon={MessageCircle} onClick={() => nav('/help')} />
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '4px 16px' }}>
          <SettingsLink label="Delete Account" desc="Permanently delete all data" icon={Trash2} onClick={() => nav('/delete-account')} danger />
          <SettingsLink label="Log Out" icon={LogOut} onClick={() => { /* logout */ }} danger />
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Viya V3.0.0 · Made with ❤️ in India
        </div>
      </div>
    </PageTransition>
  )
}
