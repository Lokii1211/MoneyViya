# VIYA AI AGENT — COMPLETE UI DESIGN PROMPT
## For Google Antigravity / Claude Opus 4.6
## Build Every Screen. Every Interaction. Every Animation. Exactly This.

---

> **DIRECTIVE TO ANTIGRAVITY:**
> You are building the world's most advanced Personal AI Agent.
> Not a finance app. Not a health app. Not an email client.
> A LIVING OPERATING SYSTEM for a human being's entire life.
> 
> This app must make users feel:
> "Viya knows me better than I know myself."
> "Nothing important will ever slip through again."
> "My life is finally under control."
>
> Build every pixel exactly as specified. No shortcuts. No simplifications.
> Target: The app that 50 million people cannot live without.

---

## PART 1: DESIGN SYSTEM

### 1.1 EMOTIONAL DESIGN PHILOSOPHY

```
VIYA MUST FEEL:
✅ Intelligent but warm (not cold like enterprise software)
✅ Proactive but not intrusive (speaks when it matters)
✅ Powerful but simple (depth hidden behind simplicity)
✅ Indian at heart but global in quality

FORBIDDEN:
❌ Corporate blues and grays (finance app cliché)
❌ Robotic response patterns
❌ Feature dumping on home screen
❌ Alert fatigue (too many notifications)
❌ Any blank/loading screens

DESIGN MANTRA:
"Every screen must answer one question instantly.
Every interaction must take under 3 taps.
Every notification must feel like it came from a caring friend, not a machine."
```

### 1.2 COMPLETE COLOR SYSTEM

```css
/* ═══════════════════════════════════════════ */
/* VIYA BRAND PALETTE                          */
/* ═══════════════════════════════════════════ */

/* PRIMARY — Cosmic Teal (Intelligence + Trust) */
--viya-teal-950: #001A1B;
--viya-teal-900: #003638;
--viya-teal-800: #005558;
--viya-teal-700: #007478;
--viya-teal-600: #009298;
--viya-teal-500: #00B0B8;  /* MAIN BRAND */
--viya-teal-400: #00CDD6;
--viya-teal-300: #4DDFE6;
--viya-teal-200: #99EEF2;
--viya-teal-100: #CCF6F9;
--viya-teal-50:  #E8FBFC;

/* SECONDARY — Deep Violet (AI + Premium) */
--viya-violet-950: #0D0020;
--viya-violet-900: #1A0040;
--viya-violet-800: #2D0066;
--viya-violet-700: #40008C;
--viya-violet-600: #5300B3;
--viya-violet-500: #6622CC;  /* AI COLOR */
--viya-violet-400: #8855DD;
--viya-violet-300: #AA88EE;
--viya-violet-200: #CCBBF5;
--viya-violet-100: #EEDDFC;
--viya-violet-50:  #F8F4FE;

/* ACCENT — Liquid Gold (Achievement + Energy) */
--viya-gold-500: #F5A500;
--viya-gold-400: #FFBA1A;
--viya-gold-300: #FFCC4D;
--viya-gold-200: #FFDD80;
--viya-gold-100: #FFF0BF;

/* SEMANTIC COLORS */
--viya-success:       #00C853;
--viya-success-light: #E8FFF0;
--viya-warning:       #FF9800;
--viya-warning-light: #FFF4E6;
--viya-error:         #FF3B3B;
--viya-error-light:   #FFF0F0;
--viya-info:          #0091FF;
--viya-info-light:    #E8F4FF;

/* CATEGORY COLORS (For data viz + icons) */
--cat-finance:      #00C853;  /* Green */
--cat-health:       #FF6B6B;  /* Coral */
--cat-work:         #0091FF;  /* Blue */
--cat-family:       #FF9800;  /* Orange */
--cat-shopping:     #9C27B0;  /* Purple */
--cat-travel:       #00BCD4;  /* Cyan */
--cat-food:         #FF5722;  /* Deep Orange */
--cat-email:        #E91E63;  /* Pink */
--cat-investment:   #4CAF50;  /* Green */
--cat-bills:        #F44336;  /* Red */

/* GRADIENTS */
--gradient-hero:     linear-gradient(135deg, #00B0B8 0%, #6622CC 100%);
--gradient-gold:     linear-gradient(135deg, #F5A500 0%, #FF6B35 100%);
--gradient-success:  linear-gradient(135deg, #00C853 0%, #00B0B8 100%);
--gradient-health:   linear-gradient(135deg, #FF6B6B 0%, #FF9800 100%);
--gradient-wealth:   linear-gradient(135deg, #4CAF50 0%, #00B0B8 100%);
--gradient-dark:     linear-gradient(180deg, #0D0020 0%, #001A1B 100%);
--gradient-morning:  linear-gradient(135deg, #F5A500 0%, #FF6B35 40%, #00B0B8 100%);
--gradient-night:    linear-gradient(180deg, #0D0020 0%, #1A0040 50%, #001A1B 100%);
--gradient-card:     linear-gradient(145deg, #FFFFFF 0%, #F0FAFA 100%);
--gradient-glass:    linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,250,250,0.8) 100%);

/* DARK MODE */
--dark-bg:           #080810;
--dark-surface-1:    #12121E;
--dark-surface-2:    #1A1A28;
--dark-surface-3:    #222235;
--dark-border:       #2A2A3D;
--dark-text-primary: #F0F0FF;
--dark-text-secondary: #9090AA;
--dark-text-tertiary:  #6060808;
```

