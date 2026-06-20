# VIYA AI — COMPLETE HIGH-END MOBILE APP DESIGN BRIEF
## End-to-End Design Prompts for Million-Dollar App Experience
## For Figma / Stitch / Any Premium Design Tool

---

> **DESIGN DIRECTIVE:**
> You are a world-class product designer who has shipped interfaces for
> Stripe, Linear, Notion, and Robinhood. You understand that great design
> is invisible — it guides without forcing, delights without distracting,
> and builds trust through every micro-decision.
>
> Viya AI is not a finance app with a health tab bolted on.
> It is a LIVING INTELLIGENCE — visually, it must breathe, pulse, and respond
> like something alive. Every screen must feel like a $10M product.
>
> Reference quality: Linear's speed + Stripe's trust + Duolingo's delight
> Target: 4.8 stars on App Store. Design awards. Viral screenshots.

---

## SECTION 1: TARGET AUDIENCE AND PLATFORM

### 1.1 Platform Targets

```
PRIMARY PLATFORM: Both iOS and Android (React Native)
Design source: Figma (single source, exported for both)

iOS TARGETS:
  Minimum: iOS 16.0
  Primary design device: iPhone 15 Pro (393×852 pt @3x)
  Secondary: iPhone SE 3rd gen (375×667 pt @2x) — test small screens
  Tablet: iPad Air (if needed for admin dashboard only)
  Design resolution: @1x (React Native standard)
  Safe areas: Dynamic Island aware, home indicator spacing

ANDROID TARGETS:
  Minimum: Android 7.0 (API 24)
  Primary design device: Pixel 8 Pro (412×915 dp @3.5x)
  Secondary: Samsung Galaxy A54 (412×892 dp) — India's top seller
  Edge-to-edge: Full bleed, gesture navigation aware
  Design resolution: 360dp base width (scales to all Android screens

FRAME SIZES FOR MOCKUPS:
  iPhone 15 Pro: 393×852 (use this as primary)
  Pixel 8: 412×917 (secondary)
  All flows designed at both sizes, delivered as both
```

### 1.2 Primary User Demographics

```
WHO IS USING THIS APP:

SEGMENT A — METRO PROFESSIONAL (40% of users):
  Age: 24-35 | City: Mumbai, Bengaluru, Delhi, Hyderabad, Chennai
  Device: iPhone 14+ or flagship Android (OnePlus, Samsung S-series)
  Visual preference: Clean, fast, information-dense, minimal chrome
  Reference apps they love: Notion, Zepto, CRED, Linear
  What impresses them: Speed, data density, no unnecessary friction

SEGMENT B — HOMEMAKER / FAMILY MANAGER (30% of users):
  Age: 28-42 | City: Tier 1 and Tier 2 India
  Device: Mid-range Android (Samsung A-series, Redmi)
  Visual preference: Warm, friendly, clear hierarchy, reassuring
  Reference apps they love: WhatsApp, Meesho, BigBasket
  What impresses them: Clarity, warmth, nothing feels technical

SEGMENT C — YOUNG SAVER / STUDENT (30% of users):
  Age: 18-26 | City: Anywhere in India
  Device: Budget Android (Redmi Note, Realme)
  Visual preference: Vibrant, energetic, gamified, social-shareable
  Reference apps they love: Duolingo, Instagram, Groww
  What impresses them: Progress visualization, gamification, shareability

DESIGN RESOLUTION:
  Must work beautifully for all three segments
  Metro professional: Appreciates information density + micro-details
  Homemaker: Appreciates clear labels + warm tones + large touch targets
  Student: Appreciates animation + color + celebration moments
  Solution: Single design system that scales between these needs
```

---

## SECTION 2: APP CATEGORY AND CORE VALUE PROPOSITION

### 2.1 Category and Positioning

```
APP STORE CATEGORY:
  Primary: Finance
  Secondary: Health & Fitness
  Reality: Personal Productivity + AI Assistant

CORE VALUE PROPOSITION (Design Must Communicate):
  "Your AI Second Brain — Money, Health, Life — All in One"

WHAT THE DESIGN MUST MAKE USERS FEEL:
  On first open:   "This is different from every other app I've used"
  On home screen:  "Everything I need, right here, instantly"
  On chat:         "This is like texting a brilliant friend"
  On wealth screen: "I feel in control of my money"
  On health screen: "I'm making progress, and it shows"
  On achievement:  "I need to share this"

COMPETITIVE DESIGN DIFFERENTIATION:
  vs CRED:         CRED is exclusive and cold — Viya is intelligent and warm
  vs ET Money:     ET Money is a tool — Viya is a companion
  vs HealthifyMe:  HealthifyMe tracks — Viya understands
  vs Google Assist: Assistant reacts — Viya anticipates

THE VISUAL PROMISE:
  Every screen must look like it was designed by someone who
  deeply cares about the user's actual life, not just the feature.
```

---

## SECTION 3: VISUAL LANGUAGE

### 3.1 Color Palette — Complete Specification

```
═══════════════════════════════════════
FOUNDATION PALETTE
═══════════════════════════════════════

PRIMARY — AURORA TEAL
  #00E5B0  Primary brand (vibrant, alive, distinctive)
  #00B88D  Darker (hover states, borders on light bg)
  #E0FFF9  Lightest tint (card backgrounds, subtle fills)
  Usage: Brand moments, progress fills, success states, CTAs

SECONDARY — COSMOS VIOLET
  #5514FF  AI intelligence color (deep, premium, smart)
  #9972FF  Lighter variant (gradients, accents)
  #F2EEFF  Tint (AI card backgrounds)
  Usage: AI responses, premium features, depth elements

ACHIEVEMENT — SOLAR GOLD
  #FFD700  Pure gold (achievement moments only)
  #F5A623  Warm gold (CTA buttons, energy)
  #FFF0BF  Tint (celebration card backgrounds)
  Usage: Milestones, achievements, celebration moments

MONEY — EMERALD LIFE
  #00E87E  Financial success, positive changes, income
  #008B4C  Dark variant (text on light backgrounds)
  #E6FFF4  Tint (success card backgrounds)
  Usage: Money left, income, savings, positive financial data

ALERT — CORAL FIRE
  #FF5040  Urgency, overdue, errors (NOT shame — urgency)
  #FF7062  Softer variant
  #FFF0EE  Tint
  Usage: Overdue bills, errors, critical alerts ONLY

AMBER — ATTENTION
  #FF9800  Warning, due-soon, caution
  #FFF3E0  Tint
  Usage: Bills due soon, attention states, caution

NEUTRAL SCALE (12 steps):
  #FFFFFF  Pure white (card backgrounds)
  #F8FAFA  Off-white (screen backgrounds)
  #F0F4F4  Light gray (subtle fills)
  #E0E8E8  Border light
  #C0CECE  Border medium
  #90A8A8  Text tertiary
  #607878  Text secondary
  #304848  Text primary (light mode)
  #1E3030  Dark text
  #0D1818  Near black
  #12121E  Dark surface 1
  #08080F  Dark background

DARK MODE ADDITIONAL:
  #0E0E1C  Primary surface
  #161626  Cards
  #1E1E34  Elevated cards
  #262644  Input fields
  #2E2E50  Borders
  #EEEEFF  Text primary (dark)
  #9090BB  Text secondary (dark)
  #606088  Text tertiary (dark)

═══════════════════════════════════════
GRADIENT LIBRARY
═══════════════════════════════════════

HERO GRADIENT (Primary brand moments):
  Direction: 135°
  From: #00E5B0 (0%)
  To:   #5514FF (100%)
  Use: FAB, primary CTAs, achievement highlights

WEALTH GRADIENT (Finance screens):
  Direction: 135°
  From: #00E87E (0%)
  To:   #00E5B0 (100%)
  Use: Net worth card, financial hero cards

HEALTH GRADIENT (Health screens):
  Direction: 135°
  From: #FF7062 (0%)
  Via:  #FF9800 (50%)
  To:   #FFD700 (100%)
  Use: Health score, steps card, energy moments

AI GRADIENT (AI / Chat moments):
  Direction: 135°
  From: #5514FF (0%)
  To:   #9972FF (100%)
  Use: Viya thinking state, AI feature highlights

ACHIEVEMENT GRADIENT (Win moments):
  Direction: 135°
  From: #FFD700 (0%)
  To:   #F5A623 (100%)
  Use: Goal completion, streaks, badges

MORNING GRADIENT (Daily brief):
  Direction: 135°
  From: #F5A623 (0%)
  Via:  #FF7062 (35%)
  To:   #00E5B0 (100%)
  Use: Morning brief card, sunrise energy

NIGHT GRADIENT (Dark bg elements):
  Direction: 180°
  From: #08021A (0%)
  To:   #001814 (100%)
  Use: Dark hero cards, splash screen

CARD DEPTH (Subtle):
  Direction: 145°
  From: #FFFFFF (0%)
  To:   #F0FFFC (100%)
  Use: White cards with subtle brand tint
```

