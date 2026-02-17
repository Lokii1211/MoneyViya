# MoneyViya — Senior UI/UX Design System & Prompts
### Every Screen. Every Interaction. Every Emotion. Production-Ready.

---

> **How to use this document:** Each section contains a ready-to-paste prompt for an AI design tool (V0, Bolt, Cursor, Figma AI, or a frontend dev). Prompts are layered — always include the Design System section first, then the specific screen prompt. This ensures every screen feels like one cohesive product.

---

## ⚠️ SENIOR UX MANDATE — READ BEFORE ANYTHING ELSE

> Before touching a single pixel, internalize this: **MoneyViya's users are NOT tech-savvy urban English speakers.** They are Meena in Coimbatore who manages a family of 5 on ₹25,000. They are Ravi in Patna who earns ₹18,000 and has never opened a banking app. They are Divya in Bangalore juggling 3 freelance clients.
>
> Every design decision — font size, contrast ratio, tap target, number of options on screen — must pass the **"Meena Test"**: Can Meena understand and use this in 3 seconds with her 2017 Android phone on a 4G connection with 40% signal?
>
> **If you design for Meena, everyone else wins. If you design for the tech-savvy urban user, you lose Meena.**

---

## PART 1: THE DESIGN SYSTEM (PASTE THIS BEFORE EVERY PROMPT)

```
=== MONEYVIYA DESIGN SYSTEM ===

BRAND IDENTITY:
Product: MoneyViya — AI Financial Manager on WhatsApp
Brand Voice: Trustworthy best friend who's a brilliant CA. Warm. Smart. Non-judgmental.
Brand Feeling: Confidence + Warmth + Modern India

AESTHETIC DIRECTION:
Style: "Premium Accessible" — feels premium like Zerodha, approachable like WhatsApp
NOT: Corporate bank aesthetic (cold, intimidating)
NOT: Generic fintech purple gradient (overused, feels fake)
NOT: Cluttered dashboard (users are not financial experts)

DESIGN PHILOSOPHY:
- Clarity over cleverness
- One primary action per screen
- Breathing room — generous whitespace
- Numbers must be scannable in <1 second
- Mobile-first always (75% of Indian internet users are mobile-only)

COLOR SYSTEM:
Primary:    #00A86B  (Rich Emerald Green — trust, growth, money)
Primary Dark: #007A4E (hover states, pressed states)
Primary Light: #E8F9F2 (backgrounds, tags, highlights)
Secondary:  #1A1A2E  (Deep Navy — authority, sophistication)
Accent:     #FFB703  (Warm Gold — achievements, celebrations, milestones)
Accent Alt: #FF6B35  (Warm Orange — alerts, important actions)
Success:    #00A86B  (same as primary)
Warning:    #FFB703  (same as gold)
Danger:     #E63946  (clear red — budget exceeded, critical alerts)
Neutral 50:  #F8FAFB
Neutral 100: #F0F4F7
Neutral 200: #E1E8EE
Neutral 400: #94A3B8
Neutral 600: #475569
Neutral 800: #1E293B
Neutral 900: #0F172A

TYPOGRAPHY:
Display/Hero: "Clash Display" or "Sora" (strong, modern, Indian-tech feel)
  — H1: 48px / 56px line-height / weight 700
  — H2: 36px / 44px / weight 600
  — H3: 24px / 32px / weight 600
Body: "Plus Jakarta Sans" (warm, highly legible, excellent for numbers)
  — Body Large: 18px / 28px / weight 400
  — Body: 16px / 24px / weight 400
  — Body Small: 14px / 20px / weight 400
Mono (numbers): "JetBrains Mono" or "IBM Plex Mono" (for financial figures — critical)
  — All rupee amounts, percentages, and financial numbers use mono
  — Makes numbers scannable and trustworthy

NUMBER FORMATTING RULES (CRITICAL):
✅ ₹1,50,000 (Indian numbering — always)
✅ ₹45K (abbreviated for charts)
❌ ₹150,000 (Western format — wrong for India)
❌ Rs. 1,50,000 (use ₹ symbol always)
Always show: positive amounts in Primary Green, negative in Danger Red

SPACING SYSTEM (8px base grid):
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px | 4xl: 96px

BORDER RADIUS:
Cards: 16px
Buttons: 12px
Inputs: 12px
Tags/Chips: 100px (pill shape)
Avatars: 100% (circle)

SHADOWS:
Card: 0 2px 12px rgba(0,0,0,0.06)
Card Hover: 0 8px 24px rgba(0,168,107,0.12)
Floating: 0 16px 48px rgba(0,0,0,0.12)

COMPONENT STANDARDS:

Buttons:
Primary: bg=#00A86B, text=white, height=52px, padding=16px 32px, radius=12px
  — Hover: bg=#007A4E, shadow=0 4px 16px rgba(0,168,107,0.3)
  — Active: scale(0.98)
Secondary: border=2px #00A86B, text=#00A86B, bg=transparent
Ghost: text=#475569, no border, bg=transparent
Danger: bg=#E63946, text=white
Disabled: opacity=0.4, cursor=not-allowed
MINIMUM tap target: 48px × 48px (mobile accessibility)

Input Fields:
Height: 56px (generous for fat-finger mobile)
Border: 1.5px solid #E1E8EE
Focus border: 1.5px solid #00A86B + glow: 0 0 0 3px rgba(0,168,107,0.15)
Error border: 1.5px solid #E63946
Label: above input, 14px, weight 500, color #475569
Placeholder: #94A3B8

Cards:
bg=white, radius=16px, shadow=(card shadow above)
Padding: 24px
Hover: transform translateY(-2px) + hover shadow

Progress Bars:
Height: 8px, radius=100px
Track: #E1E8EE
Fill: gradient left-to-right #00A86B → #00D48A
Animate fill on page load (0 → actual value, 800ms ease-out)

ICONOGRAPHY:
Library: Phosphor Icons (filled variants for main UI, regular for secondary)
Size: 20px inline, 24px for CTAs, 32px for feature icons, 48px for empty states
Color: Match context (green for positive, gold for achievements, red for warnings)

ILLUSTRATION STYLE:
Use flat illustrations with Indian characters (diverse, regional representation)
Characters should reflect actual users: homemakers, students, freelancers, farmers
NOT: Western tech-startup stock illustrations
NOT: Generic money/coin clip art
Style reference: Google Pay India illustrations, Slice app characters

MOTION PRINCIPLES:
Duration: 150ms micro, 300ms standard, 500ms emphasis, 800ms page
Easing: cubic-bezier(0.16, 1, 0.3, 1) for enters, ease-in for exits
Principles: Numbers count up on entry, progress bars animate, celebrations have confetti/particles
Reduce motion: Always respect prefers-reduced-motion

ACCESSIBILITY:
Contrast: Minimum 4.5:1 for body, 3:1 for large text (WCAG AA)
Focus states: Visible ring in primary green
Touch targets: Minimum 48×48px
Font size: Never below 14px (16px preferred for body)
Error messages: Never rely on color alone — always icon + text
Loading states: Every async action needs a skeleton or spinner

RESPONSIVE BREAKPOINTS:
Mobile: 320px - 767px (primary design target)
Tablet: 768px - 1023px
Desktop: 1024px+
Design mobile first, then scale up.
```