### 1.3 TYPOGRAPHY

```
FONT STACK:
Display: "Sora" (weight 600, 700, 800)
Body: "Inter" (weight 400, 500, 600)
Numbers: "JetBrains Mono" (weight 400, 500, 600)
Regional: Noto Sans (Devanagari, Tamil, Telugu, Kannada)

TYPE SCALE:
Hero:    Sora 800 / 48px / -1.5px tracking
H1:      Sora 700 / 36px / -1px tracking
H2:      Sora 700 / 28px / -0.5px tracking
H3:      Sora 600 / 22px / -0.3px tracking
H4:      Inter 600 / 18px / 0px tracking
Body-L:  Inter 400 / 18px / 0.1px tracking / 28px line
Body-M:  Inter 400 / 16px / 0.1px tracking / 24px line
Body-S:  Inter 400 / 14px / 0.2px tracking / 20px line
Label:   Inter 500 / 12px / 0.8px tracking / UPPERCASE
Num-XL:  JetBrains 600 / 52px
Num-L:   JetBrains 600 / 36px
Num-M:   JetBrains 500 / 24px
Num-S:   JetBrains 400 / 16px

INDIAN NUMBERS (MANDATORY IN ALL CONTEXTS):
₹1,50,000 (NOT ₹150,000)
₹1,50,00,000 (NOT ₹15,000,000)
Always prefix ₹ symbol
Negative: Red color, minus prefix
Positive change: Green color, + prefix
```

---

## PART 2: SCREENS — COMPLETE SPECIFICATIONS

### SCREEN 1: SPLASH + BOOT

```
BACKGROUND: gradient-dark (deep purple-black)
CENTER: Viya orb (96px, animated)
  - Orb: gradient-hero sphere with inner glow
  - Pulse rings: 3 rings expand outward, opacity 0.3→0
  - "VIYA" text below: Sora 800, 32px, white
  - "Your AI Life Agent": Inter 400, 16px, white/60%

BOOT SEQUENCE (1.8 seconds):
  0ms:    Orb appears (scale 0→1, 400ms spring)
  400ms:  Pulse rings begin
  700ms:  "VIYA" fades in
  1000ms: Tagline fades in
  1200ms: Status bar at bottom begins filling
  1800ms: Crossfade to appropriate screen

STATUS BAR (bottom, 40px from bottom):
  Track: white/20%, Height: 2px, Width: 100px
  Fill: gradient-hero, animated left to right
  
DATA CHECK DURING BOOT:
  - Check auth token
  - If valid: Skip to Home
  - If first time: Go to Onboarding
  - Prefetch critical data in background
```

---

### SCREEN 2: ONBOARDING FLOW

#### 2A. Welcome Carousel (3 swipeable slides)

```
SLIDE 1 — "Your Second Brain"
BACKGROUND: gradient-dark
ILLUSTRATION (top 55%):
  Animated brain with neural connections
  Small icons orbit: 💰 📧 🏥 ✅ 🔔 📊
  All connected to center brain with glowing lines
  Slow rotation, 30-second loop

BOTTOM CARD (45%, white rounded-top 32px):
  Title: "Viya remembers everything so you don't have to"
  H2, neutral-900, centered
  
  Body: "Emails, bills, investments, health, family — 
  Viya watches over all of it 24/7 and alerts you 
  only when action is needed."
  Body-M, neutral-500, centered

SLIDE 2 — "Never Miss Anything"
ILLUSTRATION: 
  Phone screen showing flood of emails, bills, messages
  Viya orb "sorting" them — color-coded streams flowing out
  Urgent = Red stream, Scheduled = Blue, Done = Green

BOTTOM CARD:
  Title: "Reads your emails. Catches what matters."
  Body: "Viya scans your inbox, extracts bills, meeting 
  invites, deadlines, and alerts you with what needs 
  YOUR action. Everything else? Handled or archived."

SLIDE 3 — "Wealth + Health + Life"
ILLUSTRATION:
  Three orbiting rings: 💰 Wealth, 🏥 Health, 🎯 Life
  All spinning around user's smiling avatar
  Real numbers floating: "₹2,45,000 saved" "8hrs sleep" "Goal: 73%"

BOTTOM CARD:
  Title: "One app. Every dimension of your life."
  Body: "Track investments, manage diet, handle bills,
  coordinate family — all through natural conversation."
  
  CTA: [Get Started — It's Free] → gradient-hero button, full width

BOTTOM: Pagination dots + "Already have account? Sign in"
```

#### 2B. Phone Number Entry

```
PROGRESS BAR: 1 of 5 dots, teal

HEADER: "What's your number?" H1, neutral-900

SUBTEXT: "Viya will keep your life organized. 
We start with a quick verification."
Body-M, neutral-500

PHONE INPUT:
┌──────────────────────────────────────────────┐
│  🇮🇳 +91  ▾  │  Enter your phone number       │
└──────────────────────────────────────────────┘
Height: 68px, radius-16, border 2px neutral-200
Focus: border viya-teal-500, shadow 0 0 0 4px teal-100

COUNTRY PICKER (when tapped):
  Full-screen bottom sheet
  Search bar at top
  Flags + names + dial codes
  India pinned at top

CONTINUE BUTTON:
  Disabled state: neutral-200 background
  Active state (10 digits entered): gradient-hero, shadow-teal
  Transition: smooth 200ms color animation

LEGAL TEXT: "🔒 We never share your number. 
Privacy Policy | Terms of Service"
Label size, neutral-400, centered
```