### 3.2 Typography System

```
FONT SELECTION RATIONALE:
  Sora: Modern geometric, excellent at large sizes, strong personality
        Weights: 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
        Use: All headlines, display text, the "voice" of the brand

  Inter: The most readable sans-serif for screens, neutral character
         Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)
         Use: All body text, labels, UI copy — never competes with Sora

  JetBrains Mono: Purpose-built for numbers, monospace alignment
                  Weights: 400, 500, 600
                  Use: EVERY financial number, statistics, code
                  Why: Vertical alignment in columns, instant number recognition

REGIONAL FONTS (Load async, same x-height as Inter):
  Hindi:   Noto Sans Devanagari 400, 600
  Tamil:   Noto Sans Tamil 400, 600
  Telugu:  Noto Sans Telugu 400, 600
  Kannada: Noto Sans Kannada 400, 600
  Bengali: Noto Sans Bengali 400, 600

TYPE SCALE (Mobile-optimized):

  HERO        Sora 800    48/56px    -1.5px    Splash, celebration
  H1          Sora 700    34/42px    -0.8px    Screen titles
  H2          Sora 700    26/34px    -0.4px    Section headers
  H3          Sora 600    22/30px    -0.2px    Card titles
  H4          Inter 600   18/26px    0px       Sub-headers
  BODY-L      Inter 400   18/28px    +0.1px    Chat messages, important text
  BODY-M      Inter 400   16/24px    +0.1px    Standard body
  BODY-S      Inter 400   14/20px    +0.2px    Secondary text
  LABEL       Inter 600   11/16px    +1.2px    UPPERCASE labels, categories
  NUM-XL      JBMono 700  48/56px    -1px      Net worth, main balance
  NUM-L       JBMono 600  32/40px    -0.5px    Secondary amounts
  NUM-M       JBMono 500  22/30px    0px       Inline amounts
  NUM-S       JBMono 400  16/24px    0px       Small amounts, stats
  CAPTION     Inter 400   12/16px    0px       Timestamps, fine print

CRITICAL TYPOGRAPHIC RULES:
  1. Numbers are ALWAYS JetBrains Mono — never Inter or Sora
  2. Indian format ALWAYS: ₹1,50,000 (never ₹150,000)
  3. Sora never used below 18px (loses character at small sizes)
  4. Maximum line length: 72 characters (readability)
  5. Minimum body text: 14px (accessibility)
  6. Negative amounts: coral-500 color
  7. Positive amounts: emerald-500 color
  8. Neutral amounts: neutral-900 (light) or neutral-0 (dark)
```

### 3.3 Iconography System

```
ICON LIBRARY: Phosphor Icons (6 styles, consistent design language)
  Why Phosphor: Consistent weight, 6 styles (Regular/Bold/Fill/Duotone/Light/Thin),
                covers every use case, excellent at small sizes, open source

ICON USAGE BY STYLE:
  Regular: Default navigation, inactive states, body icons
  Bold: Active states, emphasized actions
  Fill: Selected states (tab bar active, selected items)
  Duotone: Feature highlights, larger icons (40px+), special moments
  
ICON SIZING:
  16px: Inline text icons, tiny status indicators
  20px: Dense list items, chips, small buttons
  24px: Standard navigation, list items, tab bar
  28px: Action buttons, emphasized UI
  32px: Feature icons in cards
  40px: Section heroes, feature callouts
  48px: Empty states, onboarding icons
  64px: Large illustrations, achievement badges
  96px: Splash, celebration screens

CUSTOM VIYA ICONS (Need design, not in library):
  Viya Orb: Animated logo/avatar (see motion section)
  Indian Rupee ₹: Custom weight matching brand font
  Financial health: Custom composite icon
  Life score: Custom ring/gauge icon
  Family mode: Custom multi-person icon
  AA Framework: Custom bank-link icon

EMOJI USAGE (Intentional, not decorative):
  Categories: Each category has ONE canonical emoji
    Food: 🍔  Transport: 🚗  Shopping: 🛍️  Health: 💊
    Entertainment: 🎬  Bills: 🧾  Investment: 📈  Goals: 🎯
    Family: 👨‍👩‍👧  Work: 💼  Travel: ✈️  Education: 📚

  Achievements: Celebratory emojis in milestone moments
  Urgency: 🔴 for overdue (NEVER just red color alone)
  Tone: 💚 for Viya's caring messages
  Max per message: 4 emojis maximum (discipline)
```

### 3.4 Motion Design Guidelines