---

## PART 2: LANDING PAGE — THE CONVERSION MACHINE

### Screen: Hero Section

```
=== UI/UX PROMPT: MONEYVIYA LANDING PAGE — HERO ===

[Paste Design System above first]

PAGE PURPOSE: Convert a visitor (someone who heard about MoneyViya) into a WhatsApp user in under 60 seconds. The hero must answer 3 questions immediately: What is it? Is it for me? How do I start?

HERO LAYOUT (Desktop — split screen):
LEFT SIDE (55% width):
  - Small label chip: "🤖 AI-Powered • WhatsApp-Native • Free to Start"
    Style: pill shape, bg=#E8F9F2, text=#00A86B, font-size=13px, weight=600
  
  - H1 headline (2 lines max):
    Line 1: "India का Personal" (smaller, lighter weight)
    Line 2: "Financial Advisor" (large, bold, emerald green gradient)
    — Alternative: Test "Your Money. Your Language. WhatsApp." 
    Font: Clash Display, 56px desktop / 36px mobile
    
  - Subheadline (1-2 sentences):
    "Track expenses, build goals, get investment advice — all through WhatsApp. 
    In Tamil, Hindi, Telugu, Kannada, or English."
    Font: Plus Jakarta Sans, 18px, color=#475569
    
  - SOCIAL PROOF BAR (below subheadline):
    "⭐ 4.9 rating  •  50,000+ users  •  ₹12 Crore saved"
    Style: small, gray, weight=500
    
  - CTA SECTION:
    Primary CTA: Large green button
    Text: "💬 Start on WhatsApp — Free"
    → Opens wa.me/[number] in new tab
    Below button: "No app download. No credit card. No signup form."
    
  - LANGUAGE FLAGS ROW:
    Small flag icons: 🇮🇳 Hindi  🇮🇳 Tamil  🇮🇳 Telugu  🇮🇳 Kannada  🇬🇧 English
    Label: "Speaks your language"

RIGHT SIDE (45% width):
  - HERO VISUAL: Animated WhatsApp chat mockup
    Design: Realistic WhatsApp dark/light interface in a phone frame
    Show a real conversation playing out (typewriter animation, 3 second loop):
    
    Message bubble 1 (user): "Spent 500 on lunch"
    [500ms delay]
    Message bubble 2 (MoneyViya — green): 
      "✅ ₹500 logged! 🍛
       Budget left today: ₹833
       You're 2 days closer to your Goa trip 🏖️"
    [1000ms delay] 
    Message bubble 3 (user): "How much have I saved this month?"
    [500ms delay]
    Message bubble 4 (MoneyViya):
      "📊 September so far:
       💰 Saved: ₹4,200
       🎯 Goal progress: 42%
       Keep going! 💪"
    
    Loop with fade transition
    
  - Behind phone: Soft green/gold abstract gradient blob (atmosphere)
  - Small floating cards orbiting phone:
    Card 1: "🎯 Bike Goal: 67% ▓▓▓▓▓▓░░░"
    Card 2: "📈 NIFTY +0.8% today"
    Card 3: "🔥 14 day streak!"
    These cards have gentle floating animation (translateY -8px loop, 3s ease-in-out)

MOBILE HERO:
Stack vertically. Remove floating cards. Phone mockup comes FIRST (visual hook).
H1 reduces to 36px. CTA button full width.

BACKGROUND:
Subtle grid pattern (#E8F9F2, 1px lines, 40px grid) on white — suggests financial precision
OR: Clean white with large soft green gradient in top-right corner

ANIMATION ON LOAD:
1. Background fades in (0ms)
2. Left content slides up + fades in (200ms)
3. Phone mockup scales in from 0.95 to 1.0 (400ms)
4. Floating cards appear one by one (600ms, 800ms, 1000ms)
5. Chat bubbles start typing animation (1200ms)

URGENCY ELEMENT (subtle):
Below CTA, small text: "Join 847 people who signed up this week"
Update this number to feel real and current (not a round number)
```

---

### Screen: Problem Section (The "You Get Me" Moment)

```
=== UI/UX PROMPT: LANDING PAGE — PROBLEM SECTION ===

[Paste Design System first]

SECTION PURPOSE: Make the user feel SEEN. They should read this and think "finally, someone understands." This is emotional, not logical.

LAYOUT: Full-width section, bg=#0F172A (deep navy), white text
Padding: 96px vertical

HEADLINE:
"Managing money is hard.
We made it human."
Font: Clash Display, 44px, white
Subtext: "Most apps make you feel guilty. MoneyViya makes you feel capable."
Color: #94A3B8, 18px

PAIN POINT CARDS (2x2 grid desktop, 1 column mobile):
Each card has: Problem icon (red-ish) → Pain statement → How Viya fixes it (green)

Card 1:
Icon: 📱 (crossed out complex app)
Pain (red text): "Finance apps feel like homework"
Solution (green): "MoneyViya lives in WhatsApp. Just chat."
Visual: Side-by-side — cluttered app screenshot vs clean chat

Card 2:
Icon: 🗣️
Pain: "Everything is in English, nothing makes sense"
Solution: "Viya speaks Tamil, Hindi, Telugu, Kannada, English"
Visual: Speech bubble in Tamil script

Card 3:
Icon: 📊
Pain: "I know I should save. I forget, then feel ashamed."
Solution: "Morning nudges. Evening check-ins. Zero judgment."
Visual: Friendly notification preview

Card 4:
Icon: 💸
Pain: "I can't afford a financial advisor"
Solution: "AI-powered advice. Free forever."
Visual: Comparison — "CA: ₹5,000/hour" vs "MoneyViya: ₹0"

CARD STYLE:
bg: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.08)
radius: 16px
padding: 32px
Hover: border-color = rgba(0,168,107,0.4), subtle green glow

SCROLL ANIMATION:
Cards stagger in from bottom as user scrolls (50px translateY → 0, 300ms, stagger 100ms)

TRANSITION OUT:
Section bottom has a clean curve/wave divider into the next (white) section
```

