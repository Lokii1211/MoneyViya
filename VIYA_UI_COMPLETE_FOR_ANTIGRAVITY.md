# VIYA AI — COMPLETE UI DESIGN BLUEPRINT
## For Google Antigravity / Claude Opus 4.6: Build Every Pixel Exactly As Specified

---

> **CONTEXT FOR ANTIGRAVITY:**
> You are building Viya AI — the world's first true Virtual Personal AI Assistant for India.
> Not a chatbot. Not a finance app. A second brain that lives in the user's phone.
> This document specifies EVERY screen, EVERY component, EVERY animation.
> Build exactly this. No improvisation. No shortcuts.
> Target: 10 million daily active users within 12 months.

---

## SECTION 1: DESIGN SYSTEM FOUNDATION

### 1.1 THE EMOTIONAL DESIGN LANGUAGE

Viya must FEEL like a trusted friend who is brilliant, warm, fast, and always available.
Every design decision must ask: "Does this feel like a friend or a software product?"

Friend = Warm colors, round corners, natural language, celebrates you
Software = Cold blues, sharp corners, technical language, reports at you

**Viya is always the friend.**

---

### 1.2 COLOR SYSTEM — COMPLETE SPECIFICATION

```
PRIMARY PALETTE:

Viya Teal (Trust, Intelligence, Calm):
--viya-primary-900: #003D40
--viya-primary-800: #005F63
--viya-primary-700: #007A7E
--viya-primary-600: #009499
--viya-primary-500: #00B0B6   ← MAIN BRAND COLOR
--viya-primary-400: #00CDD4
--viya-primary-300: #4DDDEA
--viya-primary-200: #99ECF2
--viya-primary-100: #CCF5F8
--viya-primary-50:  #E8FBFC

Viya Violet (Premium, AI, Intelligence):
--viya-violet-900: #1A0633
--viya-violet-800: #2D0D59
--viya-violet-700: #3F1480
--viya-violet-600: #521BA6
--viya-violet-500: #6422CC   ← SECONDARY BRAND
--viya-violet-400: #834DE0
--viya-violet-300: #A278EA
--viya-violet-200: #C1A3F2
--viya-violet-100: #E0D1F9
--viya-violet-50:  #F5F0FD

Viya Gold (Achievement, Energy, Celebration):
--viya-gold-500: #FFB800
--viya-gold-400: #FFC933
--viya-gold-300: #FFD966
--viya-gold-200: #FFE999
--viya-gold-100: #FFF4CC

SUCCESS STATES:
--viya-success: #00D084
--viya-success-light: #E6FBF4

WARNING STATES:
--viya-warning: #FF9500
--viya-warning-light: #FFF4E6

ERROR STATES:
--viya-error: #FF3B30
--viya-error-light: #FFEBE9

NEUTRAL (Background, Text, Borders):
--viya-neutral-900: #0D0D0D   ← Primary text
--viya-neutral-800: #1A1A1A
--viya-neutral-700: #333333
--viya-neutral-600: #4D4D4D
--viya-neutral-500: #666666   ← Secondary text
--viya-neutral-400: #808080
--viya-neutral-300: #B3B3B3   ← Placeholder text
--viya-neutral-200: #CCCCCC   ← Border color
--viya-neutral-100: #E6E6E6
--viya-neutral-50:  #F5F5F5   ← Card background
--viya-neutral-0:   #FFFFFF

SEMANTIC GRADIENTS (Use exactly these):
--gradient-primary: linear-gradient(135deg, #00B0B6 0%, #6422CC 100%)
--gradient-gold: linear-gradient(135deg, #FFB800 0%, #FF6B35 100%)
--gradient-success: linear-gradient(135deg, #00D084 0%, #00B0B6 100%)
--gradient-night: linear-gradient(180deg, #0D0D2B 0%, #1A0633 100%)
--gradient-morning: linear-gradient(135deg, #FFB800 0%, #FF9500 30%, #00B0B6 100%)
--gradient-card: linear-gradient(145deg, #FFFFFF 0%, #F0FAFA 100%)

DARK MODE (Auto-detect, also manual toggle):
--dark-bg: #0D0D0D
--dark-surface: #1A1A1A
--dark-card: #242424
--dark-border: #333333
--dark-text-primary: #F5F5F5
--dark-text-secondary: #B3B3B3
```

---

### 1.3 TYPOGRAPHY — COMPLETE SPECIFICATION