```
MOTION PHILOSOPHY:
  "Motion communicates state, rewards behavior, and builds trust.
   It never shows off. It never delays. It always has purpose."

SPRING PHYSICS (React Native Reanimated 3):
  DEFAULT SPRING:   { damping: 18, stiffness: 200, mass: 1.0 }
  BOUNCY SPRING:    { damping: 10, stiffness: 180, mass: 1.0 }
  TIGHT SPRING:     { damping: 25, stiffness: 300, mass: 1.0 }
  SLOW SPRING:      { damping: 20, stiffness: 120, mass: 1.2 }
  OVERSHOOT:        { damping: 8,  stiffness: 150, mass: 1.0 }

TIMING EASING:
  EASE-OUT:  cubic-bezier(0.0, 0.0, 0.2, 1.0) — Element arriving
  EASE-IN:   cubic-bezier(0.4, 0.0, 1.0, 1.0) — Element leaving
  EASE:      cubic-bezier(0.4, 0.0, 0.2, 1.0) — Standard movement
  LINEAR:    Never use (mechanical, inhuman)

DURATION SCALE:
  MICRO:       80-100ms   Icon swap, state indicator change
  QUICK:       150-180ms  Button press feedback
  STANDARD:    250-280ms  Screen transitions, card expand
  DELIBERATE:  320-380ms  Modal sheets, onboarding
  CELEBRATION: 500-2000ms Achievement unlocks, goal completion

60 FPS NON-NEGOTIABLE:
  All animations on UI thread (Reanimated worklets)
  Never animate: width, height, padding, margin, top, left
  Always animate: transform (scale/translate/rotate), opacity
  Test: Enable "Show frame rate" in developer settings
  Alert: If any animation drops below 58fps → fix before shipping

SPECIFIC ANIMATIONS (Designed and approved):

1. VIYA ORB — The Brand's Heartbeat:
   Idle state:
     Breathing: scale 1.0 → 1.04 → 1.0, 3.5s, ease-in-out, infinite
     Glow ring: expands outward (scale 1→2), opacity 0.35→0, 3.5s loop
   
   Thinking state (AI processing):
     Faster pulse: scale 1.0 → 1.1 → 1.0, 0.8s, tight spring, loop
     Color shift: teal → cosmos gradient, 0.4s ease
     Add: Second inner ring, faster rotation
   
   Speaking state (sending message):
     Waveform rings: 3 expanding rings, 60ms stagger
     Each ring: scale 1→2.5, opacity 0.5→0, 1.2s
   
   Success state (action completed):
     Flash: emerald color pulse, 0.3s
     Scale: 1→1.2→1 with tight spring, 0.4s
     Return: Back to idle breathing

2. BUTTON PRESS — Feel Physical:
   Touch down:  scale 0.97, shadow reduce 60%, 80ms ease-in
   Touch up:    scale 1.01 (slight overshoot), 120ms spring
   Settle:      scale 1.0, 60ms tight spring
   Haptic:      impact.light on touchDown
   
   Disabled state: opacity 0.4, no animation on press

3. CARD INTERACTION — Depth Illusion:
   Touch down:  scale 0.98, translateY 1px, shadow reduce, 80ms
   Touch up:    spring back to 1.0, shadow returns, 180ms
   Long press (if applicable): scale 0.96, stronger shadow reduction

4. NUMBER COUNT-UP — Financial Satisfaction:
   Trigger: Any financial number changes
   Method: Frame-by-frame interpolation
   Duration: 700ms ease-out cubic-bezier
   Overshoot: +3% then settle (spring feel)
   Color flash: 
     Increase: emerald flash (150ms, opacity 0→1→0)
     Decrease: coral flash (150ms)
   
   Example: ₹12,400 → ₹15,200
   Animation: ₹12,400 → ₹12,800 → ₹13,800 → ₹15,000 → ₹15,280 → ₹15,200

5. PROGRESS BAR FILL — Motivating:
   On mount: Animates from 0 to current value
   Duration: 800ms ease-out
   Fill: gradient-hero applied as linear gradient
   Milestone pulse: When bar reaches 25/50/75/100%:
     Bar briefly pulses (scale 1.0→1.02→1.0 vertically), 400ms
     Milestone dot: scale 0→1.3→1.0 with bounce spring
     
6. STREAK FIRE — The Hook:
   New streak day added:
     Fire emoji: translateY 0→-12px→0, scale 1→1.4→1, 400ms spring
   
   Streak milestone (7/14/21/30 days):
     Background: Gold gradient sweeps across screen (1s)
     Fire: scale 1→2.5, opacity burst
     Particles: 8 fire emojis radiate outward from icon
     Number: Count-up animation
     Haptic: impact.heavy
     Sound: Optional cheerful tone

7. CHAT MESSAGE ENTRANCE:
   Viya messages:
     Origin: Appears at Viya orb position
     Motion: Slides right + fades in, translateX(-12px)→0, 200ms spring
   
   User messages:
     Origin: Input bar position
     Motion: Slides left + fades in, translateX(12px)→0, 150ms
   
   Action cards:
     Origin: Below, slides up 16px + fades, 250ms spring
   
   Typing indicator:
     Appears after 600ms (not immediately — feels more natural)
     3 dots bounce: Each dot translateY 0→-6px→0, stagger 120ms

8. SCREEN TRANSITIONS:
   Stack push (navigate forward):
     New screen: translateX(100%)→0, 280ms ease-out
     Old screen: translateX(0)→(-30%), 280ms ease-out (parallax)
   
   Stack pop (go back):
     Current screen: translateX(0)→(100%), 250ms ease-in
     Previous screen: translateX(-30%)→0, 250ms ease-in
   
   Modal open:
     Sheet: translateY(100%)→0, 350ms spring (damping 0.85)
     Backdrop: opacity 0→0.5, 250ms
   
   Tab switch: Instant (no animation — this is universal standard)
   
9. PULL TO REFRESH — Branded:
   Pull starts: Viya orb descends from top (scale 0→1 as user pulls)
   At threshold (72px): Orb begins rotation animation
   Release: Orb spins, "Syncing..." appears beside it
   Complete: Checkmark draws inside orb, "Updated" text fades in
   Dismiss: Orb scales back up, content refreshes with fade

10. GOAL COMPLETION CELEBRATION:
    Trigger: goal.current >= goal.target
    
    Phase 1 (0-400ms):
      Gold overlay fades over full screen (opacity 0→0.9)
      Achievement card scales from center: 0→1.1→1.0, spring
    
    Phase 2 (400-1200ms):
      Confetti burst: 60 particles
        Colors: #FFD700, #00E5B0, #5514FF, #FF5040 (brand palette)
        Physics: Random velocity, gravity, rotation
        Shapes: Circle, square, teardrop (mix)
      Text reveals line by line (stagger 100ms per line)
    
    Phase 3 (1200ms+):
      Particles settle with gravity
      Share button pulses attention: scale 1.0→1.05→1.0, 800ms loop
      Haptic: notificationSuccess × 2 with 300ms pause between
    
    Dismissal: User tap or 5-second auto-dismiss
```

---

## SECTION 4: SCREENS AND FLOWS TO PRIORITIZE

### 4.1 Priority Tier 1 (Ship with MVP — Week 1-4)