---

### Screen: How It Works Section

```
=== UI/UX PROMPT: LANDING PAGE — HOW IT WORKS ===

[Paste Design System first]

SECTION PURPOSE: Remove fear of complexity. Show that starting is effortless. Demonstrate value in 3 steps.

LAYOUT: White background, centered, 3-step horizontal flow (desktop) / vertical (mobile)

HEADLINE (centered):
"Start in 60 seconds."
Subheadline: "No forms. No downloads. No complexity."
Color: #1E293B

3-STEP VISUAL FLOW:

Step connector: Dashed green line connecting all 3 steps (desktop only)

STEP 1:
Number badge: Large "1" in green circle (48px)
Icon: WhatsApp logo icon, 48px
Title: "Say Hi on WhatsApp"
Description: "Scan the QR code or click the button. Viya greets you immediately."
Visual: QR code (real) + "or tap to open" button
Micro-detail: Small "🔒 Your data is encrypted" trust badge

STEP 2:
Number badge: "2"
Icon: Chat bubble icon, 48px
Title: "Tell Viya about yourself"
Description: "Answer 10 quick questions in your language. Takes less than 2 minutes."
Visual: Snippet of onboarding chat (name question, language selection)
Micro-detail: "Available in 5 languages"

STEP 3:
Number badge: "3"
Icon: Sparkle/magic icon, 48px
Title: "Your financial plan, instantly"
Description: "Viya creates a personalized plan and starts managing your money."
Visual: Screenshot of the financial plan message in WhatsApp
Micro-detail: "₹0 cost to start"

CONNECTING ARROWS (desktop):
Animated dashed line that draws from left to right when section enters viewport
Color: #00A86B, stroke-dasharray animation

BOTTOM CTA:
Large centered green button: "Begin My Financial Journey →"
Below: "Free forever • No credit card • Cancel anytime"

TRUST SECTION (below CTA):
Row of trust logos: "Secured by" [Bank-grade encryption badge] [WhatsApp Business API badge] [DPDP Compliant badge]
```

---

### Screen: Social Proof / Testimonials

```
=== UI/UX PROMPT: LANDING PAGE — TESTIMONIALS SECTION ===

[Paste Design System first]

SECTION PURPOSE: Convert skeptics. Use real-sounding, specific, diverse voices. Users should recognize themselves in the testimonials.

CRITICAL DESIGN CHOICE: Show ACTUAL WhatsApp screenshots as testimonials (not card quotes). This is authentic, impossible to fake, and drives massive trust.

LAYOUT: bg=#F8FAFB, full width, 80px vertical padding

HEADLINE:
"Real conversations. Real results."
Style: H2, centered, #1E293B

TESTIMONIAL FORMAT — "WhatsApp Screenshot Cards":
Each card is designed to look like a WhatsApp chat export:
- Phone frame (light grey)
- WhatsApp header (contact name, green dot "online")
- Actual conversation snippet (user message + Viya response)
- Result callout below: "₹22,000 saved in 3 months"

TESTIMONIAL 1 — Meena (Homemaker, Chennai):
Header: "Meena T. ✓" / "Homemaker, Chennai"
Language badge: "Tamil"
Chat snippet:
  Meena: "வீட்டு செலவு 2000 ரூபாய்"
  Viya: "✅ ₹2,000 மளிகை சேமித்தது! இந்த மாதம் நீங்கள் ₹3,200 சேமித்தீர்கள் 🎉"
Result badge (gold): "Family saved ₹18,000 in 2 months 🏆"
Stars: ★★★★★

TESTIMONIAL 2 — Rahul (College Student, Bhopal):
Header: "Rahul K." / "Engineering Student, Bhopal"
Language badge: "Hindi"
Chat:
  Rahul: "bhai aaj 300 barbaad ho gaye"
  Viya: "Haha Rahul, ₹300 logged! 😄 Aaj ka budget: ₹450 bacha hai. Kal wapas on track!"
Result badge: "Cleared ₹15,000 college debt in 5 months"
Stars: ★★★★★

TESTIMONIAL 3 — Divya (Freelancer, Bengaluru):
Header: "Divya R." / "UX Freelancer, Bengaluru"
Language badge: "English"
Chat:
  Divya: "Received payment 25000 from client"
  Viya: "🎉 ₹25,000 income logged! 
         Tax set aside: ₹7,500 (30%)
         Goal allocation: ₹5,000 → Laptop fund
         Free to spend: ₹12,500"
Result badge: "Started first SIP ₹2,000/month"
Stars: ★★★★★

LAYOUT: Horizontal scrollable carousel (mobile) / 3-column grid (desktop)
Card animation: Cards tilt slightly on hover (rotate3d, 2deg)
Auto-scroll: Slow auto-scroll on mobile with pause on interaction

STATS BAR (below testimonials):
4 numbers in a row, large mono font:
"50,000+ Users" | "₹12 Crore Saved" | "4.9★ Rating" | "5 Languages"
Each number counts up from 0 when scrolled into view (JavaScript countUp animation)
Dividers between each stat
bg: white, border-top and border-bottom: 1px solid #E1E8EE
```

---

### Screen: Pricing Section