```
FONT LOADING ORDER (Performance critical):
1. System fonts first (fallback)
2. Load Inter variable font async
3. Load Sora async (display only)
4. SF Mono → JetBrains Mono (numbers)

NEVER use custom fonts for body text under 16px.
System fonts are faster and more readable.

SCALE:

Display XL (Hero moments):
  Font: Sora, 700
  Size: 40px / Line: 48px / Letter: -1px
  Use: App name, big achievements, splash

Display L (Screen titles):
  Font: Sora, 700
  Size: 32px / Line: 40px / Letter: -0.5px
  Use: Main screen headers

Display M (Section heroes):
  Font: Sora, 600
  Size: 24px / Line: 32px / Letter: -0.3px
  Use: Card titles, section headers

Title L:
  Font: Inter, 600
  Size: 20px / Line: 28px
  Use: Card headings, important labels

Title M:
  Font: Inter, 600
  Size: 18px / Line: 26px
  Use: List items, button text, tab labels

Body L:
  Font: Inter, 400
  Size: 18px / Line: 28px
  Use: Main chat messages, important descriptions

Body M:
  Font: Inter, 400
  Size: 16px / Line: 24px
  Use: Standard body text

Body S:
  Font: Inter, 400
  Size: 14px / Line: 20px
  Use: Secondary information, hints

Caption:
  Font: Inter, 500
  Size: 12px / Line: 16px / Letter: 0.5px
  Text-transform: UPPERCASE
  Use: Labels, timestamps, metadata

Number XL (Financial hero):
  Font: JetBrains Mono, 600
  Size: 56px / Line: 64px
  Color: Semantic (context-based)
  Use: Main balance, key metrics

Number L:
  Font: JetBrains Mono, 600
  Size: 36px / Line: 44px
  Use: Goal amounts, spending totals

Number M:
  Font: JetBrains Mono, 500
  Size: 24px / Line: 32px
  Use: Transaction amounts, stats

Number S:
  Font: JetBrains Mono, 400
  Size: 16px / Line: 24px
  Use: Inline amounts, small stats

INDIAN NUMBER FORMATTING (MANDATORY):
₹1,50,000 NOT ₹150,000
₹1,50,00,000 NOT ₹15000000
Always show ₹ symbol before number
Negative: -₹1,200 (red color)
Positive: +₹1,200 (green color)
```

---

### 1.4 SPACING & LAYOUT

```
BASE UNIT: 4px (all spacing is multiples of 4)

SPACING SCALE:
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px

SCREEN MARGINS:
Mobile (< 430px): 20px horizontal
Large mobile (430px+): 24px horizontal
Safe area: Always respect iOS/Android safe areas

BORDER RADIUS:
--radius-sm:  8px  (small chips, badges)
--radius-md:  12px (inputs, small cards)
--radius-lg:  16px (standard cards)
--radius-xl:  20px (large cards, modals)
--radius-2xl: 24px (hero cards, sheets)
--radius-full: 9999px (pills, avatars, FABs)

ELEVATION (Shadows):
--shadow-1: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-2: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)
--shadow-3: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)
--shadow-4: 0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)
--shadow-5: 0 25px 50px rgba(0,0,0,0.15)
--shadow-teal: 0 8px 24px rgba(0,176,182,0.30)
--shadow-violet: 0 8px 24px rgba(100,34,204,0.25)
--shadow-gold: 0 8px 24px rgba(255,184,0,0.30)
```

---

## SECTION 2: SCREEN SPECIFICATIONS — COMPLETE

### 2.1 SPLASH SCREEN

```
DURATION: 1.5 seconds max (no longer)

BACKGROUND: gradient-night (#0D0D2B → #1A0633)

CENTER CONTENT:
  Viya Logo:
    - Circle: 96px diameter
    - Background: gradient-primary
    - Icon: Abstract "V" with neural network lines
    - Shadow: shadow-teal
    
  Animation Sequence:
    0ms:    Logo at scale(0.3), opacity(0)
    400ms:  Logo at scale(1.15), opacity(1) — fast pop in
    600ms:  Logo settles at scale(1.0) — subtle bounce
    800ms:  "VIYA" text fades in below logo
    1000ms: Tagline fades in: "Your AI Second Brain"
    1200ms: Loading bar fills (gradient-primary, 2px height, full width)
    1500ms: Fade out entire screen → Home screen

LOADING BAR:
  Position: Bottom of screen, 32px from bottom
  Width: 120px, centered
  Height: 3px
  Border-radius: full
  Background: rgba(255,255,255,0.2)
  Fill: gradient-primary
  Animation: fill from 0% to 100% in 1.2s ease-out
```

---

### 2.2 ONBOARDING FLOW (5 screens, 90 seconds max)

#### ONBOARDING SCREEN 1: Language Selection