```
SCREEN P1-A: SPLASH SCREEN
Screen ID: SL-001
Priority: CRITICAL (first impression)

Design Brief:
  Purpose: Brand impression + auth check (1.5 seconds max)
  Feeling: "This is going to be different"
  
Layout:
  Full screen: gradient-night background (#08021A → #001814)
  Center: Viya Orb (96px), animated (see motion section)
  Below orb: "VIYA" in Sora 800, 40px, letter-spacing 6px, white
  Below title: "AI Life & Wealth Partner" in Inter 400, 16px, white/55%
  Bottom: Loading progress bar (120px × 3px, gradient-hero fill, rounded)
  
Micro-details:
  Background: 8 floating micro-dots (white, 2-3px, 12% opacity, slow drift)
  Orb has: Inner glow (radial gradient center-to-transparent)
  "Powered by Claude AI" below bar: Inter 400, 11px, white/25%

Annotations for developer:
  Boot sequence: Check auth token while animation plays
  Auth valid: Navigate to Home at exactly 1.5s (never earlier)
  Auth invalid: Navigate to Language at exactly 1.5s
  Never show loading spinner — loading IS the animation

─────────────────────────────────────────────────────────

SCREEN P1-B: LANGUAGE SELECTION
Screen ID: OB-001

Design Brief:
  Purpose: Language choice + warm welcome
  Feeling: "This was made for me"
  
Layout:
  Background: White
  Top: 24px safe area + Viya orb small (44px, centered)
  Illustration area (40% screen height):
    Custom illustration: India outlined map
    6 speech bubbles rising from different states
    Each bubble: Language name in that language
    Animation: Bubbles float up gently, 4s stagger loop
  
  Content area:
    Title: "Viya aapki bhasha mein baat karta hai" (Sora 700, 22px)
    Subtitle: "Pick your language" in selected language (Inter 400, 16px, neutral-500)
    
  Grid (2 columns, 12px gap, 20px horizontal padding):
    [🇮🇳 English] [🇮🇳 हिंदी]
    [தமிழ்]      [తెలుగు]
    [ಕನ್ನಡ]      [मराठी]
    
    Each tile:
      Height: 64px | Radius: 14px
      Normal: White, 1.5px neutral-200 border, shadow-1
      Selected: teal-50 bg, 2px teal-500 border
      Check indicator: 20px circle top-right, gradient-hero bg, white ✓
      Press: scale 0.95, 80ms, haptic.light
      
  CTA: "Continue →" (full width, 56px, pill, gradient-hero)
    Disabled until language selected: neutral-100 bg

─────────────────────────────────────────────────────────

SCREEN P1-C: PHONE NUMBER INPUT
Screen ID: OB-002

Design Brief:
  Purpose: Fastest possible phone entry
  Feeling: "This took 5 seconds"

Layout:
  Progress: 4 step dots (dot 1 filled teal)
  
  Top: "What's your number?" (Sora 700, 30px, neutral-900)
  Subtitle: "One-time verification. No spam." (Inter 400, 16px, neutral-500)
  
  Phone input field (68px height):
    Container: border 1.5px neutral-200, radius 10px, white bg
    Left: Country code zone (100px)
      Flag emoji (22px) + "+91" (JBMono 500, 16px) + chevron (12px)
      Right separator: 1px neutral-100
    Right: Number input (flex-1)
      JBMono 500, 20px, auto-focus, numeric keyboard
      Format: "98765 43210" (space at 5)
    
    Focus: border teal-500, outer glow 0 0 0 4px teal-100
    Valid: Right side checkmark (emerald-500)
    
  Trust row: 🔒 Encrypted · 📵 No spam · 🗑️ Delete anytime
    (Inter 400, 12px, neutral-400, centered, tappable each)
  
  CTA: "Send Code →" (56px, pill)
    Disabled until 10 digits: neutral-100 bg, neutral-400 text
    Active: gradient-hero, shadow-teal
    Transition: 300ms smooth color change when activates

─────────────────────────────────────────────────────────

SCREEN P1-D: OTP VERIFICATION
Screen ID: OB-003

Design Brief:
  Purpose: Verify phone, feel secure and fast
  Feeling: "That was surprisingly elegant"

Layout:
  Animation header: Envelope opens → ✓ emerges (Lottie, 56px)
  
  Title: "Enter the 6-digit code" (Sora 700, 28px)
  Subtitle: "Sent to +91 98765 43210 · Edit" (Inter 400, 16px)
  
  OTP Row (6 boxes):
    Box size: 52×62px | Gap: 8px | Extra gap: 12px between box 3 and 4
    Font: JBMono 700, 30px, center-aligned
    
    State design:
    Empty:   neutral-100 bg, 1.5px neutral-200 border
    Active:  white bg, 2px teal-500 border, 0 0 0 4px teal-100 shadow
    Filled:  cosmos-50 bg, 1.5px cosmos-200 border, cosmos-700 text
    Success: emerald-50 bg, 2px emerald-500 border, checkmark path-draws inside
    Error:   coral-50 bg, 2px coral-500 border
    
    Success sequence: All boxes emerald → checkmarks draw staggered (40ms)
    Error sequence: All boxes coral → shake animation (±8px, 4 cycles)
  
  Resend: "Resend in 0:59" → "Resend Code" at 0:00 (teal-500 link)

─────────────────────────────────────────────────────────

SCREEN P1-E: HOME DASHBOARD
Screen ID: HM-001

Design Brief:
  Purpose: Everything important, instantly visible
  Feeling: "I never need to dig for anything"
  
This is the most important screen. Maximum polish.

HEADER (60px, sticky):
  Left: Viya Orb (38px, breathing animation) + "Good morning, Rahul" (Inter 600, 17px)
  Right: [🔍] [🔔 badge] [Avatar]
  
  Scroll behavior: Background gains blur(20px) + shadow as content scrolls under

DAILY BRIEF CARD (Full bleed, no side margins):
  Background: gradient-morning (warm to teal)
  Bottom radius: 28px (top corners square for full-bleed effect)
  
  "☀️ Daily Brief" (label, white/65%)
  "5 things need you today" (Sora 700, 24px, white)
  
  Item list (with stagger animation):
  ● 📧 3 emails need action
  ● 💳 HDFC bill ₹12,400 due tomorrow
  ● 💊 Vitamin D not taken yet
  ● 🎯 Add ₹600 to bike goal
  ● 🎂 Dad's birthday in 3 days
  
  [Handle All with Viya →] (white bg, cosmos-600 text, pill, 44px)

QUICK ACTION GRID (2×4 tiles):
  Screen margin: 20px
  Tile: (screenWidth - 40 - 24) / 4 wide × 76px tall
  
  Row 1: [🎤 Talk] [➕ Expense] [📧 Emails] [🔔 Remind]
  Row 2: [💰 Finance] [🏥 Health] [🎯 Goals] [🧾 Bills]
  
  Most-used tile: gradient-hero bg, white text (personalized)
  Others: White bg, shadow-2, emoji + label

WEALTH SNAPSHOT (20px margins):
  Background: gradient-wealth
  "₹12,34,567" (JBMono 700, 44px, white)
  "+₹8,200 this month" (Inter 500, 14px, gold-300)
  Sparkline: 32px, white line with area fill

GOALS ROW (Horizontal scroll, full bleed):
  Goal cards: 220px wide, white bg, shadow-2
  Progress bar: 8px, gradient-hero fill
  Milestone text: Body-S, teal-600

HEALTH PAIR (2 cards, 20px margins):
  Steps: Health gradient, half-arc SVG
  Calories: Wealth gradient

─────────────────────────────────────────────────────────

SCREEN P1-F: VIYA CHAT
Screen ID: CH-001

Design Brief:
  Purpose: Natural AI conversation, every message type polished
  Feeling: "This is WhatsApp but smarter"

Chat area background: neutral-50

Viya bubble: white bg, shadow-1, radius-lg (tl-4px gives speech tail)
User bubble: gradient-hero, white text, radius-lg (tr-4px)

Action card: emerald-50 bg, 4px emerald-500 left border
Insight card: teal-50 bg, 4px teal-500 left border  
Warning card: coral-50 bg, 4px coral-500 left border
Rich data card: white bg, shadow-2, embedded mini-charts

Input bar: White, top separator, pill input + voice/send

─────────────────────────────────────────────────────────

SCREEN P1-G: EMAIL INTELLIGENCE FEED
Screen ID: EM-001

Tabs: [🔴 Action (3)] [📅 Meetings (2)] [💰 Finance (5)] [📦 Orders (3)] [All]

BILL EMAIL CARD (Full design):
  White bg, shadow-2, radius-14
  Left border: 4px coral-500
  
  Header row: Bank name + time + "🔴 BILL" badge
  Divider: 1px neutral-100
  Extracted data grid:
    "Amount Due (Full)    ₹12,400.00" — JBMono for amount
    "Minimum Due          ₹1,240.00"
    "Due Date             Tomorrow"
    "Last Date            Jun 18 2024"
  Top spends: 2×2 grid of merchant + amount chips
  
  Action buttons: [Pay Full ₹12,400] [Remind Tonight] [View Statement]
  
MEETING CARD:
  Left border: 4px teal-500
  Extracted: Title + When + Where + With + Agenda
  Conflict check: "✅ Calendar free at this time"
  Actions: [Accept & Add] [Decline] [Suggest Time]
```

