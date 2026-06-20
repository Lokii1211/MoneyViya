// SkeletonLoader — content-aware skeleton loading states
import { motion } from 'framer-motion'

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
  },
}

function Bone({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <motion.div
      variants={shimmer}
      animate="animate"
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary, #2a2a3a) 50%, var(--bg-secondary) 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bone width={40} height={40} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bone width="60%" height={14} />
          <Bone width="40%" height={10} />
        </div>
        <Bone width={60} height={20} radius={10} />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Bone width="40%" height={18} />
      <Bone width="100%" height={160} radius={12} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Bone width="30%" height={12} />
        <Bone width="30%" height={12} />
        <Bone width="30%" height={12} />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
      <Bone width={80} height={80} radius={40} />
      <Bone width="50%" height={18} />
      <Bone width="30%" height={12} />
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bone width={120} height={14} />
          <Bone width={180} height={22} />
        </div>
        <Bone width={40} height={40} radius={20} />
      </div>
      <Bone width="100%" height={140} radius={20} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Bone width="25%" height={70} radius={14} />
        <Bone width="25%" height={70} radius={14} />
        <Bone width="25%" height={70} radius={14} />
        <Bone width="25%" height={70} radius={14} />
      </div>
      <ListSkeleton count={3} />
    </div>
  )
}

export default Bone
