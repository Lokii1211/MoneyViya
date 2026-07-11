// Meals — Food log with calorie estimation
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { UtensilsCrossed, Plus, Droplets, Flame as FireIcon, Loader, Trash2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

const MEAL_TYPES = [
  { type: 'Breakfast', icon: '🥣', color: '#FF9800' },
  { type: 'Lunch', icon: '🍛', color: '#4CAF50' },
  { type: 'Snack', icon: '🍎', color: '#2196F3' },
  { type: 'Dinner', icon: '🍽️', color: '#9C27B0' },
]

const getMealIcon = (type) => {
  const match = MEAL_TYPES.find(mt => mt.type.toLowerCase() === (type || '').toLowerCase())
  return match ? match.icon : '🍽️'
}

export default function Meals() {
  const { phone } = useApp()
  const toast = useToast()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newMeal, setNewMeal] = useState({ type: '', name: '', calories: '' })
  const [saving, setSaving] = useState(false)

  const goal = 2000
  const [water, setWater] = useState(0)
  const [waterLoading, setWaterLoading] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadMeals()
    loadWater()
  }, [phone])

  const loadMeals = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMeals(phone)
      setMeals(data || [])
    } catch (e) {
      console.error('Failed to load meals:', e)
      setError('Failed to load meals')
      toast.show('Could not load meals', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadWater = async () => {
    try {
      const log = await api.getHealthLog(phone)
      if (log && log.water_glasses != null) {
        setWater(Number(log.water_glasses) || 0)
      }
    } catch (e) {
      console.error('Failed to load water data:', e)
    }
  }

  const handleAddWater = async () => {
    if (waterLoading) return
    setWaterLoading(true)
    const newCount = water + 1
    setWater(newCount) // optimistic update
    try {
      await api.upsertHealthLog(phone, { water_glasses: newCount })
    } catch (e) {
      console.error('Failed to update water:', e)
      setWater(water) // revert on error
      toast.show('Could not update water', 'error')
    } finally {
      setWaterLoading(false)
    }
  }

  const handleAddMeal = async () => {
    if (!newMeal.name.trim() || !newMeal.type) return
    setSaving(true)
    try {
      const result = await api.addMeal(phone, {
        name: newMeal.name.trim(),
        calories: Number(newMeal.calories) || 0,
        meal_type: newMeal.type,
      })
      if (result) {
        setMeals(prev => [...prev, result])
        setNewMeal({ type: '', name: '', calories: '' })
        setShowAdd(false)
        toast.show('Meal logged!', 'success')
      } else {
        toast.show('Failed to log meal', 'error')
      }
    } catch (e) {
      console.error('Failed to add meal:', e)
      toast.show('Failed to log meal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMeal = async (id) => {
    try {
      const ok = await api.deleteMeal(id)
      if (!ok) { toast.show('Failed to remove meal', 'error'); return }
      setMeals(prev => prev.filter(m => m.id !== id))
      toast.show('Meal removed', 'success')
    } catch (e) {
      toast.show('Failed to remove meal', 'error')
    }
  }

  const totalCal = meals.reduce((s, m) => s + (Number(m.calories) || 0), 0)
  const pct = Math.min(Math.round((totalCal / goal) * 100), 100)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Meals</h1>
            <p className="body-s text-secondary">Track what you eat</p>
          </div>
          <HapticButton size="sm" onClick={() => { setNewMeal({ type: '', name: '', calories: '' }); setShowAdd(true) }}>
            <Plus size={16} /> Log
          </HapticButton>
        </div>

        {/* Calories + Water */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <FireIcon size={20} color="#FF5722" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
              {loading ? '...' : totalCal}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/ {goal} kcal</div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--bg-secondary)', marginTop: 8, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 3, background: pct > 90 ? '#F44336' : 'var(--viya-primary-500)' }}
              />
            </div>
          </div>
          <motion.div
            className="card"
            style={{ padding: 16, textAlign: 'center', cursor: 'pointer' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddWater}
          >
            <Droplets size={20} color="#2196F3" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{water}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/ 8 glasses</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 8 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < water ? '#2196F3' : 'var(--bg-secondary)' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--viya-primary-500)', marginTop: 6, fontWeight: 600 }}>
              {waterLoading ? 'Saving...' : 'Tap to add glass'}
            </div>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--viya-primary-500)" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--viya-error)', marginBottom: 12 }}>{error}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={loadMeals}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--viya-primary-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Meal Timeline */}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Today's Meals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meals.map((meal, i) => (
                <motion.div key={meal.id} variants={listItem} initial="initial" animate="animate"
                  className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{getMealIcon(meal.meal_type || meal.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{meal.meal_type || meal.type || 'Meal'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {meal.name || meal.items || ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--viya-warning)' }}>
                    {meal.calories || 0} cal
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDeleteMeal(meal.id)}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Trash2 size={14} color="var(--viya-error)" />
                  </motion.button>
                </motion.div>
              ))}

              {/* Unlogged meals */}
              {MEAL_TYPES.filter(mt => !meals.find(m =>
                (m.meal_type || m.type || '').toLowerCase() === mt.type.toLowerCase()
              )).map(mt => (
                <motion.div key={mt.type} whileTap={{ scale: 0.98 }}
                  onClick={() => { setNewMeal({ type: mt.type, name: '', calories: '' }); setShowAdd(true) }}
                  className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5, cursor: 'pointer', border: '1.5px dashed var(--border-light)' }}>
                  <div style={{ fontSize: 28 }}>{mt.icon}</div>
                  <div style={{ flex: 1, fontSize: 14, color: 'var(--text-tertiary)' }}>Log {mt.type}</div>
                  <Plus size={18} color="var(--text-tertiary)" />
                </motion.div>
              ))}

              {/* Empty state if nothing at all */}
              {meals.length === 0 && (
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <UtensilsCrossed size={28} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No meals logged today. Tap a meal type above to start.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Meal Sheet */}
        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title={`Log ${newMeal.type || 'Meal'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Meal Type Selection */}
            {!newMeal.type && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Select Meal Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {MEAL_TYPES.map(mt => (
                    <motion.button key={mt.type} whileTap={{ scale: 0.95 }}
                      onClick={() => setNewMeal(prev => ({ ...prev, type: mt.type }))}
                      style={{
                        padding: 16, borderRadius: 14, border: '1.5px solid var(--border-light)',
                        background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center',
                      }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{mt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{mt.type}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {newMeal.type && (
              <>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>What did you eat?</div>
                  <input
                    type="text"
                    value={newMeal.name}
                    onChange={e => setNewMeal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Oats with banana, green tea"
                    style={{
                      width: '100%', padding: 14, borderRadius: 14,
                      border: '1.5px solid var(--border-light)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Calories (optional)</div>
                  <input
                    type="number"
                    value={newMeal.calories}
                    onChange={e => setNewMeal(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="e.g. 350"
                    style={{
                      width: '100%', padding: 14, borderRadius: 14,
                      border: '1.5px solid var(--border-light)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit',
                    }}
                  />
                </div>
                <HapticButton fullWidth onClick={handleAddMeal} disabled={!newMeal.name.trim() || saving}>
                  {saving ? 'Saving...' : 'Log Meal'}
                </HapticButton>
              </>
            )}
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