### 4.2 Priority Tier 2 (Ship Week 5-8)

```
SCREEN P2-A: WEALTH DASHBOARD
Screen ID: WL-001

Net worth hero with sparkline (gradient-wealth)
Spending donut (interactive, tap segment)
Timeline of upcoming financial events
Viya wealth insight (cosmos-50 card)

SCREEN P2-B: INVESTMENTS VIEW
Screen ID: WL-002

Portfolio total + XIRR + absolute returns
Fund cards: Sparkline + key metrics + SIP status
FD maturity alerts
Tax optimization insight

SCREEN P2-C: BILLS & PAYMENTS
Screen ID: WL-003

Overdue section (coral-50 background)
Due soon section (amber-50 background)
Upcoming section (neutral)
Subscription waste finder (cosmos-50)
EMI tracker with closing projections

SCREEN P2-D: HEALTH DASHBOARD
Screen ID: HL-001

Health score ring (SVG, gradient stroke)
Four pillars grid: Steps / Sleep / Water / Calories
Meal timeline: Breakfast/Lunch/Dinner/Snacks
Food scanner camera overlay
Medicine schedule with inline actions
Mood check-in (evenings)

SCREEN P2-E: FOOD SCANNER
Screen ID: HL-002

Full-screen camera with detection overlay
Bounding box around detected food (teal-500 border)
Bottom panel: Food name + nutrition + confidence
[Add to Meal ✓] [Edit Quantity] [Search Instead]

SCREEN P2-F: GOAL DETAIL
Screen ID: WL-004

Goal hero with large progress ring
Timeline chart (amount over time)
Milestone markers on progress
Contribution history
AI projection: "At this rate, done by [date]"
Celebration trigger when 100% reached
```

### 4.3 Priority Tier 3 (Ship Week 9-16)

```
SCREEN P3-A: ONBOARDING CONNECT SERVICES
Screen ID: OB-005

Service connection cards with OAuth flow
Gmail + Calendar + Bank + Health + SMS + Notifications
Connected state: emerald checkmark, account shown

SCREEN P3-B: VIYA MEMORY BROWSER
Screen ID: ME-001

All facts Viya knows about user
Categorized: Finance / Health / Family / Work / Personal
Each memory: Key + Value + Source + Last confirmed
Edit/Delete any memory
Semantic search across all memories

SCREEN P3-C: AI AGENTS DASHBOARD
Screen ID: AG-001

12 agent cards with activity logs
Agent status: Active / Inactive / Processing
Last action per agent with timestamp
Manage agent settings
Activity timeline: "What Viya did today"

SCREEN P3-D: PROFILE AND LIFE SCORE
Screen ID: PR-001

Life score (composite 0-100, animated ring)
Breakdown: Financial / Health / Productivity / Relationships
Progress toward each dimension
Connected services manager
Premium upgrade CTA (for free users)

SCREEN P3-E: ADMIN DASHBOARD
Screen ID: AD-001

Metric cards: DAU/MAU, Revenue, Error rate, Latency
User management table
AI cost breakdown by model tier
Notification delivery funnel
System health grid
Feature flag panel
```

---

## SECTION 5: INTERACTION AND GESTURE DETAILS

### 5.1 Premium Gesture Patterns

```
SWIPE INTERACTIONS:

Swipe left on transaction/email/bill item:
  Reveals: Delete (coral bg, trash icon) + Edit (teal bg, pencil icon)
  Physics: Elastic (continues beyond 60px then springs back if released)
  Haptic: tick at 60px (reveal threshold)
  Haptic: impact.medium at full-swipe threshold
  
  Full swipe left (>80% of width):
    Item slides out (0.2s), action fires, undo toast appears (5s)
  
  Release at partial: Springs back (spring physics)

Swipe right on task/reminder:
  Action: Mark done (emerald bg, check icon)
  Physics: Same elastic behavior
  Success: Item collapses with height animation, checkmark briefly shows

Pull to refresh (custom):
  Pull: Viya orb descends from top edge, scales 0→1 with pull distance
  At 72dp threshold: Orb begins spinning
  Release: Orb spins 1 full rotation, "Syncing..." appears
  Complete: Orb → checkmark morph, content fades in fresh

Pinch on chart:
  Time range expands (30D → 6M → 1Y → ALL)
  Haptic: selection.changed at each range change
  Labels: Animate with spring as they recalculate

Long press on goal card:
  Haptic: impact.medium at 400ms
  Card lifts (scale 1.02, shadow deepens)
  Context menu appears below/above
  Options: Edit Goal / Delete / Share Progress / Add Money

Long press on FAB:
  Haptic: impact.medium at 400ms
  Radial menu expands (6 items at 80dp radius)
  Backdrop: black/40% fades in with blur
  Each item scales from FAB center with 50ms stagger

Double tap on amount:
  Amount flashes (highlight bg)
  Copies to clipboard
  Toast: "Amount copied" (2 seconds, bottom)
  Haptic: selection.changed

────────────────────────────────────────────────────────────

KEYBOARD AND INPUT INTERACTIONS:

Phone input (auto-format):
  Type: "9876543210"
  Display: "98765 43210" (space inserted at 5)
  On 10th digit: Field gains emerald border (valid)
  Button activates: Smooth 300ms color transition to gradient-hero

OTP boxes (chain input):
  Type digit → auto-advance cursor to next box
  Backspace → clear current + focus previous
  Paste 6 digits → fill all boxes simultaneously (animate stagger 30ms)
  Android SMS → auto-detect and fill (with confirmation toast)
  6th digit → auto-submit (150ms delay, allows user to see filled state)

Amount input (financial):
  Keyboard: Numeric (no decimal unless needed)
  Format: Auto-commas "150000" → "₹1,50,000" as user types
  Negative: Prefix with − symbol and coral-500 color
  Clear button: Appears after first character, X icon right side

────────────────────────────────────────────────────────────

SCROLL BEHAVIORS:

Home screen scroll:
  0-32dp scrolled: Header transparent
  32dp+: Header gains white/95% + blur(20px) + subtle shadow
  Transition: Smooth, 60fps, no jumping

Chat screen scroll:
  New messages: Screen autoscrolls to bottom (smooth, 200ms)
  User scrolled up: Stop autoscroll, show "New message ↓" pill
  Tap pill: Scroll to bottom (spring animation)

Large lists (transactions, emails):
  Alphabet index (A-Z) on right side for contact lists
  "Jump to today" pill appears when scrolled to previous dates
  Sticky section headers (Today / Yesterday / This Week)

────────────────────────────────────────────────────────────

HAPTIC FEEDBACK MAP:

impact.light (subtle tap):
  All standard button presses
  List item selection
  Toggle switches
  Tab bar taps

impact.medium (moderate tap):
  FAB primary press
  Swipe action threshold reached
  Long press trigger
  Chip/filter selection

impact.heavy (strong tap):
  Destructive actions (delete confirm)
  Streak milestone
  Major navigation

selection.changed (tiny tick):
  Segmented control change
  Date picker scroll
  Double-tap copy

notificationSuccess:
  Goal milestone reached
  Task marked complete
  Payment confirmed
  Achievement unlocked

notificationWarning:
  Budget limit reached (80%)
  Bill due tomorrow alert

notificationError:
  Payment failed
  OTP invalid
  Network action failed
```