#### 2C. OTP Verification

```
HEADER: Animated envelope → opening → checkmark inside

TITLE: "Enter the 6-digit code"

SUBTITLE: "Sent to +91 [PHONE] · [Edit]"
The phone number in bold; "Edit" as tappable viya-teal-500

OTP BOXES (6 individual):
Each box: 56px × 64px, radius-12
Gap: 8px (extra gap between 3rd and 4th)
Font: JetBrains Mono Bold, 32px, center-aligned

STATES:
  Empty:   border neutral-200, bg white
  Active:  border viya-teal-500, bg teal-50, shadow 0 0 0 4px teal-100
  Filled:  border violet-300, bg violet-50
  Success: border success, bg success-light → checkmark icon
  Error:   border error, bg error-light, shake animation

BEHAVIORS:
  Auto-advance cursor to next box
  Paste: auto-fill all 6 boxes
  Backspace: clear current + move back
  Auto-submit when 6th digit entered
  Auto-detect SMS OTP (Android)

TIMER: "Resend in 0:59" → counts down → "Resend Code" (tappable)

SUCCESS: All boxes go green, checkmarks draw in, navigate after 300ms
```

#### 2D. Connect Your Life (Permission Setup)

```
TITLE: "Let Viya access your world"
SUBTITLE: "Connect once. Viya handles the rest."

PERMISSION CARDS (Vertical scroll):

┌─────────────────────────────────────────────────┐
│ 📧  Email & Calendar                    [Connect]│
│     Gmail / Outlook / Yahoo                      │
│     Read emails, manage calendar, detect bills   │
│     "Never miss a deadline or meeting again"     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏦  Bank & Investments                  [Connect]│
│     Account Aggregator (AA Framework)            │
│     Track spending, goals, portfolio             │
│     "Secure, RBI-regulated, read-only access"   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 💪  Health Apps                         [Connect]│
│     Google Fit / Apple Health                    │
│     Steps, sleep, calories, heart rate           │
│     "Build habits that stick"                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📱  Phone (SMS Reading)                 [Allow]  │
│     Read bank SMS for auto-tracking              │
│     "Expenses tracked without lifting a finger"  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔔  Notifications                       [Allow]  │
│     Viya alerts via app + WhatsApp               │
│     "Smart alerts, never spam"                   │
└─────────────────────────────────────────────────┘

Each card:
  White bg, shadow-2, radius-xl
  Left: 48px emoji/icon in colored circle
  Right: [Connect] button — viya-teal-500 border
  When connected: [Connected ✓] — success green
  Description visible, expandable detail on tap

BOTTOM: 
  "Continue →" (active even if none connected — optional)
  "You can connect these later in Settings"
  Link: "Why do we need access? →" → Explains privacy
```

#### 2E. Tell Viya About You

```
TITLE: "Let's personalize Viya for you"

MULTI-SELECT INTEREST GRID (3 columns):

Row 1:
[💰 Finance]  [📧 Email]   [🔔 Reminders]
Row 2:
[🏥 Health]   [🍽️ Diet]    [💪 Fitness]
Row 3:
[📈 Invest]   [🧾 Bills]   [🛒 Shopping]
Row 4:
[👨‍👩‍👧 Family]  [✈️ Travel]  [📚 Learning]
Row 5:
[💼 Career]   [🧠 Mental]  [📄 Documents]

Each tile: 100px square, radius-16
Normal: White bg, 1px neutral-100 border, emoji 32px, label Body-S
Selected: gradient-hero bg, white emoji + text, scale(1.05) with bounce

LIFE STAGE QUESTION:
"What best describes you right now?"
Cards: [🎓 Student] [💼 Working Professional] 
       [👨‍💼 Business Owner] [🏠 Homemaker] [👴 Retired]
Radio selection (only one)

INCOME RANGE (Optional, dismissible):
Slider: ₹0 → ₹10L+/month
OR: "I'll tell Viya later" skip link

CONTINUE: Shows count — "Start with 8 areas →"
```

---

### SCREEN 3: HOME — THE COMMAND CENTER