```
BACKGROUND: White
STATUS BAR: Light content

TOP:
  Viya logo (small, 48px) — top-center, 60px from top
  
HERO ILLUSTRATION (40% of screen height):
  Illustration shows India map with chat bubbles in different languages
  Colorful, optimistic, hand-drawn style
  Languages shown: Hindi, Tamil, Telugu, Kannada, English

HEADLINE: "Viya speaks your language"
  Style: Display M, neutral-900, centered

SUBHEADLINE: "Choose the language you're most comfortable in"
  Style: Body M, neutral-500, centered

LANGUAGE OPTIONS (Grid, 2 columns):
  Each option: Card style, 72px height
  ┌─────────────┐ ┌─────────────┐
  │ 🇮🇳 English  │ │ 🇮🇳 हिंदी     │
  └─────────────┘ └─────────────┘
  ┌─────────────┐ ┌─────────────┐
  │ தமிழ்        │ │ తెలుగు      │
  └─────────────┘ └─────────────┘
  ┌─────────────┐ ┌─────────────┐
  │ ಕನ್ನಡ       │ │ मराठी        │
  └─────────────┘ └─────────────┘
  
  Selected state: Border 2px viya-primary-500, bg viya-primary-50
  Unselected: Border 1px neutral-200, bg white

BOTTOM:
  "Continue" button (full width, disabled until selection)
  When selected: Button activates with gradient-primary
```

#### ONBOARDING SCREEN 2: Phone Number

```
PROGRESS: Dot indicator (2 of 5 active)

TOP: "What's your number?" — Display M, centered

SUBTEXT: "We'll keep you signed in and sync across devices"
  Body M, neutral-500

PHONE INPUT:
  Height: 64px
  Border-radius: radius-md
  ┌──────────┬─────────────────────────────┐
  │ +91 🇮🇳 ▾ │       98765 43210           │
  └──────────┴─────────────────────────────┘
  
  Left: Country code (tappable, opens country picker)
  Right: Number input, JetBrains Mono Medium, 20px
  Auto-formats with space every 5 digits
  Numeric keyboard auto-opens

TRUST LINE: "🔒 Your number is encrypted and never shared"
  Caption, neutral-400, centered, below input

CONTINUE BUTTON: Full width, disabled until 10 digits
  Activates: gradient-primary, shadow-teal
```

#### ONBOARDING SCREEN 3: OTP Verification

```
HERO: Animated envelope → opens → ✓ inside
  48px, viya-primary-500 color

HEADLINE: "Enter the code"
  Display M

SUBHEADLINE: "Sent to +91 98765 43210"
  Body M, neutral-500

OTP INPUT (6 boxes):
  ┌────┐ ┌────┐ ┌────┐  ┌────┐ ┌────┐ ┌────┐
  │  5 │ │  2 │ │  7 │  │  _ │ │  _ │ │  _ │
  └────┘ └────┘ └────┘  └────┘ └────┘ └────┘
  
  Each box: 52px × 60px, radius-md
  Font: JetBrains Mono Bold, 28px
  Space gap between 3rd and 4th box (visual grouping)
  Auto-advance on digit entry
  Auto-submit when 6th digit entered
  
  States:
    Empty: Border neutral-200
    Active: Border viya-primary-500, shadow: 0 0 0 3px viya-primary-100
    Filled: Border viya-primary-300, bg viya-primary-50
    Error: Border viya-error, shake animation
    
RESEND: "Didn't receive? Resend in 0:45"
  After timer: "Resend Code" becomes tappable, viya-primary-500

AUTO-VERIFY: When OTP correct, boxes turn green, checkmark draws, navigate
```

#### ONBOARDING SCREEN 4: Tell Viya About You

```
HEADLINE: "What should Viya help you with?"
  Display M

SUBHEADLINE: "Select all that apply — Viya becomes your personal assistant for these"
  Body M, neutral-500

INTEREST CARDS (Scrollable, 2-column grid):
  Each card: 100px height, radius-lg, border 1.5px
  
  COLUMN 1:
  ┌─────────────────────┐
  │ 💰  Money & Finance  │
  │ Track expenses,     │
  │ save & invest       │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 🏥  Health & Body   │
  │ Fitness, medicines, │
  │ doctor reminders    │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 🎯  Goals & Habits  │
  │ Build routines,     │
  │ track progress      │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 📚  Learning        │
  │ Courses, reading,   │
  │ skill building      │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 👨‍👩‍👧  Family          │
  │ Birthdays, tasks,   │
  │ coordination        │
  └─────────────────────┘

  COLUMN 2:
  ┌─────────────────────┐
  │ 💼  Career & Work   │
  │ Tasks, meetings,    │
  │ professional growth │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 🛒  Shopping        │
  │ Lists, deals,       │
  │ price tracking      │
  └─────────────────────┘
  ┌─────────────────────┐
  │ ✈️  Travel          │
  │ Trip planning,      │
  │ bookings, itinerary │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 🧠  Mental Health   │
  │ Mood tracking,      │
  │ stress, mindfulness │
  └─────────────────────┘
  ┌─────────────────────┐
  │ 📄  Documents       │
  │ Passwords, IDs,     │
  │ important files     │
  └─────────────────────┘

  Selected state:
    Background: viya-primary-50
    Border: 2px viya-primary-500
    Icon: Scales to 1.2x with bounce
    Title: viya-primary-700
    
CONTINUE: "Start with Viya →"
  Full width, gradient-primary
  Shows count: "Continue with 3 areas" when 3 selected
```