```
=== UI/UX PROMPT: LANDING PAGE — PRICING ===

[Paste Design System first]

SECTION PURPOSE: Make Free feel generous. Make Pro feel obviously worth it. Remove all friction from starting free.

PRICING PSYCHOLOGY:
- Lead with "Free forever" prominently — builds trust
- Pro pricing anchored against alternatives: "Less than 1 cup of tea per day"
- Annual plan is the push: "₹799/year = Save ₹389"
- No hidden costs, no credit card for free tier

LAYOUT: 2 cards, centered, white bg
Desktop: Side by side | Mobile: Stacked

TOGGLE: Monthly / Yearly (pill toggle, green for selected)
When yearly selected: Show savings badge on Pro card "Save ₹389 🎉"

FREE CARD:
Header chip: "Start Here"
Title: "Viya Free"
Price: "₹0" / "Forever"
Price style: Large, #1E293B, mono font

Feature list (checkmarks in green):
✅ Unlimited expense tracking
✅ 2 active goals
✅ Daily & weekly summaries
✅ WhatsApp-native
✅ 5 language support
✅ Basic market updates

CTA: Secondary button "Start Free — No Card Needed"
Card style: Border 2px solid #E1E8EE, subtle

PRO CARD (FEATURED — visually dominant):
Header: "Most Popular" badge (green pill, top-right of card)
Background: Gradient from #00A86B to #007A4E (green)
All text: White
Title: "Viya Pro"
Price: "₹99/month" or "₹799/year" (toggle)
Below price: "Less than ₹3/day"

Feature list (all from free PLUS):
✅ Everything in Free
⭐ Unlimited goals
⭐ Personalized investment advice
⭐ Family sharing (4 members)
⭐ Tax estimation & reports
⭐ PDF financial reports
⭐ Receipt scanning
⭐ Priority support
⭐ Custom budget categories

CTA: White button with green text "Start 14-Day Free Trial"
No credit card text: Small, below button "No credit card required"
Card style: Elevated shadow, slightly larger than Free card

COMPARISON NOTE (below cards):
"🤔 Not sure? Start with Free and upgrade anytime. Your data always moves with you."

BUSINESS TIER (simple text mention below cards):
"For freelancers & small businesses: Viya Business at ₹499/month →" [link]
```

---

### Screen: FAQ Section + Final CTA

```
=== UI/UX PROMPT: LANDING PAGE — FAQ + FINAL CTA ===

[Paste Design System first]

FAQ SECTION:
bg: white
Headline: "Questions we get a lot"
Style: Left-aligned, conversational

8 FAQs in accordion style:
Each: Click to expand, smooth height animation (300ms ease)
Icon: + rotates to × on expand

Q1: "Is my financial data safe?"
A: "Your data is encrypted end-to-end. We never see your bank passwords. MoneyViya stores only what you share in chat — your income, expenses, and goals. DPDP compliant."

Q2: "Do I need to download anything?"
A: "No. MoneyViya lives inside WhatsApp. You already have it."

Q3: "Will it work in my language?"
A: "Yes. MoneyViya speaks Tamil, Hindi, Telugu, Kannada, and English. Type in any of these languages — Viya understands."

Q4: "Is this really free?"
A: "Yes. The free plan has everything you need to start tracking. Pro is optional for advanced features."

Q5: "I'm not good with finance. Will I understand this?"
A: "That's exactly who MoneyViya is built for. If you can chat on WhatsApp, you can use MoneyViya."

Q6: "What if my income is irregular?"
A: "MoneyViya handles irregular income — freelancers, farmers, business owners all use it."

Q7: "Does MoneyViya give investment advice?"
A: "Viya gives personalized financial guidance based on your risk profile and goals. For large investments, we always recommend verifying with a registered advisor."

Q8: "Can my family also use it?"
A: "Pro plan includes family sharing for up to 4 members. Shared budgets, individual privacy."

Accordion design:
Border-bottom: 1px solid #E1E8EE between items
Question: 18px, weight=600, #1E293B
Answer: 16px, #475569
Padding: 24px 0 per item

FINAL CTA SECTION:
bg: Deep navy (#0F172A)
Padding: 96px

Center-aligned:
Large emoji: 💬 (64px)
H2: "Your financial advisor is waiting."
Subtext: "Free. WhatsApp. Your language."
Primary CTA (large, full-width on mobile): "Open MoneyViya on WhatsApp →"
Below: Language options row: "हिंदी • தமிழ் • తెలుగు • ಕನ್ನಡ • English"
Small text: "Join 50,000+ people managing money smarter"

FOOTER:
Minimal. Two rows.
Row 1: Logo + "Made with ❤️ in India"
Row 2: Privacy Policy | Terms | Contact | © 2026 MoneyViya
bg: #0F172A (continues from CTA section)
text: #94A3B8
```

---

## PART 3: USER DASHBOARD — THE DAILY DRIVER