```
CONCEPT: "Everything Viya knows about today, at one glance"

HEADER BAR (56px, sticky):
  LEFT: Viya orb (36px, animated breathing) + "Good morning, Rahul 👋"
       Sora 600, 18px, neutral-900
  RIGHT: [🔍 Search] [🔔 Alerts badge] [👤 Avatar]
  
  BACKGROUND: White, blur(20px) on scroll

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION A: VIYA DAILY BRIEF CARD
Style: gradient-night bg (dark), 24px padding, radius-24

TOP ROW:
  Left: "🌅 Daily Brief" — Label, white/60%
  Right: Time: "7:32 AM, Friday" — Label, white/60%

MAIN HEADING (white, H2):
  "You have 5 things that need you today"

ITEM LIST (each with icon + text, white, stagger animation):
  📧 3 emails need action — HDFC statement, Zomato refund, Meeting invite
  💳 Credit card bill ₹12,400 due tomorrow
  💊 Medicine (Vitamin D) not logged yet today  
  🎯 Bike goal: Add ₹600 to stay on track
  🎂 Dad's birthday in 3 days — no gift planned yet

ACTIONS ROW:
  [Handle All →] — white button, violet bg
  [Show me details] — ghost white button

ANIMATION: Each item slides in left-to-right with 80ms stagger

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION B: QUICK ACTIONS GRID (2×4)
Title: "Quick Actions" H4, neutral-700

┌─────────────────┐ ┌─────────────────┐
│ 🎤              │ │ ➕              │
│ Ask Viya        │ │ Add Expense     │
│ [gradient-hero] │ │ [teal bg]       │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ 📧              │ │ 🔔              │
│ Email Summary   │ │ Set Reminder    │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ 💰              │ │ 🏥              │
│ My Finance      │ │ Health Today    │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ 📊              │ │ 🛒              │
│ Wealth View     │ │ Bills & EMIs    │
└─────────────────┘ └─────────────────┘

Each tile: 80px height, white bg, radius-xl, shadow-2
Most used: Gets gradient-hero or teal bg (personalized)
Press: scale(0.96), haptic light

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION C: INBOX INTELLIGENCE STRIP
Title: "📧 Email Actions Needed" + [View All →]

Horizontal scroll, each card 280px wide:

┌──────────────────────────────────────┐
│ 🔴 URGENT                            │
│ HDFC Credit Card Statement           │
│ Bill: ₹12,400 · Due: Tomorrow        │
│ From: alerts@hdfcbank.com            │
│ Received: 2 hours ago                │
│ [Pay Now] [Set Reminder]             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📅 MEETING                           │
│ Q2 Review — Priya added you          │
│ Tomorrow, 3:00 PM · Conference Room  │
│ From: priya@company.com              │
│ [Accept] [Decline] [Propose Time]    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 💰 REFUND                            │
│ Zomato refund: ₹320                  │
│ Will credit in 3-5 business days     │
│ Original order: Jun 12               │
│ [Track Refund] [Mark Noted]          │
└──────────────────────────────────────┘

Card colors:
  URGENT: Left border 4px error, bg error-light/30%
  MEETING: Left border 4px info, bg info-light/30%
  FINANCIAL: Left border 4px success, bg success-light/30%
  PROMOTIONAL: Left border 4px neutral-300 (lower priority)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION D: WEALTH SNAPSHOT
Style: gradient-wealth bg, 20px padding, radius-xl

ROW 1:
  "Total Wealth" — Label, white/70%
  "₹12,34,567" — Num-XL, white
  "+₹8,200 this month" — Body-S, gold-300
  
ROW 2 (mini cards horizontal):
  [Savings: ₹2,45,000] [MF: ₹4,80,000] [FD: ₹3,00,000] [Stocks: ₹1,09,567]
  Each: white/20% bg, rounded pill

BOTTOM:
  Mini sparkline chart (last 30 days wealth trend)
  white line, subtle area fill

Press: Navigate to Wealth Dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION E: TODAY'S BILLS & DUE DATES
Title: "🧾 Bills & Payments" + [Manage →]

LIST (3 visible, show more on expand):

┌──────────────────────────────────────────────┐
│ 🔴 Credit Card (HDFC)    ₹12,400  TOMORROW   │
│    [Pay Now — HDFC App →]                    │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 🟡 Electricity Bill       ₹1,800   Jun 18    │
│    [Set Reminder] [Mark Paid]                │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 🟢 Jio Recharge          ₹479     Jun 24     │
│    [Auto-Recharge ON]                        │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 🔵 Home Loan EMI         ₹22,000   Jul 5     │
│    Auto-debit on Jul 5                       │
└──────────────────────────────────────────────┘

[View 4 more dues →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION F: HEALTH & DIET TODAY
Title: "💪 Your Body Today" + [Log →]

TWO CARDS SIDE BY SIDE:

LEFT: Steps Card
  bg: health gradient (coral→orange)
  "4,200" — Num-L, white
  "/ 8,000 steps" — Body-S, white/80%
  Half-circle progress: white line
  "42% of goal" — Label
  
RIGHT: Diet Card
  bg: success gradient
  "1,840" — Num-L, white
  "/ 2,200 kcal" — Body-S, white/80%
  "Breakfast ✓ Lunch ✓ Dinner ?" — Body-S
  [Log Dinner]

BELOW (Full width): Sleep Last Night
  "7.5 hours" progress bar
  "You slept well! REM: 2.1hrs"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION G: ACTIVE GOALS
Title: "🎯 Your Goals" + [All Goals →]

Horizontal scroll cards:

┌─────────────────────────────────┐
│ 🏍️  Bullet Bike                 │
│ ████████░░░░░  42%              │
│ ₹33,600 / ₹80,000               │
│ 5 months at current pace        │
│ [Add ₹600 today?]               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🏠  Emergency Fund              │
│ ██████████████  94%             │
│ ₹94,000 / ₹1,00,000            │
│ SO CLOSE! ₹6,000 to go!         │
│ [Finish it! →]                  │
└─────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FLOATING ACTION BUTTON:
  60px circle, gradient-hero, microphone icon
  Position: bottom-right, 20px margins
  Long press: Radial menu with 6 quick actions
  Breathing animation when idle

BOTTOM NAVIGATION (80px):
[🏠 Home] [📧 Inbox] [💰 Finance] [🏥 Health] [👤 Me]
```

---

### SCREEN 4: EMAIL INTELLIGENCE (The Killer Feature)