#### ONBOARDING SCREEN 5: First Interaction

```
HEADLINE: "Say hi to Viya! 👋"
  Display M

SUBTEXT: "Ask anything to see how Viya helps you"

CHAT PREVIEW (Shows Viya introducing itself):
  
  [VIYA BUBBLE]:
  "Hi! I'm Viya, your AI assistant. 🙏
  
  I'll be your second brain — I'll remember 
  what matters, remind you before you forget, 
  and help you with everything from managing 
  money to booking trips.
  
  What's on your mind today?"
  
  [3 QUICK START BUTTONS]:
  ┌──────────────────────────────────┐
  │ 💰 "Help me track my expenses"   │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │ 🔔 "Set a reminder for me"       │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │ 🎯 "Help me reach a goal"        │
  └──────────────────────────────────┘

INPUT BAR (at bottom):
  Typing area + voice button + send button
  
When user taps any quick start → opens full chat
```

---

### 2.3 HOME SCREEN (The Nerve Center)

```
LAYOUT: Scroll view with sticky header

HEADER (Sticky, 64px):
  LEFT: 
    Viya avatar (40px circle, gradient-primary, "V" letter)
    "Good morning, Rahul" — Title M, neutral-900
    
  RIGHT:
    Notification bell (with badge if unread)
    Search icon
    
  BACKGROUND: White with blur when scrolled (backdrop-filter: blur(20px))

SECTION 1: VIYA'S MORNING BRIEFING CARD
  Style: gradient-night background (dark card)
  Border-radius: radius-2xl
  Padding: 24px
  
  TOP:
    "☀️ Morning Briefing" — Caption, white, 60% opacity
    Time: "6:45 AM" — Caption, white, 60% opacity
    
  HEADLINE (Large, white):
    "You have 3 things to handle today"
    Style: Display L, white
    
  ITEMS LIST:
    Each item: Dot + text, white, 80% opacity
    • "₹3,200 rent due tomorrow"
    • "Mom's birthday in 2 days" 
    • "Gym streak: Don't break it today! 🔥"
    
  ACTION:
    "Tell me more →" link, viya-primary-300

  ANIMATION: 
    Card slides in from top on screen load
    Each list item appears with 100ms stagger
    Gentle pulse on notification items

SECTION 2: QUICK ACTION GRID
  Title: "What do you need?" — Title L, neutral-900
  
  GRID (2 columns, 4 rows):
  ┌─────────────────┐ ┌─────────────────┐
  │ 🎙️              │ │ ➕              │
  │ Talk to Viya    │ │ Add Expense     │
  │                 │ │                 │
  │ [gradient-bg]   │ │ [gradient-bg]   │
  └─────────────────┘ └─────────────────┘
  ┌─────────────────┐ ┌─────────────────┐
  │ 🔔              │ │ 💰              │
  │ Set Reminder    │ │ Check Balance   │
  └─────────────────┘ └─────────────────┘
  ┌─────────────────┐ ┌─────────────────┐
  │ ✅              │ │ 📊              │
  │ Add Task        │ │ Weekly Report   │
  └─────────────────┘ └─────────────────┘
  ┌─────────────────┐ ┌─────────────────┐
  │ 🏥              │ │ 🎯              │
  │ Health Log      │ │ Goal Progress   │
  └─────────────────┘ └─────────────────┘
  
  Each card: 
    - 80px height
    - White background, shadow-2
    - radius-xl
    - 24px icon (emoji or icon)
    - Title M label below
    - Press: scale(0.96), haptic light
    - Most used card gets gradient-primary background

SECTION 3: ACTIVE ALERTS (Conditional — only shows if alerts exist)
  Title: "⚠️ Needs Attention" — Title L, viya-error
  
  ALERT CARDS (Horizontal scroll):
    Card style: White, border 1.5px viya-error-light, radius-lg
    Width: 260px (horizontal scroll)
    
    Example card:
    ┌─────────────────────────────┐
    │ 🔴 Credit card due tomorrow │
    │ ₹8,500 by 11:59 PM         │
    │ [Pay Now] [Remind Me]       │
    └─────────────────────────────┘

SECTION 4: TODAY'S OVERVIEW
  Two cards side by side:
  
  LEFT CARD (Money Today):
    Background: gradient-success
    "₹857 left today" — Number M, white
    "₹620 spent of ₹1,477" — Body S, white 80%
    Mini progress bar (white, 40% opacity track)
    
  RIGHT CARD (Tasks Today):
    Background: viya-violet-500
    "4 tasks left" — Number M, white
    "Completed 2 of 6" — Body S, white 80%
    Mini circular progress (white)

SECTION 5: ACTIVE GOALS (Horizontal scroll)
  Title: "Your Goals" — Title L, neutral-900
  
  GOAL CARD (Each):
    Width: 220px (horizontal scroll)
    Background: gradient-card
    Border: 1px neutral-100
    Border-radius: radius-xl
    Padding: 16px
    
    ICON: Large emoji or image (48px)
    TITLE: "Bullet Bike" — Title M, neutral-900
    AMOUNT: "₹33,600 / ₹80,000" — Number S
    PROGRESS BAR: gradient-primary fill
    MILESTONE: "Next: ₹40K in 9 days 🎯" — Body S, viya-primary-500
    
    Press: Opens goal detail screen

SECTION 6: RECENT ACTIVITY (Last 5 items)
  Title: "Recent Activity" — Title L, neutral-900
  
  ACTIVITY ITEM:
    LEFT: Category icon in colored circle (48px)
    MIDDLE: 
      Title (merchant/activity name) — Title M
      Time/date — Body S, neutral-400
    RIGHT: Amount — Number S
      Expense: -₹450 (viya-error)
      Income: +₹15,000 (viya-success)
    
    Swipe left → Edit | Delete
    Press → Opens detail

FLOATING ACTION BUTTON (FAB):
  Position: Bottom-right, 20px from edges
  Size: 60px circle
  Background: gradient-primary
  Icon: Microphone (Viya primary action)
  Shadow: shadow-teal
  
  PRESS BEHAVIOR:
    Short press → Voice input (most common action)
    Long press → Reveals radial menu:
      [💰 Add Expense]
      [✅ Add Task]  
      [🔔 Reminder]
      [📝 Quick Note]
    
  ANIMATION:
    Idle: Gentle breathe (scale 1 → 1.03 → 1, 3s loop)
    Hover: Scale 1.1
    Press: Scale 0.92
    After action: Pulse ring animation

BOTTOM NAVIGATION:
  5 tabs:
  [🏠 Home] [💬 Chat] [📊 Finance] [✅ Tasks] [👤 Me]
  
  Active tab: viya-primary-500 icon + label
  Inactive: neutral-400 icon + label
  Height: 80px (includes safe area)
  Background: White with top border 1px neutral-100
```