```
=== UI/UX PROMPT: MONEYVIYA WEB DASHBOARD ===

[Paste Design System first]

DASHBOARD PURPOSE: The web dashboard is VIEW-ONLY (all actions happen in WhatsApp). Its purpose is to give users a beautiful visual overview of their financial health that WhatsApp cannot provide. Think: "Financial health at a glance."

WHO USES THIS: A user who just had their morning WhatsApp briefing and wants to see their charts on a bigger screen. Or a user showing their spouse their financial progress.

LAYOUT ARCHITECTURE (Desktop):

LEFT SIDEBAR (240px, fixed):
- MoneyViya logo (top)
- User avatar + name + health score badge
- Navigation:
  🏠 Overview (default)
  💸 Transactions
  🎯 Goals
  📈 Investments
  📋 Reports
  ⚙️ Settings
- Bottom: "Open WhatsApp" floating button (green, sticky)

MAIN CONTENT AREA (flexible width):

TOP BAR:
- Greeting: "Good morning, Ravi 👋" (time-aware)
- Date: "Tuesday, 17 Feb 2026"
- Right: Notification bell + "Connect WhatsApp" status (green dot if connected)

SECTION 1: THE FINANCIAL HEALTH CARD (full-width, top)
Design: Large card, gradient bg (#00A86B → #007A4E), white text
Content:
- LEFT: Health Score circular gauge (0-100)
  Center number: "73" (large, JetBrains Mono, white)
  Label: "Financial Achiever 💪"
  Outer ring: Animated progress circle, white on transparent green
- CENTER: 3 quick stats
  "💰 ₹4,200 Saved This Month" | "🎯 2 Goals On Track" | "🔥 14 Day Streak"
- RIGHT: Month progress bar
  "February: 17 of 28 days"
  Budget used: "₹12,400 / ₹18,000 (69%)"
  Progress bar: white on green, animated

SECTION 2: OVERVIEW CARDS ROW (4 cards, equal width)

Card 1 — Monthly Income:
Icon: ↓ arrow (green)
Label: "Income This Month"
Value: "₹25,000" (large, green, mono)
Sub: "Salary received ✓"
Trend: "+₹2,000 vs last month"

Card 2 — Monthly Spending:
Icon: ↑ arrow (orange)
Label: "Spent This Month"
Value: "₹12,400" (large, #1E293B, mono)
Sub: "68% of budget used"
Progress micro-bar: Visual of 68%

Card 3 — Savings:
Icon: Piggy bank (green)
Label: "Saved This Month"
Value: "₹4,200" (green, mono, celebrated font size)
Sub: "Target: ₹5,000"
Trend: "83% of target 🎯"

Card 4 — Investments:
Icon: Graph up (gold)
Label: "Portfolio Value"
Value: "₹28,500" (gold, mono)
Sub: "+₹1,200 this month"
Trend: "+4.4% ↑" in green

Card interaction: Hover → translateY(-4px) + shadow upgrade

SECTION 3: TWO-COLUMN LAYOUT

LEFT COLUMN (60%):

SPENDING BREAKDOWN CHART:
Card with title "Where did your money go?"
Chart: Donut chart (not pie — donut is more modern)
Categories with amounts:
  🍛 Food & Dining: ₹3,200 (25.8%)
  🏠 Housing: ₹8,000 (64.5%)
  🚗 Transport: ₹650 (5.2%)
  🎬 Entertainment: ₹400 (3.2%)
  💊 Health: ₹150 (1.2%)
Color each segment distinctly (no two adjacent same color)
Legend below chart: Each category chip clickable (filters transaction list)
Center of donut: Total ₹12,400

SPENDING TREND LINE CHART (below donut):
"Daily spending — Last 30 days"
Line chart: Green line, soft green fill below
X-axis: Dates (abbreviated)
Y-axis: ₹ amounts (Indian format)
Dotted red line: Daily budget target (₹857/day)
Interactive: Hover tooltip showing exact amount + category breakdown for that day
Annotation: "Salary Day" marker on 1st, "Weekend" shading on Sat/Sun

RIGHT COLUMN (40%):

GOALS TRACKER:
Title: "Your Goals"
"+ Add Goal" button (top right of card, small, secondary)

Each goal item:
[Icon] [Goal Name] [Amount] [Deadline]
Progress bar (full width, animated)
Below bar: "₹X saved of ₹Y • Z days left"

Goal 1: 🏍️ Buy Bike
₹12,000 of ₹80,000
Progress: 15% [▓▓░░░░░░░░]
"268 days left • ₹568/day needed"
Status chip: "On Track ✅"

Goal 2: 🎓 Education Loan
₹8,500 of ₹2,00,000 paid
Progress: 4.25%
"4 years 8 months left"
Status chip: "In Progress"

Goal 3: 🛡️ Emergency Fund
₹50,000 of ₹54,000
Progress: 93% [▓▓▓▓▓▓▓▓▓░]
Status chip: "Almost There! 🎯"
Celebrate animation when >90%: Subtle gold shimmer on progress bar

"Set via WhatsApp" note at bottom of card (guides user to action)

RECENT TRANSACTIONS (below goals):
Table style with alternating row backgrounds
Columns: Date | Description | Category chip | Amount
Last 10 transactions
Category chips: Colored (food=orange, transport=blue, etc.)
Amount: Green for income, red for expenses
"View All →" link at bottom

SECTION 4: MARKET PULSE (if user opted in)
Collapsed by default, expand with arrow
Shows: NIFTY, SENSEX, BankNifty with mini sparkline charts
Recommendation banner: "Viya's Pick Today: Start Nifty 50 SIP"
"Details in WhatsApp →" CTA

MOBILE DASHBOARD (390px):
- No sidebar — bottom tab navigation (5 tabs with icons + labels)
- Cards stack single column
- Charts use horizontal scroll to see full view
- Each section collapsible to save scroll
- Sticky header with health score chip always visible
```

---

## PART 4: ONBOARDING WEB COMPANION (If user starts on web)

```
=== UI/UX PROMPT: ONBOARDING FLOW — WEB VERSION ===

[Paste Design System first]

CONTEXT: Some users will land on the website before WhatsApp. This flow gets them to WhatsApp while capturing their details. It's a bridge, not a barrier.

OVERALL LAYOUT:
Split screen (desktop): Left=Progress & branding | Right=Current step content
Single column (mobile): Progress bar at top, content below

LEFT PANEL (fixed, 40%):
bg: Gradient #00A86B → #007A4E
White text throughout

- MoneyViya logo (top)
- Current step indicator (animated step circles 1-5)
- LIVE PREVIEW: Shows what their WhatsApp will look like as they fill info
  (Fake chat preview updates in real-time as user types name, income, etc.)
- Trust statement: "Encrypted • Private • Free"
- Bottom: User count "47,829 people already managing money with Viya"

RIGHT PANEL (scrollable, 60%):
Clean white, generous padding

STEP 1: LANGUAGE
"Let's start. Which language feels like home?"
5 large language buttons (full width, icon + language name in that language):
  🇮🇳 हिंदी — Hindi
  🇮🇳 தமிழ் — Tamil
  🇮🇳 తెలుగు — Telugu
  🇮🇳 ಕನ್ನಡ — Kannada
  🇬🇧 English
Button style: 64px height, border=2px #E1E8EE, radius=12px
Selected: border=#00A86B, bg=#E8F9F2, checkmark icon appears

STEP 2: NAME
"What should Viya call you?"
Single text input (large, 56px height)
Placeholder: "Your name"
Below: "Used only to personalize your messages. Not shared."
Auto-advance when user types + hits enter

STEP 3: OCCUPATION
"What do you do?"
6 option cards in 2x3 grid:
  👨‍💼 Salaried Employee
  🎓 Student  
  💻 Freelancer
  🏪 Business Owner
  🏠 Homemaker
  👴 Retired
Cards: 80px height, icon + label, select with tap

STEP 4: INCOME RANGE (slider approach — not a text field)
"Approximately how much do you earn monthly?"
Slider with income brackets:
  Under ₹10,000
  ₹10,000–₹25,000
  ₹25,000–₹50,000
  ₹50,000–₹1 Lakh
  Above ₹1 Lakh
"Prefer not to say" option
Reassurance: "This helps Viya give relevant advice. We never share this."
Slider design: Green track, gold thumb, current value displayed above thumb

STEP 5: PRIMARY GOAL
"What's your biggest financial dream?"
Goal options as visual cards with illustrations:
  🏠 Buy a Home
  🚗 Buy a Vehicle
  🎓 Education (self or child)
  🌴 Travel & Experiences
  🛡️ Build Emergency Fund
  💰 Start Investing
  💳 Clear Debt
  Other (text input)

Estimated amount and timeline sliders appear on selection

STEP 6: REDIRECT TO WHATSAPP
"Your personalized plan is ready! Open WhatsApp to receive it."

Visual: Large checkmark animation (green, particle burst)
Summary card showing what was collected (reassuring transparency)
Big button: "📱 Open MoneyViya on WhatsApp"
→ Opens WhatsApp with pre-filled message: "Hi Viya! I'm [name], ready to start."

Below button: "Or scan this QR code"
[QR Code — large, centered]

PROGRESS BAR:
Top of right panel, thin (4px), green, animated fill
Shows current step / total steps
Step dots below bar: Small circles, filled for completed, ring for current, empty for future

TRANSITION BETWEEN STEPS:
Slide direction: Right → Left (like turning pages)
Duration: 250ms, cubic-bezier ease
Back button: Always visible, ghost style

FORM VALIDATION:
Inline, real-time (not on submit)
Error: Red border + icon + specific message below field
Success: Green checkmark appears in input when valid
```