```
CONCEPT: "Your inbox, summarized, prioritized, acted upon"

HEADER:
  "📧 Email Intelligence" — H2
  Last synced: "2 minutes ago" + refresh icon

TAB BAR (below header):
  [🔴 Action (3)] [📅 Meetings (2)] [💰 Financial (5)] [📦 All]

ACTIVE TAB: Action Items
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMAIL CARD DESIGN (Full width cards):

TYPE 1: BILL/PAYMENT EMAIL

┌──────────────────────────────────────────────────┐
│ 🏦 HDFC Bank              2 hours ago   🔴 URGENT│
│─────────────────────────────────────────────────│
│ YOUR CREDIT CARD STATEMENT IS READY              │
│─────────────────────────────────────────────────│
│ Viya extracted:                                  │
│   Amount Due:  ₹12,400 (full)                   │
│   Min. Due:    ₹1,240                            │
│   Due Date:    Tomorrow, Jun 14                  │
│   Last Date:   Jun 18 (with late fee ₹1,000)    │
│─────────────────────────────────────────────────│
│ Top Spends:                                      │
│   🍔 Swiggy     ₹3,200  │  ✈️ MakeMyTrip ₹4,500│
│   🛒 Amazon     ₹2,100  │  ⛽ HP Petrol  ₹1,800│
│─────────────────────────────────────────────────│
│ [Pay Full ₹12,400] [Pay Minimum] [Remind Jun 13]│
│ [View Statement] [See in Original Email]         │
└──────────────────────────────────────────────────┘

TYPE 2: MEETING INVITE EMAIL

┌──────────────────────────────────────────────────┐
│ 👤 Priya Sharma            1 hour ago   📅 MEETING│
│─────────────────────────────────────────────────│
│ RE: Q2 Performance Review — Calendar Invite      │
│─────────────────────────────────────────────────│
│ Viya extracted:                                  │
│   What:     Q2 Performance Review                │
│   When:     Tomorrow, Jun 14, 3:00-4:00 PM       │
│   Where:    Conference Room B / Zoom             │
│   Who:      You, Priya Sharma, Ankit Kumar       │
│   Agenda:   Sales targets, product roadmap       │
│─────────────────────────────────────────────────│
│ Viya asks: "Nothing scheduled at this time ✅   │
│ Add to calendar?"                               │
│─────────────────────────────────────────────────│
│ [✅ Accept & Add to Calendar] [❌ Decline]        │
│ [📅 Suggest Different Time] [📝 View Email]      │
└──────────────────────────────────────────────────┘

TYPE 3: PACKAGE/DELIVERY

┌──────────────────────────────────────────────────┐
│ 📦 Amazon India           3 hours ago            │
│─────────────────────────────────────────────────│
│ Your order is OUT FOR DELIVERY                   │
│─────────────────────────────────────────────────│
│ Item:    boAt Airdopes 141 (Black)               │
│ Order:   #402-XXXXXXX                            │
│ Status:  Out for delivery                        │
│ ETA:     Today by 8:00 PM                        │
│─────────────────────────────────────────────────│
│ [📍 Track Live] [📞 Call Delivery Partner]        │
│ [🔔 Alert when 30 min away] [Mark Received]      │
└──────────────────────────────────────────────────┘

TYPE 4: INVESTMENT/FINANCIAL

┌──────────────────────────────────────────────────┐
│ 📈 Zerodha                Today 9:15 AM  💰 INVEST│
│─────────────────────────────────────────────────│
│ Your SIP was executed successfully               │
│─────────────────────────────────────────────────│
│ Viya extracted:                                  │
│   Fund:    Axis Bluechip Fund - Direct           │
│   Amount:  ₹3,000                               │
│   NAV:     ₹52.34                               │
│   Units:   57.319                               │
│   Total portfolio value: ₹4,80,234              │
│─────────────────────────────────────────────────│
│ Added to your portfolio tracker ✅               │
│ [View Portfolio] [Increase SIP Amount]           │
└──────────────────────────────────────────────────┘

TYPE 5: OTP/VERIFICATION (Low priority, auto-archive)
  Small card, neutral bg
  "OTP extracted: 847293 (copied automatically)"
  [Copy Again] [Archive]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMAIL SETTINGS PANEL (slide in from right):
  Connected accounts
  Filter rules (what Viya tracks vs ignores)
  Notification settings per category
  Auto-actions toggle (auto-add meetings to calendar, etc.)
```

---

### SCREEN 5: WEALTH MANAGEMENT DASHBOARD