---

### 2.4 VIYA CHAT SCREEN (The Core Experience)

```
This is where users spend 70% of their time.
It MUST feel like texting a brilliant friend, not using a software product.

HEADER:
  LEFT: Back arrow (if sub-chat) or Viya logo
  CENTER: 
    "Viya" — Title L
    "● Online" — Caption, viya-success (subtle pulse on dot)
  RIGHT: 
    [📞 Voice Call]
    [⋮ More options]

CHAT AREA:
  Background: neutral-50 (very light gray, not white)
  
  VIYA MESSAGES (Left aligned):
    Container: White, radius-xl (20px), radius-tl: 4px
    Padding: 16px
    Max-width: 80% of screen
    Shadow: shadow-1
    
    Text: Body M, neutral-900
    Links: viya-primary-500, underline
    Timestamp: Caption, neutral-300, below bubble
    
    SPECIAL MESSAGE TYPES:
    
    A) ACTION CARD (When Viya does something):
    ┌──────────────────────────────────┐
    │ ✅ Done! Expense logged          │
    │ ─────────────────────────────    │
    │ 🍔 Swiggy • ₹450 • Food        │
    │ Budget left today: ₹407         │
    │ [View] [Edit] [Undo]            │
    └──────────────────────────────────┘
    Background: viya-success-light
    Border-left: 4px viya-success
    
    B) SUGGESTION CARD:
    ┌──────────────────────────────────┐
    │ 💡 Viya noticed something        │
    │ ─────────────────────────────    │
    │ You've spent ₹8,400 on Swiggy   │
    │ this month. That's ₹3,000 more  │
    │ than last month.                │
    │                                  │
    │ [Tell me more] [Ignore]         │
    └──────────────────────────────────┘
    Background: viya-primary-50
    Border-left: 4px viya-primary-500
    
    C) REMINDER CONFIRMATION:
    ┌──────────────────────────────────┐
    │ 🔔 Reminder set!                 │
    │ ─────────────────────────────    │
    │ "Pay rent" — Tomorrow 9:00 AM   │
    │ Repeat: Monthly on 1st          │
    │ [Edit] [Delete]                 │
    └──────────────────────────────────┘
    Background: viya-gold-100
    Border-left: 4px viya-gold-500
    
    D) RICH DATA CARD (Finance report, etc.):
    ┌──────────────────────────────────┐
    │ 📊 This week's spending          │
    │ ─────────────────────────────    │
    │ Total: ₹6,240                   │
    │                                  │
    │ 🍔 Food:      ₹2,800  ████░░   │
    │ 🚗 Transport: ₹1,200  ██░░░░   │
    │ 🛍️ Shopping:  ₹1,440  ███░░░  │
    │ 💊 Health:    ₹800    ██░░░░   │
    │                                  │
    │ vs last week: +₹840 (15% more)  │
    │ [Full Report] [Share]           │
    └──────────────────────────────────┘
    White background, shadow-2
    
    E) GOAL PROGRESS CARD:
    ┌──────────────────────────────────┐
    │ 🏍️ Bike Goal Update              │
    │ ─────────────────────────────    │
    │ ₹33,600 of ₹80,000 (42%)        │
    │ ████████░░░░░░░░░░░░            │
    │ At this rate: Done in 5 months! │
    │ Next milestone: ₹40K            │
    │ [View Details] [Boost Savings]  │
    └──────────────────────────────────┘
    Background: gradient-card
    
    F) MULTISELECT OPTIONS (For decisions):
    Viya: "Which account should I track for Swiggy?"
    
    ┌──────────────────────────────────┐
    │ ○ HDFC Debit Card ....1234       │
    │ ○ ICICI Credit Card ....5678     │
    │ ○ UPI / GPay                    │
    │ ○ Cash                          │
    │ ──────────────────────────────   │
    │ [Confirm Selection]              │
    └──────────────────────────────────┘

  USER MESSAGES (Right aligned):
    Background: gradient-primary
    Text: White, Body M
    Border-radius: radius-xl, br-tr: 4px
    Max-width: 75% of screen
    
    VOICE MESSAGE (Special):
    Background: gradient-primary
    Shows: Waveform visualization
    Duration: "0:07"
    Play button: White circle

TYPING INDICATOR (When Viya is thinking):
  3 dots animation (bounce sequence)
  "Viya is thinking..." — Caption, neutral-400
  Show after 500ms of processing (not immediately)

QUICK REPLIES (Contextual, above input):
  Horizontal scroll of chips
  Examples after expense logged:
  [Add another] [View this month] [Set budget] [Find savings]
  
  Chip style: White, border 1px neutral-200, radius-full
  Press: gradient-primary background, white text

INPUT BAR (Always visible, sticky bottom):
  Height: 56px (expands for long text)
  Background: White, top border 1px neutral-100
  Border-radius: radius-full (pill shape)
  Margin: 12px horizontal
  
  ELEMENTS (left to right):
  
  [📎 Attach] — Icon button, neutral-400
    → Opens picker: Camera | Gallery | Document | Location
    
  [Text input area]
    Placeholder: "Ask Viya anything..."
    Font: Body M, neutral-900
    Expand: Up to 4 lines, then scroll
    
  [🎙️ Voice] — Shows when text is empty
    Long press → Voice recording mode
    - Waveform animation appears
    - Timer: "Recording... 0:03"
    - Release → Sends voice message
    - Swipe left → Cancel
    
  [➤ Send] — Shows when text is entered
    Icon: Send arrow
    Color: viya-primary-500
    Press: scale(0.9) → message sends
    
VOICE RECORDING MODE (Fullscreen overlay):
  Background: gradient-night (dark)
  CENTER:
    Large microphone icon (80px, pulsing)
    Waveform visualization (real-time)
    Timer: "0:05 • Listening..."
  BOTTOM:
    Swipe up → Cancel
    Release → Send
    Tap camera → Switch to video
```

