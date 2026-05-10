// Meals — Food log with calorie estimation
import { useState } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { UtensilsCrossed, Plus, Droplets, Flame as FireIcon } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'

const MOCK_MEALS = [
  { id: 1, type: 'Breakfast', time: '08:30', items: 'Oats with banana, green tea', calories: 320, icon: '🥣' },
  { id: 2, type: 'Lunch', time: '13:00', items: 'Rice, dal, chicken curry, salad', calories: 650, icon: '🍛' },
  { id: 3, type: 'Snack', time: '16:30', items: 'Almonds, apple', calories: 180, icon: '🍎' },
]

const MEAL_TYPES = [
  { type: 'Breakfast', icon: '🥣', color: '#FF9800' },
  { type: 'Lunch', icon: '🍛', color: '#4CAF50' },
  { type: 'Snack', icon: '🍎', color: '#2196F3' },
  { type: 'Dinner', icon: '🍽️', color: '#9C27B0' },
]

export default function Meals() {
  const [meals, setMeals] = useState(MOCK_MEALS)
  const [showAdd, setShowAdd] = useState(false)
  const [newMeal, setNewMeal] = useState({ type: '', items: '' })
  const toast = useToast()
  const totalCal = meals.reduce((s, m) => s + m.calories, 0)
  const goal = 2000
  const pct = Math.min(Math.round((totalCal / goal) * 100), 100)
  const water = 6 // glasses

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Meals</h1>
            <p className="body-s text-secondary">Track what you eat 🍽️</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Log
          </HapticButton>
        </div>

        {/* Calories + Water */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <FireIcon size={20} color="#FF5722" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{totalCal}</div>
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
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <Droplets size={20} color="#2196F3" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{water}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/ 8 glasses</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 8 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < water ? '#2196F3' : 'var(--bg-secondary)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Meal Timeline */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Today's Meals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meals.map((meal, i) => (
            <motion.div key={meal.id} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{meal.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{meal.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{meal.time} · {meal.items}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--viya-warning)' }}>{meal.calories} cal</div>
            </motion.div>
          ))}

          {/* Unlogged meals */}
          {MEAL_TYPES.filter(mt => !meals.find(m => m.type === mt.type)).map(mt => (
            <motion.div key={mt.type} whileTap={{ scale: 0.98 }}
              onClick={() => { setNewMeal({ type: mt.type, items: '' }); setShowAdd(true) }}
              className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5, cursor: 'pointer', border: '1.5px dashed var(--border-light)' }}>
              <div style={{ fontSize: 28 }}>{mt.icon}</div>
              <div style={{ flex: 1, fontSize: 14, color: 'var(--text-tertiary)' }}>Log {mt.type}</div>
              <Plus size={18} color="var(--text-tertiary)" />
            </motion.div>
          ))}
        </div>

        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title={`Log ${newMeal.type || 'Meal'}`}>
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            AI calorie estimation coming soon ✨
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