---

## SECTION 6: BRANDING CONSTRAINTS

### 6.1 Logo and Brand Usage

```
VIYA LOGO SYSTEM:

PRIMARY LOGO (App icon + header):
  Shape: Circle (perfect, no other shapes)
  Content: Abstract "V" constructed from neural network lines
           OR: Simple gradient sphere with light point (simpler, safer)
  Colors: gradient-hero (teal to cosmos violet)
  Minimum size: 24px diameter (smaller = use wordmark only)
  
  PROHIBITED:
  ❌ Never stretch or distort
  ❌ Never add drop shadows (shadow is part of context, not logo)
  ❌ Never use on busy backgrounds without backdrop
  ❌ Never use outdated colors (always gradient-hero)
  ❌ Never use as text (the "V" symbol is NOT for body text)

ADAPTIVE ICON (Android):
  Foreground: Orb centered, safe zone 66% of canvas
  Background: gradient-night (dark cosmos)
  Result: On home screen = squircle | In app drawer = circle

WORDMARK:
  Font: Sora 800 (ExtraBold)
  Text: "VIYA" (all caps)
  Letter-spacing: 4-6px
  Color options:
    On light bg: neutral-900
    On dark bg: white
    Brand moment: gradient-hero (text gradient)
  NEVER use the wordmark in: Body text, buttons, navigation labels

BRAND IN CONTEXT:
  Chat: Orb shows as Viya's "face" — animated, alive
  Header: Small orb (38px) beside greeting — subtle, present
  Splash: Large orb (96px) — full brand moment
  Loading: Orb spins — shows AI is working
  Achievement: Orb celebrates — scale animation

TAGLINE:
  "Your AI Second Brain" — for marketing
  "AI Life & Wealth Partner" — for App Store subtitle
  Neither should appear in app UI (too marketing-speak)
```

### 6.2 Brand Guidelines Compliance

```
COLOR COMPLIANCE:
  ✅ Primary teal (#00E5B0) used for: Borders, fills, icons, progress
  ❌ Primary teal NEVER used for: Body text on white (fails contrast 1.8:1)
  ✅ Use --viya-700 (#008B6A) for teal-colored TEXT on white backgrounds
  
  ✅ Cosmos violet used for: AI moments, premium features, depth
  ❌ Cosmos violet NEVER used for: Error states (reserved for coral)
  
  ✅ Coral (#FF5040) used for: Urgent bills, errors, overdue — ONLY
  ❌ Coral NEVER used for: Regular expense amounts (too alarming)
  
  ✅ Expenses shown in: cosmos-400 (#7743FF) — sophisticated, not shameful
  ❌ Expenses NEVER shown in: Red (triggers shame, avoidance)

TONE IN COPY:
  ✅ Warm, first-name basis ("Hey Rahul!", not "Dear User")
  ✅ Celebratory ("You're incredible!" for achievements)
  ✅ Direct ("Pay ₹12,400 by tomorrow", not "There appears to be a payment")
  ❌ NEVER corporate ("Please be advised that your payment...")
  ❌ NEVER preachy ("You should save more and control spending")
  ❌ NEVER passive ("Unable to process request")

INDIAN CONTEXT COMPLIANCE:
  ✅ Number format: ₹1,50,000 (always Indian format)
  ✅ Dates: "14 Jun" or "Jun 14" (never "06/14" — ambiguous for India)
  ✅ UPI shown first in payment methods
  ✅ Festival themes available (Diwali/Holi/Dussehra) as seasonal override
  ❌ NEVER: Western cultural references without Indian equivalent
  ❌ NEVER: Dollar signs ($) or Western number formatting in Indian context
```

---

## SECTION 7: DELIVERABLES FORMAT

### 7.1 Figma File Structure

```
FIGMA STRUCTURE:

📁 VIYA AI — DESIGN SYSTEM (Master Library)
  📁 Foundations
    🎨 Colors (all tokens as styles)
    📝 Typography (all text styles)
    🔲 Spacing (frame examples)
    💈 Gradients (gradient styles)
    🌑 Shadows (effect styles)
    🌙 Dark Mode (color overrides)
  
  📁 Atoms
    🔘 Buttons (all states: default/hover/press/loading/disabled/success)
    📝 Input Fields (all states: default/focus/filled/error/disabled)
    🏷️ Chips & Tags (all variants)
    💬 Badges & Indicators
    📊 Progress Bars (all variants)
    📏 Dividers
    🔔 Tooltips
  
  📁 Molecules
    💳 Cards (Standard / Hero / Gradient / Glass)
    📋 List Items (Transaction / Email / Task / Reminder)
    🔍 Search Bars
    📱 Bottom Sheets (empty + with content)
    🍞 Toast Notifications
    ⚪ Loading Skeletons
    📭 Empty States
    ⚠️ Error States
  
  📁 Organisms
    🏠 Home Dashboard Sections
    💬 Chat Message Types (all 8 variants)
    📧 Email Card Types (all 5 variants)
    💰 Financial Cards
    🏥 Health Pillars
    🎯 Goal Cards
    🧾 Bill Items
  
  📁 Navigation
    📊 Bottom Tab Bar (all states)
    📍 Header Variants (all types)
    🧭 FAB + Radial Menu

📁 VIYA AI — SCREENS
  📁 Onboarding
    OB-001 Language Selection
    OB-002 Phone Input
    OB-003 OTP Verification
    OB-004 Connect Services
    OB-005 Interests Selection
    OB-006 Onboarding Complete
  
  📁 Home
    HM-001 Home (Morning State)
    HM-002 Home (Afternoon State)
    HM-003 Home (Evening State)
    HM-004 Home (Empty State - New User)
    HM-005 Home (All Clear State)
    HM-006 Daily Brief Expanded
  
  📁 Chat
    CH-001 Chat Empty
    CH-002 Chat Active (showing all message types)
    CH-003 Voice Recording Mode
    CH-004 Image Attachment Flow
  
  📁 Email Intelligence
    EM-001 Email Feed (Action Tab)
    EM-002 Email Feed (Meetings Tab)
    EM-003 Bill Email Detail
    EM-004 Meeting Email Detail
    EM-005 Delivery Email Detail
    EM-006 Email Settings
  
  📁 Wealth
    WL-001 Wealth Dashboard Overview
    WL-002 Transactions List
    WL-003 Add Expense Sheet
    WL-004 Goal Detail
    WL-005 Investments Portfolio
    WL-006 Bills & EMIs
    WL-007 Subscription Audit
  
  📁 Health
    HL-001 Health Dashboard
    HL-002 Food Scanner Camera
    HL-003 Meal Detail / Nutrition
    HL-004 Medicine Tracker
    HL-005 Health Trends Week
    HL-006 Mood Log
  
  📁 Profile
    PR-001 Profile & Life Score
    PR-002 Viya Memory Browser
    PR-003 Relationships
    PR-004 AI Agents Dashboard
    PR-005 Settings
    PR-006 Connected Services
    PR-007 Notification Preferences
    PR-008 Premium Upgrade Flow
  
  📁 Admin Dashboard
    AD-001 Admin Overview
    AD-002 User Management Table
    AD-003 System Health
    AD-004 Feature Flags

📁 VIYA AI — PROTOTYPES
  Prototype 1: Full Onboarding Flow (linear, shareable link)
  Prototype 2: Home → Chat → Action Flow
  Prototype 3: Email Intelligence → Accept Meeting
  Prototype 4: Add Expense (3-second flow demo)
  Prototype 5: Goal Achievement Celebration

📁 VIYA AI — ANNOTATIONS
  Dev Handoff notes on every screen
  Interaction specifications
  Breakpoint documentation
  Animation specs (timing, easing values)
```