---

### 2.5 FINANCE DASHBOARD SCREEN

```
HEADER:
  "💰 Finance" — Display M
  Date range picker: "June 2024" with ← →

HERO CARD (Net Worth / Balance):
  Background: gradient-primary
  Border-radius: radius-2xl
  Padding: 28px
  
  TOP ROW:
    "Total Balance" — Caption, white 70%
    "Last updated 2 min ago" — Caption, white 50%
    
  MAIN NUMBER:
    "₹2,34,567" — Number XL, white
    "+₹8,200 this month" — Body M, viya-gold-300
    
  ACCOUNTS ROW (Horizontal scroll):
    Each account chip:
    [🏦 HDFC Savings: ₹1,45,230]
    [💳 ICICI Credit: -₹12,400]
    [💰 Cash: ₹5,000]
    [📈 SIP: ₹84,337]

SPENDING OVERVIEW CARD:
  Background: White, shadow-3
  
  TOP: 
    "This Month" — Title M
    "Budget: ₹25,000" — Body S, neutral-500
    
  CIRCULAR CHART (Center):
    Outer ring: Category breakdown
    Center: "₹14,320 spent"
    Below: "₹10,680 left"
    
  LEGEND (Below chart):
    Each category with color dot, name, amount
    Tap any → Shows transactions for that category

GOALS SECTION:
  Title: "Your Goals" — Title L
  
  Each goal card (full-width):
    ┌─────────────────────────────────────┐
    │ 🏍️ Bullet Bike     On Track ✅      │
    │                                      │
    │ ████████████░░░░░░░░  42%           │
    │ ₹33,600 of ₹80,000                  │
    │ Monthly saving: ₹5,600              │
    │ ETA: December 2024                  │
    │                                      │
    │ [Add Money] [View History] [Edit]   │
    └─────────────────────────────────────┘

QUICK ADD EXPENSE:
  FAB behavior (same as home)
  Also: Tap + icon in header → Quick expense modal
```