---

## PART 5: MOBILE APP — PWA (Progressive Web App)

```
=== UI/UX PROMPT: MONEYVIYA MOBILE WEB (PWA) ===

[Paste Design System first]

PURPOSE: A mobile-optimized version of the dashboard that users can "Add to Home Screen." Feels like a native app without App Store friction.

CORE MOBILE UX PRINCIPLES FOR THIS APP:
1. Thumb-zone design: Primary actions in bottom 40% of screen
2. One primary action per screen — no decision paralysis
3. Swipe gestures for navigation (not just taps)
4. Bottom sheet pattern for secondary actions (not modals)
5. Large touch targets (minimum 48×48px, prefer 56×56px)
6. Numbers always mono font, large (financial data must be SCANNABLE)

BOTTOM NAVIGATION BAR:
Fixed, 80px height (safe area aware for iPhone notch)
5 tabs: Home | Transactions | Goals | Invest | Profile
Active tab: Green icon + green label, slight scale-up (1.1)
Inactive: Gray icon, no label
Tab indicator: Small green dot above active icon (not underline)
Background: White with top border 1px #E1E8EE

MOBILE HOME SCREEN:

HEADER:
Gradient green, 140px tall (extends behind status bar)
Left: "Good morning, Ravi" + date
Right: Notification bell (white)
Centered on gradient: Health Score chip "💪 73 — Achiever"

SCROLLABLE CONTENT BELOW HEADER:

QUICK ACTIONS ROW (sticky, just below header):
Horizontal scroll, 4 action chips:
  💬 Chat Viya | 📊 Balance | 🎯 Goals | 📋 Report
Chip style: White, radius=100px, shadow, 44px height
These open the WhatsApp chat pre-typed with the command

TODAY'S SNAPSHOT CARD:
Large card, white, rounded (24px top corners only — card appears to float over gradient)
Top: "Today — 17 Feb"
3 metrics horizontal:
  Income: ₹0 | Spent: ₹500 | Budget Left: ₹357
Progress bar: "Daily budget: 58% used" 

GOALS HORIZONTAL SCROLL:
"Your Goals" header with "See All →"
Horizontal scroll of goal cards (peek of next card shows there are more):
Each card: 
  Goal icon (large, 40px)
  Goal name
  Progress percentage (big, mono)
  Progress arc (circular)
  Days remaining (small, gray)
Card width: 160px, height: 200px
bg: White, shadow, radius: 16px
Active goal card: Thin green border

RECENT TRANSACTIONS LIST:
"Recent" header
Last 5 transactions, card style:
  [Category icon] [Description + time] [Amount right-aligned]
  Icon bg: Light tint of category color (food=light orange, etc.)
  Positive amount: Green, Negative: #1E293B (not red — avoids anxiety for normal spending)
  ONLY show red for over-budget items
Tap to expand transaction details (bottom sheet animation)

BOTTOM SHEET (transaction details):
Slides up from bottom, 60% screen height
Drag handle at top
Shows: Category, amount, date, notes
Action buttons: "Edit Category" | "Flag as Recurring"
Background behind sheet: 40% dark overlay

SWIPE GESTURES:
Left swipe on transaction → Shows "Delete" action (red bg, trash icon)
Right swipe on transaction → Shows "Add Note" action (blue bg, note icon)
Swipe down on bottom sheet → Dismisses

PULL TO REFRESH:
Custom animation: MoneyViya logo spins, "Syncing with Viya..." text
Duration: 1.5s, then content updates

LOADING STATES:
Skeleton screens (not spinners) — white cards with shimmer animation
Matches exact layout of loaded content
Shimmer: Light gray gradient moving left to right, 1.5s loop
```

---

## PART 6: SPECIFIC UI COMPONENTS — COMPONENT LIBRARY PROMPTS

### The Financial Number Display

```
=== COMPONENT PROMPT: FINANCIAL NUMBER DISPLAYS ===

Create a reusable component system for displaying financial numbers in MoneyViya.

LARGE AMOUNT DISPLAY (hero numbers — main balance, total savings):
- Font: JetBrains Mono, 48px desktop / 36px mobile
- Color: Context-based (green for positive/savings, #1E293B for neutral, red for deficit)
- Currency symbol (₹): 60% size of number, vertically aligned top
- Lakhs separator: Always Indian format (₹1,50,000)
- K abbreviation: For charts only (₹45K)
- Animation: Count up from 0 on first load (800ms, ease-out)
- Decimal: Show 2 decimal places only when relevant (not for rounded goals)

MEDIUM AMOUNT (card stats, transaction list):
- Font: JetBrains Mono, 24px
- Same color rules
- No animation (appears instantly)

SMALL AMOUNT (table rows, secondary stats):
- Font: JetBrains Mono, 16px, weight=500

PERCENTAGE DISPLAY:
- Always show arrow: ↑ for positive (green), ↓ for negative (red)
- Format: "+4.2%" or "-1.8%"
- Context chip: "vs last month" in gray, 12px

PROGRESS PERCENTAGE (goal progress):
- Large: 48px mono, centered in circular progress
- Shows X% with no decimal
- Circle: SVG arc, animated on load (draws from 0 to value)
- Color: Green <75%, Gold 75-99%, Celebration at 100%

NUMBER REDACTION (privacy mode):
- Toggle: Eye icon in header hides all numbers
- Hidden state: "••••••" in same font size
- Smooth transition: blur(4px) animation when toggling
```

