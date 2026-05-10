// Framer Motion page transition variants — iOS-native feel
export const slideRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 220, mass: 0.8 } },
  exit: { x: '-25%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}

export const slideLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 220 } },
  exit: { x: '25%', opacity: 0, transition: { duration: 0.2 } },
}

export const fadeUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 22, stiffness: 200 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.15 } },
}

export const scaleIn = {
  initial: { scale: 0.92, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 18, stiffness: 200 } },
  exit: { scale: 0.92, opacity: 0, transition: { duration: 0.15 } },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// Bottom sheet slide up
export const sheetUp = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { y: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
}

// Staggered list children
export const listContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
}

export const listItem = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 20 } },
}

// Card pop
export const cardPop = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 15, stiffness: 150 } },
}

// Tab content switch
export const tabSwitch = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.12 } },
}