```
HEADER: "💰 Wealth Overview"
  Subtitle: "Complete picture of your money"

TOTAL WEALTH CARD (gradient-wealth, radius-24):
  ┌──────────────────────────────────────────────┐
  │ NET WORTH                                    │
  │ ₹12,34,567                                  │
  │ +₹45,234 this month (+3.8%) 📈               │
  │                                              │
  │ ──────────── Breakdown ────────────          │
  │ Savings   ₹2,45,000  │ Investments ₹7,89,567│
  │ FD/RD     ₹1,50,000  │ Cash        ₹50,000  │
  │                                              │
  │ [30D] [3M] [6M] [1Y] [ALL]                  │
  │ ___/\/\/\/\/\/\___/\/\/\___                  │
  │ (Line chart — net worth trend)               │
  └──────────────────────────────────────────────┘

INVESTMENTS SECTION:
  Title: "Your Investments" + [+ Add]

  MUTUAL FUNDS CARD:
  ┌──────────────────────────────────────────────┐
  │ 📈 Mutual Funds                ₹4,80,234     │
  │ Invested: ₹3,60,000 | Gain: ₹1,20,234 (+33%)│
  │                                              │
  │ AXIS BLUECHIP DIRECT           ₹1,20,456     │
  │ SIP: ₹3,000/mo | +18.4%                     │
  │                                              │
  │ MIRAE ASSET EMERGING BLUECHIP  ₹98,234       │
  │ SIP: ₹2,000/mo | +22.1%                     │
  │                                              │
  │ HDFC INDEX FUND NIFTY 50      ₹2,61,544     │
  │ SIP: ₹5,000/mo | +16.8%                     │
  │                                              │
  │ [Invest More] [View All Funds]               │
  └──────────────────────────────────────────────┘

  STOCKS CARD:
  ┌──────────────────────────────────────────────┐
  │ 📊 Stocks (Zerodha)           ₹1,09,567      │
  │ Invested: ₹85,000 | Gain: ₹24,567 (+28.9%)  │
  │                                              │
  │ [TCS] ₹32,000 +12% | [INFY] ₹28,000 +8%   │
  │ [HDFC] ₹24,567 +18%                         │
  │                                              │
  │ Today: ₹1,234 ↑ (+1.1%)                    │
  │ [Open Zerodha] [View Details]               │
  └──────────────────────────────────────────────┘

  FIXED DEPOSITS:
  ┌──────────────────────────────────────────────┐
  │ 🏦 Fixed Deposits              ₹1,50,000     │
  │                                              │
  │ SBI FD #1   ₹1,00,000  @7.1%  Matures Jul'25│
  │ ICICI FD #2 ₹50,000    @7.4%  Matures Dec'24│
  │                                              │
  │ ⚠️ ICICI FD matures in 48 days — Renew?    │
  │ [Renew] [Withdraw] [Set Reminder]            │
  └──────────────────────────────────────────────┘

BUDGET VS ACTUAL (Monthly):
  Donut chart: Category breakdown
  Center: "₹14,320 / ₹25,000"
  Ring segments with amounts
  Tap segment → Category drill-down

UPCOMING FINANCIAL EVENTS:
  Timeline view:
  Jun 14 → Credit card due ₹12,400 🔴
  Jun 15 → SIP deduction ₹10,000 💰
  Jun 24 → Jio recharge ₹479
  Jul 5  → Home loan EMI ₹22,000
  Jul 15 → FD maturity ₹50,000 📈

VIYA WEALTH INSIGHTS (AI-generated):
  ┌──────────────────────────────────────────────┐
  │ 💡 Viya's Wealth Insight                     │
  │ "Your FD matures in 48 days. At current      │
  │  market rates, reinvesting in Liquid Mutual  │
  │  Fund gives 1.3% more returns.              │
  │  That's ₹650 extra/year on ₹50,000."        │
  │ [Show me how] [Remind me before maturity]    │
  └──────────────────────────────────────────────┘
```

---

### SCREEN 6: HEALTH & DIET INTELLIGENCE

```
HEADER: "💪 Health Command Center"

DAILY HEALTH SCORE (Hero):
  Circle: 120px, gradient stroke (coral→orange)
  Center: "76" — Num-XL
  Below: "Health Score" — Label
  "Better than yesterday! (+4 pts)" — Body-S, success

FOUR PILLARS (2×2 grid):

┌────────────────────┐ ┌────────────────────┐
│ 👣 STEPS           │ │ 😴 SLEEP           │
│ 4,200 / 8,000      │ │ 7.5 / 8 hrs        │
│ ████░░░░ 52%       │ │ █████████░ 94%     │
│ +1,200 more today  │ │ Deep: 2.1h ✓       │
└────────────────────┘ └────────────────────┘
┌────────────────────┐ ┌────────────────────┐
│ 💧 WATER           │ │ 🔥 CALORIES        │
│ 4 / 8 glasses      │ │ 1,840 / 2,200      │
│ ████░░░░ 50%       │ │ ████████░ 84%      │
│ [+ Add glass]      │ │ Deficit: 360 kcal  │
└────────────────────┘ └────────────────────┘

DIET & NUTRITION SECTION:
  Title: "🍽️ Today's Diet" + [+ Log Meal]

  MEAL CARDS:
  ┌──────────────────────────────────────────────┐
  │ ☀️ BREAKFAST          ✅ Logged  8:30 AM     │
  │ Oats + Banana + Milk                         │
  │ 380 kcal | Protein: 12g | Carbs: 58g         │
  │ [Edit] [View breakdown]                      │
  └──────────────────────────────────────────────┘
  
  ┌──────────────────────────────────────────────┐
  │ ☀️ LUNCH             ✅ Logged  1:15 PM      │
  │ Rice, Dal, Sabzi, Roti (x2)                  │
  │ 680 kcal | Protein: 22g | Carbs: 95g         │
  │ [Edit] [View breakdown]                      │
  └──────────────────────────────────────────────┘
  
  ┌──────────────────────────────────────────────┐
  │ 🌙 DINNER            ⏰ Not logged           │
  │ Viya suggests: Light meal (stay under 2,200) │
  │ Remaining: 780 kcal                          │
  │ [Log Dinner] [Get suggestion]                │
  └──────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────┐
  │ 🍎 SNACKS                                    │
  │ Almonds (20g) — 120 kcal · 4:30 PM          │
  │ [+ Add Snack]                                │
  └──────────────────────────────────────────────┘

VIYA FOOD SCANNER:
  [📷 Scan Food to Log Instantly]
  → Opens camera → AI identifies food → Shows nutrition → Confirm to log

MEDICINE TRACKER:
  ┌──────────────────────────────────────────────┐
  │ 💊 Medicine Schedule                         │
  │                                              │
  │ ✅ Vitamin D (1 tab) — 8:00 AM — Taken       │
  │ ⏰ Omega 3 (2 caps) — 1:00 PM — DUE SOON    │
  │ ○  Ashwagandha (1 tab) — 9:00 PM — Upcoming │
  │                                              │
  │ [Mark Omega 3 Taken] [View All Medicines]    │
  └──────────────────────────────────────────────┘

HEALTH INSIGHTS (Weekly):
  "Your sleep improved 18% this week! 🎉"
  "You've walked 52,000 steps this week — personal best!"
  "Protein intake was below target 4 days. Try adding eggs to breakfast."
```