---

### The Goal Progress Card

```
=== COMPONENT PROMPT: GOAL CARD COMPONENT ===

Design the Goal Card component used in dashboard, mobile app, and goal detail page.

SIZES: Small (list item), Medium (dashboard card), Large (detail page)

MEDIUM GOAL CARD (160×200px):
Container: White, radius=16px, shadow=card, padding=20px

TOP SECTION:
Goal emoji/icon: 40×40px, centered in colored circle
  — Bike goal: 🏍️ on light green circle
  — Home goal: 🏠 on light blue circle
  — Education: 🎓 on light purple circle
Goal name: 14px, weight=600, #1E293B, 2 lines max (ellipsis)
Days remaining chip: "268 days" — pill, gray bg, 12px

MIDDLE SECTION:
Circular progress arc (SVG):
  Size: 80px diameter
  Track: #E1E8EE, strokeWidth=8
  Progress: #00A86B, strokeWidth=8, rounded caps (linecap=round)
  Center text: "15%" — 20px mono, bold, green
  Animation: Draw arc from 0 to value on enter (800ms, cubic-bezier)

Special states:
  >75%: Gold color on arc (#FFB703) — "almost there"
  100%: Full green → celebration particle burst → badge "ACHIEVED 🎉"

BOTTOM SECTION:
"₹12,000 of ₹80,000" — 12px mono, #475569
Mini linear progress bar (full width, 4px height)

HOVER STATE:
Scale: 1.02, shadow upgrade, green border appears (1px)
Shows tooltip: "Tap to see full details"

CLICK: Expands to LARGE GOAL CARD (detail view):
Monthly contribution history bar chart
Projected achievement date
"Add Money" button (redirects to WhatsApp: "Add 500 to bike goal")
Milestone markers on timeline

ACHIEVEMENT ANIMATION:
Confetti burst (canvas-based, green + gold particles)
Trophy emoji scales from 0 to 120% to 100% (bounce)
Sound (optional, if user has sound enabled): Achievement chime
```

---

### The Celebration System

```
=== COMPONENT PROMPT: MONEYVIYA CELEBRATION SYSTEM ===

Design the visual celebration system for milestones, achievements, and wins.

CELEBRATION LEVELS:

MICRO (daily win — inline, non-blocking):
Toast notification slides in from top-right
Size: 320px wide, 64px tall
Content: Icon + message (no button)
Duration: 3 seconds, then slides out
Design: White, green left border (4px), shadow
Example: "✅ 7-day streak! Keep going!"
Animation: Slide in (from right, 200ms) → stay → slide out (300ms)

SMALL (weekly/first achievements — bottom sheet):
Slides up 40% of screen (not full screen — user can still see context)
Drag handle at top
Content: Large emoji (64px), title, description, achievement badge
One action button: "Share my win 🎉" or "Keep Going →"
Background: Light confetti (CSS-based, low performance impact)
Duration: User-dismissed or 8 seconds

MEDIUM (goal milestone — modal):
Full-center modal, 400px width
Strong shadow, white card
Header: Gold gradient strip at top
Content: Achievement badge (circular, gold border), title, progress update
Two buttons: "Tell a Friend" | "Set Next Milestone"
Backdrop: Green-tinted overlay (rgba 0,168,107,0.2)
Confetti: JavaScript canvas, 3-second burst

BIG (goal achieved — full page takeover):
Full screen overlay, deep green bg
Large centered animation (Lottie: trophy with particles)
User's name in large text: "RAVI, YOU DID IT! 🏆"
Goal achieved details
Shareable card preview (auto-generated WhatsApp-share image)
Main CTA: "Share Your Achievement" (WhatsApp share pre-formatted)
Secondary: "Set Next Goal →"
Duration: Auto-dismiss after 10s or user taps

CONFETTI SYSTEM (reusable):
Particles: Mix of ₹ symbols, ⭐, 🎯, sparkles
Colors: Primary green, gold, white
Physics: Gravity, slight left/right drift, rotation
Performance: Max 80 particles, requestAnimationFrame, auto-cleanup after 4s
Trigger: CSS class .celebrate on parent → confetti spawns

STREAK CELEBRATION (special case):
Milestone streaks: 7, 14, 21, 30, 60, 100 days
Fire emoji 🔥 grows in size with streak number
7 days: Normal small celebration
30 days: Medium celebration
100 days: Epic full-screen with special badge "Centurion Saver 💎"
```

---

## PART 7: DESIGN DECISIONS RATIONALE (For Stakeholders & Developers)