### 7.2 Asset Export Specifications

```
APP ICONS:
  iOS: 1024×1024 PNG (no transparency, App Store)
       20×20, 29×29, 38×38, 40×40, 60×60, 76×76, 83.5×83.5 @1x
       All sizes @2x and @3x
  
  Android: 48×48, 72×72, 96×96, 144×144, 192×192 (mipmap)
           Adaptive: Foreground 432×432, Background 432×432

SCREENSHOTS (App Store):
  iPhone 6.9" (1320×2868): 10 screens
  iPhone 6.5" (1242×2688): 10 screens  
  Android 6.5" (1080×1920): 8 screens

FEATURE GRAPHIC (Play Store):
  1024×500 PNG (required for Android)

ILLUSTRATIONS:
  Format: SVG (preferred) or 2x PNG with 3x fallback
  All illustrations: Self-contained SVG (no external fonts)

LOTTIE ANIMATIONS:
  Viya Orb: 3 states (idle/thinking/success)
  Achievement celebration: Confetti burst
  Onboarding envelope: 2-3 keyframe animation
  Loading: Custom spinner with brand feel
  Export: Lottie JSON via AE + LottieFiles

DESIGN TOKENS EXPORT:
  CSS variables: tokens.css
  React Native: tokens.ts
  JSON: design-tokens.json (for automated consumption)
```

---

## SECTION 8: TIMELINE AND ITERATIONS

### 8.1 Phased Design Delivery

```
PHASE 1: FOUNDATION (Week 1-2)
  Deliverable: Design System + Core Components
  
  ✅ Complete color system with all tokens
  ✅ Typography scale (all 14 levels)
  ✅ Spacing and layout grid
  ✅ Shadow and elevation system
  ✅ Dark mode complete mapping
  ✅ All atomic components (buttons, inputs, chips)
  ✅ Icon system documentation
  ✅ Motion design spec document
  
  Format: Figma library (published, shared with dev team)
  Handoff: Figma inspect enabled, tokens exported to JSON

PHASE 2: TIER 1 SCREENS (Week 2-3)
  Deliverable: All P1 screens (9 screens × 2 states minimum)
  
  ✅ Splash screen (1 state)
  ✅ Onboarding flow (5 screens × light mode)
  ✅ Home dashboard (3 states: morning/afternoon/empty)
  ✅ Viya chat (showing all message type variants)
  ✅ Email intelligence feed (4 card types)
  
  Format: Figma screens + clickable prototype
  Review: Design review with product + engineering

PHASE 3: TIER 2 SCREENS (Week 3-4)
  Deliverable: Finance + Health screens
  
  ✅ Wealth dashboard (all 5 tabs)
  ✅ Health dashboard + food scanner
  ✅ Medicine tracker
  ✅ Goal detail + celebration overlay
  ✅ Bills & subscriptions
  
  Format: Figma + prototype for wealth flow

PHASE 4: TIER 3 + DARK MODE (Week 4-5)
  Deliverable: Profile + Admin + Dark mode
  
  ✅ Profile and life score
  ✅ Memory browser
  ✅ AI agents dashboard
  ✅ Admin dashboard (web, not mobile)
  ✅ ALL screens in dark mode
  
  Format: Full Figma file, dark mode frames

PHASE 5: POLISH + ANIMATIONS (Week 5-6)
  Deliverable: Animation specs + final polish
  
  ✅ Lottie animations (4 files)
  ✅ Motion spec for all 12 defined animations
  ✅ Accessibility audit (contrast check all screens)
  ✅ Final QA of component consistency
  ✅ Developer handoff: All assets exported, tokens documented
  ✅ App Store screenshots prepared (10 per platform)
  
  Format: Final Figma file + Lottie JSON files + asset export

ITERATION POLICY:
  Round 1: Internal design review (design team)
  Round 2: Stakeholder review (product + founders)
  Round 3: Engineering feasibility check
  Round 4: User testing (5 users per major flow)
  Round 5: Final polish based on all feedback
  
  Each round: Max 2 weeks, written feedback consolidated
  Changes after Round 4: Only critical issues, no new features
```

---

## SECTION 9: REFERENCE APPS AND DESIGN SYSTEMS

### 9.1 Design References

```
APPS THAT INSPIRE US (And WHY — be specific):

LINEAR (linear.app):
  Why we love it: Speed, keyboard-first, information density without clutter
  What we take: Monochrome base + single color accent, fast transitions,
                confident typography, no decorative elements ever
  Don't copy: The minimal-to-the-point-of-cold aesthetic (Viya is warmer)

STRIPE DASHBOARD:
  Why we love it: Data density that never feels overwhelming, trust through
                  visual consistency, color used very intentionally
  What we take: The philosophy of "every element earns its place",
                excellent use of subtle gradients, reliable visual hierarchy
  Don't copy: Enterprise/developer focus (Viya is consumer)

LOOM:
  Why we love it: The recorder UI is ingenious — minimal, non-intrusive,
                  yet incredibly functional and polished
  What we take: How to handle media (audio/video) with elegance,
                contextual UI that shows only what's needed
  Don't copy: Desktop-first patterns (we're mobile-first)

DUOLINGO (Modern version):
  Why we love it: Gamification that feels genuinely motivating,
                  streak mechanics, celebration moments, habit formation
  What we take: How to celebrate wins (disproportionate celebration),
                how to make progress visible and exciting, streak design
  Don't copy: Childlike illustrations (Viya is more premium adult)

CRED (India):
  Why we love it: Premium feel for Indian consumers, proves India can have
                  luxury UI/UX, bold typography, dark aesthetic
  What we take: Confidence in premium design, bold number displays,
                how to make financial data feel aspirational
  Don't copy: Exclusivity signaling (Viya is inclusive), overly dark

NOTION:
  Why we love it: Information architecture at scale, handles complexity
                  without overwhelming, elegant empty states
  What we take: Empty state philosophy, hierarchy without visual noise
  Don't copy: Complexity without guidance (Viya is more opinionated)

ZEPTO (India):
  Why we love it: Speed as design language, India-first, vibrant colors
                  that work for Indian consumers
  What we take: Color confidence, speed obsession, Indian context
  Don't copy: Commerce-first patterns (we're assistant-first)

ROBINHOOD (Early design):
  Why we love it: Made finance feel approachable and exciting,
                  turned charts into emotional experiences
  What we take: Making financial data feel alive, chart aesthetics,
                how numbers can be heroes of the screen
  Don't copy: The controversial gamification of investing

DESIGN SYSTEMS WE REFERENCE:
  Apple Human Interface Guidelines: Touch targets, gesture patterns, iOS native
  Google Material Design 3: Android patterns, accessibility standards
  IBM Carbon Design System: Data visualization best practices
  Shopify Polaris: Product thinking behind component decisions
```

---

## SECTION 10: ACCESSIBILITY TARGETS

### 10.1 Complete Accessibility Specification