---

### SCREEN 7: BILLS, EMI & RECHARGE CENTER

```
HEADER: "🧾 Bills & Payments"
  "₹36,879 due this month" — Num-M, error
  
CALENDAR VIEW (Month at top):
  Mini calendar showing due dates marked with dots
  Red: Overdue, Orange: Due soon, Green: Paid, Blue: Auto

BILLS LIST (grouped by date):

"OVERDUE" section (red header):
┌──────────────────────────────────────────────────┐
│ ⚡ BESCOM Electricity    ₹1,800   Due 3 days ago  │
│ Late fee starts tomorrow (₹100/day)              │
│ [Pay Now — BESCOM Portal →]                      │
└──────────────────────────────────────────────────┘

"DUE TODAY / TOMORROW" section:
┌──────────────────────────────────────────────────┐
│ 💳 HDFC Credit Card      ₹12,400   Due Tomorrow  │
│ Minimum: ₹1,240 | Full: ₹12,400                 │
│ [Pay Full] [Pay Minimum] [Set Reminder 9 AM]     │
└──────────────────────────────────────────────────┘

"THIS MONTH" section:
┌──────────────────────────────────────────────────┐
│ 📱 Jio Prepaid Recharge   ₹479    Jun 24         │
│ Current validity: 10 days left                   │
│ [Recharge Now] [Auto-Recharge ON ✓]              │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ 🏠 Home Loan EMI (SBI)   ₹22,000   Jul 5        │
│ Principal: ₹14,200 | Interest: ₹7,800           │
│ Auto-debit from SBI Savings                      │
│ [View Loan Schedule] [Prepay EMI?]               │
└──────────────────────────────────────────────────┘

SUBSCRIPTIONS AUDIT:
  ┌──────────────────────────────────────────────┐
  │ 📺 Active Subscriptions        ₹1,647/month │
  │                                              │
  │ Netflix ₹649  · Last watched: 2 days ago ✅  │
  │ Spotify ₹119  · Last used: 1 hour ago ✅    │
  │ Hotstar ₹299  · Last used: 32 days ago ⚠️  │
  │ Gym ₹1,200    · Last visited: 47 days ago❌ │
  │                                              │
  │ ⚠️ Potential waste: ₹1,499/month            │
  │ [Cancel Gym & Hotstar] [Review All]          │
  └──────────────────────────────────────────────┘

EMI TRACKER:
  "₹47,500/month in EMIs"
  Home Loan ₹22,000 | Car Loan ₹12,000 | Personal ₹8,500 | CC EMI ₹5,000
  Timeline: Ends 2028, 2025, 2024, 3 months
  [Prepayment Calculator]
```

---

### SCREEN 8: CALENDAR & SCHEDULE VIEW

```
HEADER: "📅 Your Schedule"

WEEK VIEW (Top):
  Days of week with dot indicators
  Active day highlighted with gradient-hero
  Each day shows: meeting count, task count, reminder count

TODAY'S TIMELINE:
  Vertical line with time markers
  
  8:00 AM  🔔 Reminder: Take medicine
  9:00 AM  ─── (free)
  10:00 AM 💼 [MEETING] Weekly standup (Zoom) · 1hr
            From: Priya added to Google Calendar
  11:00 AM ─── (free)
  12:00 PM ⏰ [REMINDER] HDFC bill due tomorrow - Pay today!
  1:00 PM  🍽️ Lunch (self)
  2:00 PM  ─── (free)
  3:00 PM  💼 [MEETING] Q2 Review (Conf Room B) · 1hr
            [Accept pending] → [Accept ✓] [Decline ✗]
  4:00 PM  ─── (free)
  5:00 PM  🔔 Reminder: Gym streak — don't break 12 days!
  8:00 PM  🔔 Evening check-in with Viya
  9:00 PM  💊 Medicine: Ashwagandha

MEETING CARDS (on tap):
  Attendees avatars
  Agenda (extracted from email)
  Meeting link (tap to open Zoom/Meet)
  Pre-meeting brief button: "Viya, brief me on this meeting →"
  
PRE-MEETING BRIEF (AI feature):
  Viya reads all email context, attendee info, agenda
  Generates:
  - Meeting purpose
  - Your action items from last meeting
  - Key talking points
  - Questions you should ask
  
ADD EVENT:
  Floating + button
  Natural language: "Meeting with client next Tuesday 3pm"
  Viya parses → creates event → asks confirm → adds to all calendars
```

---

### SCREEN 9: SMART SHOPPING