```
=== SENIOR UX REASONING: WHY THESE CHOICES ===

1. WHY GREEN AS PRIMARY COLOR:
   Green = Growth + Money + Trust (universal)
   Avoids: Purple (overused in fintech), Blue (too banking/cold)
   Warm gold accent = Achievement + Premium (avoids green monotony)
   Research: Green CTAs outperform blue by 21% in finance (ConversionXL)

2. WHY WHATSAPP-FIRST (NO NATIVE APP):
   Play Store friction: 40% of Tier 2/3 users abandon at download step
   Storage anxiety: "My phone is full" kills installs
   Familiarity: WhatsApp has 95%+ awareness in target market
   Trust: Users trust WhatsApp more than unknown apps
   Cost: No App Store fees, no update friction for users

3. WHY MONO FONT FOR NUMBERS:
   Financial data scannability: Proportional fonts cause eye-tracking errors
   Numbers like ₹1,58,432 are misread 3x more in proportional fonts
   Mono creates visual alignment in tables and lists
   Trust signal: Feels precise and professional (like a bank terminal)

4. WHY SKELETON LOADERS OVER SPINNERS:
   Perceived performance: Skeletons feel 40% faster (Nielsen Norman)
   Layout stability: User's eye pre-adjusts to content location
   Anxiety reduction: Shows "something is coming" vs spinner's ambiguity

5. WHY INDIAN NUMBER FORMAT (₹1,50,000 not ₹150,000):
   Target audience reads Indian format natively
   Western format causes 0.5-second confusion per number — across a dashboard this adds up
   Trust: Shows product was made for Indians, not localized from Western product

6. WHY NO SOCIAL LOGIN:
   Target audience trust issue: "Why does a money app need my Google account?"
   Privacy-first design: Phone + WhatsApp is already their identity
   Simplicity: Removes OAuth complexity for users

7. WHY VIEW-ONLY DASHBOARD:
   Reduces cognitive load: One place for visuals, one for actions
   Prevents dangerous actions on web (no accidental goal deletion)
   Forces WhatsApp engagement (keeps daily active user habit in chat)
   Security: Web dashboard is read-only = lower security surface area

8. WHY BOTTOM NAVIGATION (MOBILE):
   Thumb zone: Bottom is reachable with thumb on 6+ inch phones
   Industry standard: WhatsApp, Instagram, Gmail all use bottom nav
   Google HIG: Recommends bottom nav for 3-5 destinations

9. WHY LARGE TOUCH TARGETS (56px+):
   India device context: Often used one-handed, in transit, in sunlight
   Accessibility: Fat-finger error rate drops 73% with 48px+ targets (MIT Touch Lab)
   Meena Test: Homemaker using phone while cooking needs forgiving targets

10. WHY GRADIENT ON PRIMARY CARD:
    Hierarchy: Green gradient immediately signals "most important"
    Warmth: Gradient feels less corporate than flat color
    Differentiation: WhatsApp is flat — our dashboard should feel richer
```

---

## PART 8: ACCESSIBILITY & INCLUSIVE DESIGN PROMPTS

```
=== PROMPT: ACCESSIBILITY AUDIT CHECKLIST ===

Every screen in MoneyViya must pass:

VISUAL:
☐ All text contrast ≥4.5:1 against background (check green-on-white carefully)
☐ Interactive elements contrast ≥3:1 (buttons, inputs)
☐ Never use color as ONLY indicator (always add icon or text)
☐ All icons have aria-label
☐ Text never below 14px (16px preferred)
☐ Disabled states clearly visible (not just opacity reduction)

MOTOR:
☐ All tap targets ≥48×48px (log all smaller elements and fix)
☐ No actions require double-tap (single tap activates)
☐ Swipe gestures have button alternatives
☐ No time-limited interactions (celebration timeouts allow "don't dismiss")
☐ Focus order is logical (Tab key test on desktop)

COGNITIVE:
☐ Max 1 primary action per screen
☐ Error messages are specific ("₹ amount required" not "invalid input")
☐ Loading states always present for >300ms async operations
☐ No auto-playing audio
☐ Confirmation dialogs before destructive actions (delete goal)

LANGUAGE & LITERACY:
☐ All UI text is simple (max Grade 6 reading level in English)
☐ Numbers always include context ("₹4,200 saved" not just "4,200")
☐ Avoid jargon — test every label with a non-finance user
☐ Icons always paired with text labels (never icon-only for key actions)
☐ Translated strings don't overflow layout (Tamil + Telugu can be 40% longer)

DEVICE:
☐ Works on 320px wide screen (smallest Android)
☐ Works on 2G connection (assets <100KB each)
☐ Works without JavaScript (graceful degradation for key content)
☐ Safe area padding for iPhone notch and Android gesture nav bar
☐ prefers-reduced-motion respected (disable animations)
☐ Images have alt text
☐ Form labels connected to inputs (not just visually close)
```

---

## PART 9: ERROR STATES & EMPTY STATES

```
=== PROMPT: MONEYVIYA ERROR & EMPTY STATE DESIGN ===

PRINCIPLE: Every empty or error state should be an opportunity to guide users to action, not a dead end.

EMPTY STATES (when no data exists):

EMPTY — No Transactions (new user):
Illustration: Friendly character holding a shopping bag, looking curious
Title: "Your first expense is waiting to be logged"
Body: "Just chat with Viya: 'Spent 200 on lunch'"
CTA: "Open WhatsApp →" (green button)
Tone: Inviting, not empty/broken

EMPTY — No Goals:
Illustration: Character looking at a horizon with stars
Title: "What are you saving for?"
Body: "Tell Viya your dream: 'I want to buy a bike for ₹80,000'"
CTA: "Set My First Goal →"

EMPTY — No Investments:
Illustration: Small plant growing in a pot
Title: "Your money could be growing"
Body: "Even ₹500/month in a SIP can change your future. Ask Viya how."
CTA: "Ask Viya About Investing →"
Tone: Encouraging, not intimidating

ERROR STATES:

NETWORK ERROR:
Icon: Cloud with X (not a scary warning triangle)
Title: "Can't connect right now"
Body: "Check your internet and try again"
CTA: "Try Again" button (primary)
Sub: "Your data is safe"
Tone: Calm, reassuring

DATA LOAD FAILURE:
Same as network error but: "Some data couldn't load. Showing last saved version."
Partial data still shows where available

AUTHENTICATION ERROR (session expired):
Redirect to login, but:
Don't clear what they were trying to do
After login, return them to that page
Message: "Your session expired. Logged in again 👍" (not "Error 401")

404 PAGE:
Illustration: Lost character with a map
Title: "This page took a wrong turn"
Body: "Let's get you back on track"
CTA: "Go to Dashboard" + "Chat with Viya"
Viya mascot says: "भाई, ये page तो नहीं मिला! But your money is safe 😄"
(Language switches based on user preference)

ALL EMPTY/ERROR STATES MUST:
☐ Have an illustration (not just text)
☐ Have a single clear action
☐ Never say "Error", "Fail", or "Invalid" to the user
☐ Reflect brand voice (friendly, not corporate)
☐ Include Viya's voice where appropriate
```

---

> **Senior UX Sign-off:** The screens and components above are designed around one truth: financial anxiety is real, and good design reduces it. Every shadow, every color, every word choice, every animation has been specified with the user's emotional state in mind. Build with this intent and MoneyViya won't just be used — it'll be loved.

---
*MoneyViya UI/UX Design System v1.0 — Designed for 500 Million Indians* 🇮🇳