```
WCAG 2.1 AA COMPLIANCE (Non-negotiable):

CONTRAST RATIOS:
  Normal text (<18px or <14px bold): 4.5:1 minimum
  Large text (≥18px or ≥14px bold): 3:1 minimum
  Interactive components boundary: 3:1 minimum
  
  VERIFIED COMBINATIONS:
  ✅ neutral-900 (#0D1818) on white: 16.8:1 (PASS AAA)
  ✅ neutral-600 (#486060) on white: 5.2:1 (PASS AA)
  ✅ viya-700 (#008B6A) on white: 4.6:1 (PASS AA) — use for teal text
  ✅ white on gradient-hero: 5.1:1 average (PASS AA)
  ✅ cosmos-700 (#400099) on cosmos-50: 4.8:1 (PASS AA)
  ❌ viya-500 (#00E5B0) on white: 1.8:1 (FAIL) — NEVER for text
  ❌ gold-300 (#FFD700) on white: 1.9:1 (FAIL) — NEVER for text
  
  RULE: Any teal or gold text must use the -700 variant

TOUCH TARGET SIZES:
  Minimum: 44×44pt iOS / 48×48dp Android (strict rule)
  Standard buttons: 56px height (generous)
  Tab bar items: Full tab width × 56px (well above minimum)
  List items: 64px minimum height
  Spacing between targets: 8px minimum
  
  TEST THESE SPECIFICALLY:
  - OTP boxes: 52×62px ✅ (above minimum)
  - Quick action tiles: ~80×76px ✅
  - Delete icons in swipe: 44×44px ✅
  - Bottom sheet handle: extend tap zone above visual element

SCREEN READER SUPPORT:

  iOS VoiceOver compliance:
    accessibilityLabel: All icons, images, decorative elements
    accessibilityHint: All buttons with non-obvious actions
    accessibilityRole: button, link, image, text, heading (all correct)
    accessibilityValue: Progress bars ("42 percent"), charts ("₹12,400")
    accessibilityLiveRegion: Loading states, success messages
    Focus order: Logical left-to-right, top-to-bottom
    Custom actions: Swipe items have custom VoiceOver actions
  
  Android TalkBack compliance:
    contentDescription: All icons and images
    importantForAccessibility: Set on decorative elements to "no"
    accessibilityLiveRegion: Dynamic content updates
    
  Screen reader testing flow:
    Can a blind user: Sign up → Connect Gmail → Log expense → Check balance?
    This full flow must work without looking at screen.

MOTION SENSITIVITY:
  Check: AccessibilityInfo.isReduceMotionEnabled() (React Native)
  If true, disable:
    ✅ All entrance/exit animations (replace with instant)
    ✅ Confetti and particle effects (replace with static badge)
    ✅ Parallax on scroll
    ✅ Pulsing/breathing animations on orb
    ✅ FAB radial menu expansion
  
  If true, keep:
    ✅ Opacity fades (functional, low motion)
    ✅ Haptic feedback (non-visual)
    ✅ Color state changes (functional)
    ✅ Scroll physics (platform standard)

DYNAMIC TYPE AND FONT SCALING:
  iOS Dynamic Type: Support all sizes (xSmall → AX5)
  Android Font Scale: Support up to 1.3x multiplier
  
  At maximum scale, verify:
    No text truncation in buttons (increase button height)
    No text overlap with icons (use flexWrap or separate layout)
    All amounts remain readable (JBMono scales well)
    Navigation labels fit (abbreviate if needed)
    Bottom sheet handles larger content gracefully
  
  Test method: Use iOS Accessibility Inspector + Android with font scale 1.3x

COLOR INDEPENDENCE:
  RULE: Never use color as the ONLY indicator of meaning.
  Always pair color with: Icon + Text label + Position
  
  Examples that comply:
  🔴 Overdue: Coral color + 🔴 emoji + "Overdue" text + top of list
  ✅ Success: Emerald color + ✓ icon + "Done!" text
  ⚠️ Warning: Amber color + ⚠️ icon + "Due soon" text
  
  Examples that FAIL (fix these):
  ❌ Red amount alone for overspending (add "Over budget" label)
  ❌ Green sparkline alone for growth (add "↑ +3.8%" text)
  ❌ Orange dot alone for pending (add "Pending" label)

LANGUAGE AND READABILITY:
  Maximum line length: 72 characters (readability standard)
  Minimum body text: 14px (14sp Android, 14pt iOS)
  Line height: 1.5× minimum for body text
  Paragraph spacing: 8px between paragraphs minimum
  Reading level: Grade 6 target (simple, clear language)
  
FOCUS MANAGEMENT:
  Keyboard navigation (for connected keyboards):
    Tab moves focus logically
    Enter/Space activates buttons
    Escape dismisses modals
    Arrow keys for segmented controls, date pickers
  
  Modal focus:
    Opens: Focus moves to modal heading
    Closes: Focus returns to trigger element
  
  Skip links (for screen reader users):
    Home screen: Skip to main content
    Chat: Skip to input field

ARIA AND SEMANTIC STRUCTURE:
  Page landmarks: Header, main, navigation (correctly labeled)
  Headings: Logical h1 → h2 → h3 hierarchy
  Lists: Proper list elements for transaction lists, email feeds
  Forms: All inputs have associated labels (not just placeholder)
  Live regions: Balance updates, chat messages, notification count

TESTING REQUIREMENTS:
  Automated: Axe-core (catches 40% of issues automatically)
  Manual VoiceOver: Complete core flows monthly
  Manual TalkBack: Complete core flows monthly
  Contrast: Run all screens through color contrast checker
  User testing: Include 1 user with visual impairment per major release
```

---

## APPENDIX: DESIGN QA CHECKLIST

```
Before any screen is approved for development:

VISUAL QUALITY:
☐ All text passes AA contrast ratio (verified with tool)
☐ No content outside safe areas
☐ Dark mode version complete and reviewed
☐ Empty state designed (not just hidden)
☐ Error state designed (not just noted)
☐ Loading/skeleton state designed
☐ All touch targets minimum 44×44pt
☐ Consistent spacing (all values from token system)
☐ No pixel rounding inconsistencies (all values = whole numbers)

CONTENT:
☐ Indian number format throughout (₹1,50,000)
☐ No placeholder lorem ipsum in final screens
☐ All amounts in JetBrains Mono font
☐ Consistent capitalization (Title Case for headings, Sentence case for body)
☐ No copy over 72 characters per line
☐ No preachy, corporate, or passive copy

INTERACTIONS:
☐ Every tappable element has press state designed
☐ Every loading state has skeleton designed
☐ Every swipeable item has revealed state designed
☐ Motion specs annotated (timing, easing, spring values)
☐ Haptic feedback noted for each interaction

DEVELOPER HANDOFF:
☐ All colors match design tokens exactly
☐ All spacing matches token values
☐ All font sizes and weights specified
☐ All shadows specified (exact values, not "subtle shadow")
☐ All component states documented
☐ Lottie files linked or specified
☐ Icon names from Phosphor library listed
☐ Platform-specific variations noted (iOS vs Android)
☐ Accessibility annotations added

FINAL SIGN-OFF:
☐ Product designer approval
☐ Product manager approval  
☐ Engineering lead feasibility check
☐ Accessibility checked (contrast + touch targets minimum)
☐ Founder/CEO sign-off on brand-critical screens (splash, onboarding, home)

THIS IS A $10M APP.
EVERY PIXEL MUST JUSTIFY ITS EXISTENCE.
🎨🚀
```