---

### 2.6 TASKS & REMINDERS SCREEN

```
HEADER:
  "✅ Tasks & Reminders" — Display M
  [+ New Task] button

TODAY'S TASKS:
  Title: "Today" — Title L
  
  TASK ITEM:
    ┌─────────────────────────────────────┐
    │ ○  Pay electricity bill             │
    │    Due: Today 6:00 PM • Finance    │
    │    [Snooze] [Mark Done]            │
    └─────────────────────────────────────┘
    
    Complete: Tap circle → Checkmark fills → Strike-through text
    Overdue: Red left border, red timestamp
    
UPCOMING REMINDERS:
  Title: "Upcoming" — Title L
  
  GROUP BY DATE:
    "Tomorrow"
    "Jun 15"
    "Jun 20"
    
  Each reminder:
    Left: Date pill (viya-primary-50, viya-primary-500 text)
    Content: Title + time + category icon
    Right: Delete button (on swipe)

HABIT TRACKER:
  Title: "Daily Habits" — Title L
  
  HABIT ROW:
    ┌─────────────────────────────────────┐
    │ 🏃 Morning Run          🔥 7 days  │
    │ ████████░░░░░░░ Week: 5/7          │
    │ [Done Today ✓]                     │
    └─────────────────────────────────────┘
    
  CHECK-IN: Tap "Done Today" → Circle fills with animation → Streak updates
  
ADD TASK BOTTOM SHEET:
  Title: "New Task"
  
  FIELDS:
    - Task name (required)
    - Due date + time picker
    - Repeat (Never, Daily, Weekly, Custom)
    - Category (Finance, Health, Work, Personal, Family)
    - Priority (🔴 High | 🟡 Medium | 🟢 Low)
    - Notes (optional)
    - Link to goal (optional)
    
  SMART SUGGESTIONS:
    Viya shows: "You often forget: Gym, Medicine. Add these?"
```

---

### 2.7 AI AGENTS SCREEN

```
This is a new concept — users can see and manage their AI agents.

HEADER:
  "🤖 Your AI Agents" — Display M
  "Agents working for you 24/7"

ACTIVE AGENTS (Cards):

Each agent card:
  Background: White, shadow-2, radius-xl
  Padding: 20px
  
  ┌─────────────────────────────────────┐
  │ 💰 Finance Agent          Active ● │
  │ Tracks ₹45,230 across 3 accounts  │
  │ Last action: Logged ₹450 expense  │
  │ "2 mins ago"                        │
  │ [Manage] [View Activity]           │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ 🔔 Reminder Agent         Active ● │
  │ 12 reminders set this week         │
  │ Next: "Rent" tomorrow 9 AM         │
  │ [Manage] [Add Reminder]            │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ 🏥 Health Agent           Active ● │
  │ Tracking: Steps, Sleep, Medicine   │
  │ Steps today: 4,200 / 8,000        │
  │ [Manage] [Log Health Data]         │
  └─────────────────────────────────────┘
  
  [Continue for all 12 agents...]

AGENT ACTIVITY LOG:
  Title: "What Viya did today" — Title L
  
  Timeline view:
  9:45 AM  🔔 Sent reminder: "Take medicine"
  10:12 AM 💰 Auto-tracked: ₹450 Swiggy order
  11:00 AM 🎯 Goal update: Bike goal 42% funded
  2:30 PM  📊 Weekly report generated
  5:00 PM  🏥 Step goal reminder sent
  
INACTIVE AGENTS (Greyed out):
  Show agents user can unlock (some locked behind premium)
  
  ┌─────────────────────────────────────┐
  │ ✈️ Travel Agent        [Unlock 👑] │
  │ Plan trips, track bookings,        │
  │ visa reminders, packing lists      │
  └─────────────────────────────────────┘
```

---

### 2.8 PROFILE / SETTINGS SCREEN