```
HEADER: "🛒 Smart Shopping"

PRICE TRACKER:
  Active price watches
  ┌──────────────────────────────────────────────┐
  │ 📱 iPhone 15 128GB              Tracking...  │
  │ Current: ₹69,900 | Your target: ₹65,000      │
  │ Lowest ever: ₹67,500 (Nov 2023)              │
  │ [Price Alert ON] [Buy Now] [Remove]           │
  └──────────────────────────────────────────────┘

SHOPPING LISTS:
  "Groceries" | "Monthly Essentials" | "Wish List"
  Each item with estimated price, priority
  [One-tap to reorder basics]

SPENDING ANALYSIS:
  Amazon: ₹8,400 this month (3 orders)
  Flipkart: ₹2,200 this month (1 order)
  "Tip: Your Amazon spending is 40% above average this month"

SMART DEALS FEED:
  Based on user's tracked products + purchase patterns
  "Bosch mixer you watched is 15% off today"
  [Buy] [Pass] [Alert me if further discounts]
```

---

## PART 3: COMPONENT LIBRARY

### KEY REUSABLE COMPONENTS

```
VIYA MESSAGE BUBBLE:
  Types: text, action_card, rich_card, suggestion, celebration, warning
  Animations: Fade in + slide up 8px, 200ms
  Max-width: 85% of screen
  
VIYA ORB:
  Sizes: 36px (header), 60px (loading), 96px (splash), 120px (empty states)
  Behavior: Slow breathing animation (scale 1→1.05→1, 3s loop)
  Active thinking: Faster pulse + color shift to violet
  Speaking: Waveform rings expand outward
  
FINANCIAL NUMBER:
  Component: Animated number counter
  Colors: green (positive), red (negative), white (on dark bg)
  Indian formatting: Always ₹X,XX,XXX
  
CATEGORY CHIP:
  Size: 32px height, auto-width
  Icon + label
  Color-coded by category
  
PRIORITY BADGE:
  🔴 Critical, 🟡 Medium, 🟢 Low, ⚪ Info
  
PROGRESS BAR:
  Track: neutral-100, Height: 8px, radius-full
  Fill: gradient based on context (goal=hero, health=health)
  Milestone markers: Small circles on the track
  Animation: Fills with spring animation on mount

BOTTOM SHEET:
  Handle: 36px wide, 4px tall, neutral-300
  Snap points: 30%, 60%, 90%
  Backdrop: black/50%, tap to dismiss
  
TOAST NOTIFICATION:
  Appears: slide down from top, 300ms
  Auto-dismiss: 3 seconds
  Types: success (green), warning (orange), error (red), info (blue)
  Tap: Dismiss or action button
```

---

## PART 4: ANIMATION CATALOG

```
1. NUMBER MORPH (Financial updates):
   Old number shrinks + fades → new number grows in
   Duration: 600ms, spring physics
   Color briefly flashes (green=increase, red=decrease)

2. EMAIL CARD APPEAR:
   Cards fall down 16px + fade in, staggered 60ms each
   Duration: 250ms ease-out

3. GOAL COMPLETION EXPLOSION:
   Confetti burst (40 particles, brand colors)
   Achievement badge scales from center (0→1.2→1)
   Text reveals line by line
   Haptic: Long success vibration
   Sound: Cheerful chime (optional)

4. BILL PAID CHECK:
   Circle draws around amount → checkmark draws → strikethrough text
   Color transitions to success green
   Card slides out (paid items collapse)
   Duration: 600ms total

5. WEALTH CHART DRAW:
   Line draws left to right on load
   Area fill fades in after line
   Data points pop in with scale animation
   Duration: 800ms ease-out

6. FAB RADIAL MENU:
   6 items expand radially from FAB
   Each item: scale(0)→scale(1) with 50ms stagger
   Backdrop: blur fades in
   Close: Reverse animation

7. VOICE RECORDING WAVEFORM:
   Real-time bars rise and fall with audio input
   Colors: gradient-hero
   Background orb: Pulses with voice amplitude

8. STREAK FIRE:
   New day added: Fire icon jumps + scale bounce
   Milestone (7, 14, 21, 30): Full fire animation sequence

9. MORNING BRIEF ITEMS STAGGER:
   Items fly in from right, one by one
   80ms delay between each
   Duration per item: 200ms spring

10. SKELETON SCREENS:
    Shimmer: white highlight sweeps left to right
    Colors: neutral-50 → neutral-100
    Duration: 1.5s loop
    EVERY loading state uses skeleton (never blank screen)
```

---

## FINAL INSTRUCTION

```
CRITICAL PRINCIPLES FOR EVERY SCREEN:

1. ZERO BLANK SCREENS
   Always: skeleton loaders, loading states, empty state illustrations

2. EVERY ACTION IN 3 TAPS
   If something takes more than 3 taps, redesign it

3. CONTEXT OVER CLUTTER
   Only show what's relevant RIGHT NOW
   Time-based: Morning brief ≠ Evening check-in
   State-based: If no bills due, don't show bills section

4. PROACTIVE > REACTIVE
   Viya tells user before they ask
   Design space for proactive cards everywhere

5. INDIA-FIRST
   ₹ symbol always
   Indian number format always
   Hindi/Tamil as first-class citizens
   UPI as default, not card

6. DARK MODE EVERYTHING
   Every screen, every component
   Auto-detect system preference
   Manual toggle in settings

7. OFFLINE GRACEFULLY
   Show cached data with "Last updated X" badge
   Never show error without recovery action
   Queue actions for when back online

BUILD THE PRODUCT THAT CHANGES HOW PEOPLE MANAGE THEIR LIVES.
EVERY PIXEL MUST JUSTIFY ITS EXISTENCE.
🚀
```