```
PROFILE HEADER:
  Avatar: Large circle (80px), gradient-primary, user initial
  Name: Display L, neutral-900
  "Premium Member" badge (if premium): gradient-gold, small
  Phone: Body M, neutral-500
  
  Edit button: Top-right

HEALTH SCORE CARD:
  "Viya Life Score" — Title M
  Score: "73 / 100" — Number L, gradient-primary (text gradient)
  
  BREAKDOWN:
    💰 Financial Health: 68/100
    🏥 Health & Fitness: 82/100
    🎯 Goals Progress: 71/100
    🧠 Mental Wellbeing: 70/100
    
  "Improve your score →" — viya-primary-500 link

CONNECTED ACCOUNTS:
  HDFC Bank ✅ Connected
  ICICI Credit Card ✅ Connected
  Google Fit ✅ Connected
  [+ Connect More Accounts]

SETTINGS SECTIONS:
  Notifications
  Privacy & Security
  Appearance (Light/Dark/Auto)
  Language
  Premium Account
  Help & Support
  About Viya
```

---

## SECTION 3: ANIMATION SYSTEM

### Every Interaction Must Feel ALIVE

```
ENTRANCE ANIMATIONS (Screen transitions):
  Default: Slide up 20px + fade in, 250ms ease-out
  Modal: Slide up from bottom, 350ms spring
  Alert: Scale from center, 200ms spring

EXIT ANIMATIONS:
  Default: Fade out, 150ms ease-in
  Modal dismiss: Slide down + fade, 300ms

COMPONENT ANIMATIONS:

1. BUTTON PRESS:
   Down: scale(0.96), 80ms ease
   Release: scale(1.02), 120ms spring → scale(1), 80ms

2. CARD PRESS:
   Down: scale(0.98), translateY(1px), 80ms
   Shadow: Reduces on press
   
3. SUCCESS FEEDBACK:
   Checkmark draws: 400ms path animation
   Circle draws: 300ms, starts 100ms after checkmark
   Background pulse: Green glow, 600ms
   Haptic: iOS success / Android medium vibrate

4. NUMBER UPDATE:
   Old number fades out: 200ms
   Count animation: 800ms ease-out (spring to target)
   Color flash: If positive: green flash; negative: red flash
   
5. STREAK FIRE:
   New streak: Fire icon bounces (scale 1 → 1.4 → 1, 400ms)
   New milestone: Confetti burst from icon
   
6. CHAT MESSAGE SEND:
   Message: Appears at bottom, slides up 12px, 200ms spring
   Send button: Morphs to loading dots while waiting
   Response: Types in character by character (streaming)
   
7. VOICE RECORDING:
   Mic button: Expands to full screen overlay, 300ms
   Waveform: Draws in real-time from audio input
   Release: Waveform collapses, message appears in chat
   
8. LOADING STATES:
   Skeleton screens: Shimmer animation, 1.5s loop
   Never show blank screens
   Never show spinners alone (show skeleton + spinner)
   
9. ACHIEVEMENT UNLOCK:
   Full-screen celebration: 
     - Confetti burst (50 particles, brand colors)
     - Achievement card scales up from center
     - Text reveals line by line
     - Haptic: Long success vibration
     - Sound: Optional cheerful chime

10. PULL TO REFRESH:
    Custom animation: Viya logo appears, rotates
    Complete: Logo bounces + checkmark
```

---

## SECTION 4: CRITICAL UX PATTERNS

### Viya Must Feel Proactive

```
PROACTIVE NOTIFICATIONS (WhatsApp-style messages, NOT push notifications):

Morning Brief (7:30 AM):
"☀️ Good morning, Rahul!
3 things for today:
• Rent due tomorrow ₹12,000
• Mom's birthday this Friday 🎂
• Goal: ₹600 to add for bike target
All good? [Yes ✓] [Let's discuss]"

Bill Due Alert (3 days before):
"⚠️ Electricity bill due in 3 days
Amount: ~₹1,800 (based on last 3 months)
Pay by June 15 to avoid late fee
[Pay Now] [Set Reminder] [Track Budget]"

Goal Milestone:
"🎯 Bike goal just crossed 40%!
You added ₹1,200 today.
At this rate, you'll hit the bike in 5 months.
Want to boost it? [Yes] [No]"

Pattern Detection:
"📊 I noticed something...
You order Swiggy every Friday evening.
₹2,400/month on Friday nights alone.
Want to budget for this? [Yes] [Ignore]"

Stress Detection:
"Hey Rahul, I noticed you've been 
very active at 2 AM this week.
Anything stressing you out? 
I'm here if you want to talk 🤗
[Talk to Viya] [I'm fine, thanks]"
```

---

## FINAL INSTRUCTION FOR ANTIGRAVITY

Build every screen exactly as specified.
No improvisation. No "simpler version."
Every animation. Every state. Every edge case.

This is a product used by 1 million people daily.
Every detail matters.
Every pixel earns trust or destroys it.

**Build the product that makes users say:**
*"I don't know how I lived without Viya."*

🚀
