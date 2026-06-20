# VIYA AI — ENTERPRISE-GRADE SAAS UPGRADE
## Complete End-to-End Product Engineering Prompt
## For Claude Opus 4.6 / Antigravity — Full Stack Implementation Guide

---

> **DIRECTIVE:**
> You are a senior full-stack product engineer with 12+ years building
> enterprise SaaS products at scale (Stripe, Notion, Linear quality level).
> You are upgrading Viya AI from a functional MVP into a premium,
> enterprise-grade, globally scalable platform.
> This document is your complete implementation blueprint.
> Execute every section with production-grade thinking.
> No placeholders. No "TBD". Every decision is final and justified.

---

## SECTION 1: VISION AND SCOPE

### 1.1 Product Vision Statement

```
WHAT WE ARE BUILDING:
Viya AI is the world's most intelligent personal life operating system —
a platform that combines financial intelligence, health management,
email automation, proactive reminders, and AI-driven life coaching
into one deeply personalized, always-on assistant.

Available on: iOS App Store + Google Play Store + WhatsApp Bot
Architecture: Cloud-native, mobile-first, AI-native

THE UPGRADE GOAL:
Transform from a working MVP into a premium platform that:
  - Retains users for 18+ months (vs industry avg 3 months)
  - Converts 15% of free users to paid (vs industry avg 3-5%)
  - Handles 10M+ daily active users without degradation
  - Passes enterprise security audits (SOC 2 Type II readiness)
  - Generates ₹100 Crore ARR within 24 months
```

### 1.2 Core Value Proposition

```
FOR INDIVIDUAL USERS:
  Primary: "Your entire life, organized and improving — automatically"
  Proof points:
    - Zero late bill payments (system prevents them)
    - Zero missed birthdays or appointments (memory never fails)
    - Measurable financial improvement (avg ₹8,200 saved/month)
    - Better health outcomes (70% medicine adherence vs 50% avg)

FOR PREMIUM USERS (₹149/month):
  - Unlimited AI queries (vs 50/day free)
  - Family mode (4 members)
  - Investment portfolio intelligence
  - Tax optimization recommendations
  - Priority email processing (<5 min vs 15 min free)
  - Advanced analytics exports

FOR ENTERPRISE (₹999/user/month):
  - Custom AI agents for business workflows
  - Team shared reminders and task management
  - HR integrations (attendance, leaves, expenses)
  - Custom branding
  - SLA: 99.9% uptime guarantee
  - Dedicated account manager
```

### 1.3 KPI Targets

```
ACTIVATION METRICS (First 7 days):
  - Day 1 active: 80% of signups (target vs 60% current)
  - First expense logged: <3 minutes from signup
  - Email connected: 60% of users by Day 3
  - First WhatsApp message sent: 70% by Day 2
  - Onboarding completion: 85% (vs 65% current)

ENGAGEMENT METRICS (Ongoing):
  - DAU/MAU ratio: 65% (class-leading, WhatsApp is 85%)
  - Sessions per day: 4+ (3 WhatsApp + 1 app open)
  - Messages sent to Viya: 8+ per day per active user
  - Feature depth: Users use 3+ modules by Day 30

RETENTION METRICS:
  - Day 7 retention: 55% (vs 35% current)
  - Day 30 retention: 40% (vs 22% current)
  - Day 90 retention: 32% (vs 15% current)
  - 12-month retention: 25% (best-in-class for finance apps)

REVENUE METRICS:
  - Free-to-paid conversion: 12% by Month 6, 18% by Month 12
  - Average Revenue Per User (ARPU): ₹89/month (blended free+paid)
  - Monthly Recurring Revenue: ₹10 Crore by Month 12
  - LTV/CAC ratio: >3x
  - Churn rate: <3% monthly

GROWTH METRICS:
  - Viral coefficient (K-factor): >0.4 (each user brings 0.4 new users)
  - Referral conversion: 25% of invited users sign up
  - App Store rating: 4.7+ (iOS) / 4.6+ (Android)
  - NPS score: 60+ (excellent)
```

### 1.4 Target User Personas and Journeys

```
PERSONA 1 — METRO PROFESSIONAL "Rahul"
  Demographics: 26-35, Tier 1 city, ₹8-20 LPA income
  Goals: Financial freedom, organized life, career growth
  Pain: Scattered apps, missed bills, no investment clarity
  
  ACTIVATION JOURNEY:
    Hour 0: Downloads after friend's WhatsApp status share
    Hour 0.5: Onboards (language → phone → connect Gmail → interests)
    Hour 1: Logs first expense via WhatsApp "swiggy 450"
    Day 1: Viya detects HDFC bill in Gmail, alerts user
    Day 2: User accepts meeting invite through Viya
    Day 7: Sees "7-day streak" — habit formed
    Day 30: First monthly wealth report — shares to WhatsApp status
    Month 3: Converts to Premium for investment tracking

PERSONA 2 — HOMEMAKER "Priya"
  Demographics: 28-40, managing family finances
  Goals: Family coordination, health, budget management
  Pain: Remembering everyone's schedule, medicines, school fees
  
  ACTIVATION JOURNEY:
    Hour 0: Husband shares Viya after his positive experience
    Hour 1: Sets up family mode, adds husband + 2 kids
    Day 1: Adds all family medicines with reminders
    Day 3: Connects husband's bank (AA framework) for full picture
    Week 2: Uses meal planning for family diet
    Month 2: Becomes household finance manager through Viya
    Month 4: Recommends to 5 friends (viral source)

PERSONA 3 — FREELANCER "Arjun"
  Demographics: 25-38, irregular income, self-employed
  Goals: Tax compliance, invoice management, financial stability
  Pain: GST tracking, client invoices, inconsistent budgeting
  
  ACTIVATION JOURNEY:
    Hour 0: Finds Viya through CA's recommendation
    Day 1: Connects multiple bank accounts (freelance + personal)
    Week 1: Viya auto-categorizes client payments vs personal
    Month 1: Invoice reminder system set up for 3 clients
    Month 3: Tax projection report generated automatically
    Month 6: Files ITR using Viya's organized data export
```

---

## SECTION 2: ARCHITECTURE AND TECH STACK

### 2.1 Architecture Decision: Modular Monolith → Microservices

```
RECOMMENDATION: Start with Modular Monolith, extract services progressively

RATIONALE:
  Current stage: 0 → 1M users
  Microservices premature: Adds ops complexity before product-market fit
  Modular monolith: Fast iteration + clean boundaries + extractable later
  
  MODULES (logical separation within monolith):
    core/           — Auth, users, subscriptions, settings
    email/          — Gmail/Outlook sync, email intelligence
    finance/        — Transactions, budgets, investments, bills
    health/         — Steps, sleep, diet, medicines
    intelligence/   — AI agents, context building, memory
    notifications/  — Push, WhatsApp, email, SMS delivery
    calendar/       — Events, reminders, tasks
    analytics/      — Usage, cohorts, funnel
    admin/          — Dashboard, user management, ops tools

EXTRACTION TIMELINE:
  Phase 1 (0-1M users): Single deployable monolith
  Phase 2 (1-5M users): Extract email_sync and ai_agents (highest load)
  Phase 3 (5M+ users): Extract notifications, analytics, finance
  
  WHY NOT MICROSERVICES FROM DAY 1:
    - No distributed transactions needed early
    - Deployment complexity kills small teams
    - Debugging distributed systems requires mature observability
    - 80% of microservices benefits come from good module boundaries
    - Monolith can scale to 10M users with proper DB and caching
```

### 2.2 Complete Technology Stack

```
FRONTEND:
  Mobile App:    React Native 0.73 + Expo SDK 50
  UI Rendering:  React Native Reanimated 3 (animations)
  Navigation:    React Navigation 6 + Expo Router
  State:         Zustand (global) + TanStack Query (server state)
  Local DB:      WatermelonDB (offline-first, SQLite backed)
  Cache:         MMKV (fast key-value, replaces AsyncStorage)
  Forms:         React Hook Form + Zod validation
  Charts:        Victory Native + D3.js (complex visualizations)
  Testing:       Jest + React Native Testing Library + Detox (E2E)
  
  WHY EXPO:
    - OTA updates without App Store review (critical for quick fixes)
    - Unified iOS/Android build pipeline
    - Native modules available for everything we need
    - EAS Build for CI/CD

BACKEND:
  Language:      Python 3.11+ (ML ecosystem + async)
  Framework:     FastAPI (async, OpenAPI auto-docs, Pydantic v2)
  Task Queue:    Celery + Redis (background jobs)
  Email Service: FastAPI routes + Gmail/Outlook OAuth
  WebSockets:    FastAPI + Redis Pub/Sub (real-time)
  
  WHY FASTAPI OVER DJANGO/FLASK:
    - Native async (critical for AI API calls without blocking)
    - Auto-generated OpenAPI docs (team velocity)
    - Pydantic validation (type safety, better than manual validation)
    - 3-5x faster than Flask for I/O-bound workloads
    - Built-in dependency injection (clean, testable)

DATABASE:
  Primary:       PostgreSQL 16 (ACID, complex queries, JSON support)
  Extensions:    pgvector (AI embeddings), TimescaleDB (time-series health data)
  Cache:         Redis 7 (sessions, rate limiting, queues, pub/sub)
  Search:        PostgreSQL FTS + pgvector (semantic search)
  Files:         Cloudflare R2 (receipts, documents, avatars)
  
  PARTITION STRATEGY:
    transactions partitioned by month (hot data access pattern)
    health_logs partitioned by user_id hash (even distribution)
    conversations kept 90 days rolling (cost management)

AUTHENTICATION:
  Protocol:      OTP (phone) + OAuth 2.0 (Google/Apple)
  Tokens:        JWT (short-lived 60min access) + Redis-backed refresh
  Session:       Stateless JWT, refresh rotation on each use
  2FA:           TOTP (Google Authenticator) for premium/enterprise
  Biometric:     Device biometric via Expo LocalAuthentication

AI/ML:
  Primary LLM:   Anthropic Claude API (claude-opus-4-5 and claude-haiku-4)
  Embeddings:    Voyage AI (voyage-3 model, 1024 dimensions)
  Voice:         Whisper API (transcription)
  Vision:        Claude Vision (receipt OCR, food scanning)
  Routing:       Custom 4-tier cost optimizer (regex → haiku → sonnet → opus)

MESSAGING:
  WhatsApp:      Meta Business API + 360Dialog (reliability layer)
  SMS:           Twilio + MSG91 (India) dual-provider failover
  Push:          Firebase Cloud Messaging (Android + iOS)
  Email:         Resend (transactional) + AWS SES (bulk)
  In-App:        Custom notification system via WebSocket/polling

ANALYTICS:
  Product:       PostHog (open-source, self-hostable, GDPR compliant)
  Errors:        Sentry (full stack: mobile + backend)
  Performance:   Datadog APM (traces, metrics, logs)
  Business:      Metabase (internal dashboard, SQL-based)
  A/B Testing:   Posthog feature flags (same tool, less fragmentation)

INFRASTRUCTURE:
  Cloud:         AWS (primary) + Cloudflare (CDN, DNS, DDoS)
  Container:     Docker + AWS ECS Fargate (serverless containers)
  IaC:           Terraform (all infrastructure as code)
  CI/CD:         GitHub Actions + EAS Build (mobile)
  Secrets:       AWS Secrets Manager + HashiCorp Vault
  Monitoring:    Datadog + PagerDuty (alerting + on-call)
```

### 2.3 API Gateway and Service Architecture

```
API GATEWAY LAYER:
  Tool: AWS API Gateway + CloudFront
  
  Responsibilities:
    - Rate limiting (per user, per endpoint, per IP)
    - Request authentication (JWT validation)
    - Request/response logging
    - SSL termination
    - Geographic routing (India → Mumbai region)
    - DDoS protection via AWS WAF + Cloudflare
    - Response caching for read-heavy endpoints

REQUEST FLOW:
  Client → Cloudflare (DDoS/CDN) 
         → AWS API Gateway (auth, rate limit) 
         → Application Load Balancer 
         → ECS Fargate Tasks 
         → PostgreSQL / Redis / External APIs

ENVIRONMENT STRATEGY:
  development  → Local Docker Compose
  staging      → AWS (smaller instance, real integrations, sanitized data)
  production   → AWS (auto-scaling, multi-AZ, full monitoring)
  
  Feature flags gate production access to unreleased features
  Blue-green deployments for zero-downtime releases

API VERSIONING:
  URL-based: /api/v1/, /api/v2/
  Headers: X-API-Version for minor variations
  Deprecation: 6-month sunset period, warning headers on deprecated endpoints
  Breaking changes: Major version bump only, never in place
```

### 2.4 CI/CD Pipeline

```
PIPELINE STAGES:

ON PULL REQUEST:
  1. Lint (ruff for Python, ESLint for RN)
  2. Type check (mypy, TypeScript strict)
  3. Unit tests (pytest, Jest) — must pass 100%
  4. Integration tests against test DB
  5. Security scan (Snyk, Bandit)
  6. Coverage check (must maintain >80%)
  7. Build Docker image
  8. Deploy to preview environment

ON MERGE TO MAIN:
  1. All PR checks re-run
  2. E2E tests (Detox for mobile, Playwright for web)
  3. Load test (k6) against staging
  4. Security scan + SAST
  5. Deploy to staging
  6. Smoke tests on staging
  7. Slack notification: "Staging deployed ✅"

ON RELEASE TAG:
  1. All above checks
  2. Database migration dry-run
  3. Manual approval gate (product + engineering sign-off)
  4. Blue-green deployment to production
  5. Canary: 5% traffic → 25% → 100% over 30 minutes
  6. Automated rollback if error rate >1%
  7. Mobile: Submit to TestFlight / Internal Testing
  8. PagerDuty quiet hours (no Friday afternoon releases)
```

---

## SECTION 3: FRONTEND — UI/UX AND FEATURES

### 3.1 Premium UI/UX Goals

```
THE STANDARD WE'RE BUILDING TO:
  Visual Quality:  Linear (sleek, fast, purposeful)
  Animation Feel:  Stripe (smooth, meaningful, never decorative)
  Information:     Notion (dense but organized)
  Delight Factor:  Duolingo (celebrates wins, builds habit)
  India Context:   Zepto (speed, local context, WhatsApp-native)

CORE UI PRINCIPLES:

SPEED IS DESIGN:
  Every screen must answer its primary question in <2 seconds
  No screen has more than 3 required actions visible
  Most-used actions are always 1 tap away
  App cold start: <2.5 seconds to interactive

EMOTIONAL DESIGN:
  Money screens: Emerald/gold tones → feel of abundance
  Health screens: Warm gradients → feel of energy
  Alert screens: Coral/amber → urgency without fear
  Achievement screens: Gold explosion → pure dopamine

INDIAN-FIRST AESTHETICS:
  Colors that evoke celebration (not corporate)
  Festival-themed overlays (Diwali, Holi, Dussehra)
  Regional script support from day 1 (not an afterthought)
  Indian number formatting mandatory everywhere
  UPI as primary, cards as secondary

MICRO-INTERACTION PHILOSOPHY:
  Every tap: Has haptic feedback (light/medium/heavy contextually)
  Every state change: Has animation (but under 300ms)
  Every achievement: Has celebration (disproportionate to trigger)
  Every error: Has recovery action (never just shows error)
  Every loading state: Has skeleton (never blank)
```

### 3.2 Key Pages and Components

```
PAGE 1: ONBOARDING (First impression — make it count)

DESIGN BRIEF:
  4 screens, 90 seconds total, 0 mandatory fields except phone
  Collect data lazily (ask when relevant, not upfront)
  Get user to their "AHA moment" in <5 minutes
  
  Screen 1: Language selection (India-first, warm illustration)
  Screen 2: Phone + OTP (fastest possible, SMS auto-read)
  Screen 3: Connect services (Gmail primary, rest optional)
  Screen 4: First interaction (get them using it NOW)
  
  IMPORTANT: 
    No income questions upfront (feels intrusive)
    No "import your data" steps (too much friction)
    First AHA moment: Viya detects something from Gmail
    
COMPONENTS TO BUILD:
  <OnboardingProgress> — Animated dot progress, spring transitions
  <LanguageGrid> — 2×3 grid, animated selection
  <PhoneInputCompound> — Country picker + number + validation
  <OTPBoxRow> — 6 individual boxes with auto-advance
  <ServiceConnectionCard> — OAuth flow trigger with success state
  <FirstChatPrompt> — Viya introduces herself, 3 quick-start buttons

─────────────────────────────────────────────────

PAGE 2: HOME DASHBOARD (Used daily — highest polish priority)

DESIGN BRIEF:
  The nerve center. Answers "What needs my attention today?" instantly.
  Scroll depth: Most users shouldn't need to scroll past 3rd section
  Personalized: Changes based on time of day and user state
  
  SECTIONS (in priority order):
    A. Sticky header (greeting + search + alerts)
    B. Daily Brief card (hero — today's prioritized items)
    C. Quick action grid (8 most-used actions)
    D. Email alert strip (only if urgent emails exist)
    E. Wealth snapshot (net worth + trend)
    F. Active goals row (horizontal scroll)
    G. Health today (steps + calories cards)
    H. Upcoming bills (max 3)
    
  STATES TO HANDLE:
    New user (no data yet): Welcome + guide to connect
    No urgent items: "All clear for today! 🎉" celebration
    Many urgent items: Prioritized list, "Handle all" CTA
    Offline: Cached data with "Last updated" badge

COMPONENTS TO BUILD:
  <DailyBriefCard> — Gradient hero, animated item list
  <QuickActionGrid> — 2×4, personalized gradient on top tile
  <EmailAlertStrip> — Horizontal scroll, urgent/meeting/delivery cards
  <WealthSnapshot> — Gradient card, sparkline, account pills
  <GoalCard> — Progress bar with milestone markers, mini version
  <HealthPairCards> — Steps + Calories side-by-side
  <BillRow> — Color-coded urgency, inline pay button
  <FABWithRadial> — Breathing animation, radial menu on long press

─────────────────────────────────────────────────

PAGE 3: VIYA CHAT (The core product experience)

DESIGN BRIEF:
  Must feel like WhatsApp — familiar, fast, personal
  Viya's messages: Smarter than expected, warmer than anticipated
  User's messages: Effortless to send (voice/text/image all equal)
  
  MESSAGE TYPES (all must be visually distinct):
    Plain text
    Action card (Viya did something)
    Insight card (Viya noticed something)
    Email summary card
    Rich data card (charts, tables)
    Goal progress card
    Celebration card (achievement)
    Warning card (urgent alert)
    
  INPUT BAR STATES:
    Empty: Shows voice button (primary action)
    Typing: Shows send button (replaces voice)
    Voice recording: Full-screen overlay
    Processing: Typing indicator appears

COMPONENTS TO BUILD:
  <ChatMessageList> — FlatList, inverted, optimized
  <ViyaTextBubble> — Base bubble, all variants extend
  <ViyaActionCard> — Success state, with undo
  <ViyaInsightCard> — Proactive, with action buttons
  <ViyaRichDataCard> — Mini charts embedded in chat
  <ViyaCelebrationCard> — Triggers confetti overlay
  <UserTextBubble> — Gradient, right-aligned
  <UserVoiceBubble> — Waveform visualization
  <VoiceRecorderOverlay> — Full screen, amplitude-reactive orb
  <QuickRepliesBar> — Contextual, slide-up, horizontal scroll
  <ChatInputBar> — Compound: attach + input + voice/send

─────────────────────────────────────────────────

PAGE 4: EMAIL INTELLIGENCE (Killer feature — drives premium conversion)

DESIGN BRIEF:
  Not an email client. A smart filter that shows ONLY what matters.
  Users should see this and think "How did I live without this?"
  
  TAB STRUCTURE:
    Action (urgent items needing response)
    Meetings (calendar invites to accept/decline)
    Finance (bills, investments, transactions)
    Orders (deliveries, packages)
    All (full list with filters)
    
  CARD DESIGN HIERARCHY:
    Critical (due today): coral border, full extraction shown
    Important (action needed): viya border, extraction shown
    Informational: compact, collapsed by default
    Auto-archived: Just count shown ("24 archived")

COMPONENTS TO BUILD:
  <EmailIntelligenceFeed> — Tabbed list with pull-to-refresh
  <BillEmailCard> — Full extraction: amounts, dates, pay buttons
  <MeetingEmailCard> — Extraction + calendar conflict check
  <DeliveryEmailCard> — Package tracking embed
  <InvestmentEmailCard> — SIP/portfolio extraction
  <PromoEmailSummary> — Collapsed, count-only
  <EmailActionButtons> — Contextual based on email type
  <EmailSettingsPanel> — Connected accounts, filter rules

─────────────────────────────────────────────────

PAGE 5: WEALTH MANAGEMENT (Premium showcase)

TABS: Overview | Transactions | Goals | Investments | Bills & EMIs

OVERVIEW TAB:
  Net worth hero card with sparkline
  Monthly spending donut chart (interactive, tap segment)
  Financial timeline (upcoming events)
  Viya wealth insight (AI-generated, refreshed daily)

TRANSACTIONS TAB:
  Search + filter bar (category, date, amount range)
  Grouped by date (Today, Yesterday, This Week, Older)
  Each: Category icon + merchant + amount + payment method
  Swipe left: Edit / Delete
  Pull down: Refresh from AA/bank

GOALS TAB:
  Active goals with progress bars + milestones
  Milestone markers at 25%, 50%, 75%, 100%
  Add money quick action inline
  Goal completion celebration trigger

INVESTMENTS TAB:
  Total portfolio value + returns + XIRR
  Grouped: Mutual Funds / Stocks / FD / PPF / NPS
  Each fund: Sparkline + key metrics
  Viya alerts: Underperforming, rebalancing needed, FD maturity

BILLS & EMIs TAB:
  Color-coded calendar (overdue/due-soon/upcoming/paid)
  Subscription audit section ("Cancel wasteful subscriptions")
  EMI tracker with closing date projections
  Auto-debit list

─────────────────────────────────────────────────

PAGE 6: HEALTH COMMAND CENTER

TABS: Today | Week | Month | Insights

TODAY TAB:
  Health score ring (0-100, gradient stroke)
  Four pillars grid (Steps/Sleep/Water/Calories)
  Meals section (breakfast/lunch/dinner/snacks + log button)
  Food scanner (camera → AI identification → nutrition)
  Medicine schedule (due/taken/upcoming with inline actions)
  Mood check-in (evenings only, emoji selector)

FOOD SCANNER FLOW:
  Camera opens → Bounding box identifies food in real-time
  Bottom panel: "Identified: Masala Dosa · 320 kcal"
  Confirmation + quantity edit → Logged
  If wrong: Search food database instead

COMPONENTS TO BUILD:
  <HealthScoreRing> — SVG ring, gradient stroke, animated
  <HealthPillar> — Steps/Sleep/Water/Calories variants
  <MealSection> — Day's meals, log/scan/suggest
  <FoodScannerCamera> — Overlay with real-time detection
  <MealNutritionBreakdown> — Macros chart
  <MedicineSchedule> — Timeline with taken/due/upcoming
  <MedicineDueAlert> — Prominent, amber, inline action
  <MoodEmojiSelector> — 6 moods, haptic, with journal

─────────────────────────────────────────────────

PAGE 7: ADMIN DASHBOARD (Internal tool — ops team uses daily)

PURPOSE: Monitor health of system + manage users + handle support

SECTIONS:
  Overview metrics (DAU, MAU, revenue, errors, latency)
  User management (search, filter, view profile, manage plan)
  AI agent activity (cost per user, agent performance)
  Email sync status (success rate, failed syncs, retry queue)
  Notification delivery (delivery rates by channel)
  Subscription management (upgrades, cancellations, refunds)
  Feature flag management (toggle features by % of users)
  System health (API latency, error rate, queue depths)
  
COMPONENTS TO BUILD:
  <MetricCard> — Value + trend + spark + comparison to target
  <UserTable> — Searchable, filterable, action column
  <AgentCostChart> — Cost breakdown by tier, daily trend
  <NotificationFunnel> — Sent → Delivered → Opened → Acted
  <SystemHealthGrid> — Service status, latency p50/p95/p99
  <FeatureFlagPanel> — Toggle + rollout % + affected users
  <AlertRulesConfig> — PagerDuty alert threshold management
```

### 3.3 Accessibility Standards

```
WCAG 2.1 AA COMPLIANCE (Mandatory):

CONTRAST:
  All body text: 4.5:1 minimum
  Large text (18px+): 3:1 minimum
  Interactive elements: 3:1 for boundaries
  Test with: axe DevTools, manual testing with APCA calculator
  
  GOTCHA: Brand teal (#00E5B0) on white = 1.8:1 (FAILS)
  FIX: Use --viya-700 (#008B6A) for text on light backgrounds
  Brand teal only used for: Borders, icons, fills (not text)

TOUCH TARGETS:
  Minimum: 44×44pt iOS / 48×48dp Android (accessibility guidelines)
  Recommended: 56px for primary actions
  Spacing: 8px minimum between adjacent targets
  Exception rule: Grouped radio/checkbox can be smaller if group is large

SCREEN READER:
  React Native: Uses accessibility props directly
  Required on: ALL images (accessibilityLabel)
  Required on: ALL icons (accessibilityLabel + accessibilityRole)
  Required on: Charts (accessibilityValue with text summary)
  Dynamic content: accessibilityLiveRegion="polite"
  Focus order: Logical reading order always maintained
  
MOTION SENSITIVITY:
  Check: RN's AccessibilityInfo.isReduceMotionEnabled
  If true: Remove all entrance animations, parallax, particles
  Keep: Instant state changes, opacity fades (functional only)
  Keep: Haptics (not visual, unaffected)
  
FONT SCALING:
  Support iOS Dynamic Type (all font categories)
  Support Android Font Scale up to 1.3x
  Test at: Largest accessibility size
  No: Text clipping, overlap, or truncation at scale

COLOR INDEPENDENCE:
  Never convey information with color alone
  Always pair: Color + Icon + Label
  Example: Red bill = [🔴] + "Overdue" text (not just red color)
```

### 3.4 Performance Budgets

```
MOBILE APP PERFORMANCE BUDGETS:

JS Bundle:
  Main bundle: <2MB (gzipped)
  Per-screen lazy bundle: <200KB
  No unnecessary polyfills (target modern devices)

Startup:
  Cold start (no cache): <2.5 seconds to interactive
  Warm start: <0.8 seconds to interactive
  Splash → Home: <1.5 seconds after auth check

Runtime:
  Frame rate: 60fps minimum (no dropped frames during scroll/animation)
  Animation: All on UI thread via Reanimated (not JS thread)
  Memory: <150MB steady-state, <200MB peak
  
Network (on 4G — Indian average 15Mbps):
  API first response: <500ms
  Data visible (skeleton → real): <800ms
  Full page load: <1.5 seconds

Images:
  Format: WebP (60% smaller than PNG/JPG)
  Avatars: <50KB, optimized at upload
  Illustrations: SVG/Lottie JSON (never raster)
  Icons: SF Symbols (iOS) / Material Symbols (Android) — zero download

PERFORMANCE MONITORING:
  React Native Performance Monitor (development)
  Flipper (profiling, network inspection)
  Firebase Performance (production tracking)
  Alert if: Cold start >3s or frame rate <55fps in production
```

### 3.5 Offline Support

```
OFFLINE-FIRST ARCHITECTURE:

LOCAL DATABASE (WatermelonDB):
  Persists: 
    Last 7 days of transactions (read-only offline)
    All active goals and progress
    All active reminders and tasks
    Last 50 chat messages
    Health logs for current week
    Active medicines and today's schedule
    Email action items (last sync)
    
  Write queue:
    Expense logs → queue → sync when online
    Reminder creation → local first → sync
    Medicine taken → local → sync
    Chat messages → queue → send when online

SYNC CONFLICT RESOLUTION:
  Rule: Server wins for data it generates (AI responses, email extractions)
  Rule: Client wins for user-entered data (expenses, reminders, health logs)
  Rule: Latest timestamp wins for preference updates
  Rule: Logical merge for lists (tasks, shopping lists)

USER EXPERIENCE WHEN OFFLINE:
  Banner: "No internet — changes will sync when connected" (amber, top)
  All screens: Show cached data (never blank)
  Timestamps: Show "Last updated [time]" on each section
  Actions: Show "Will sync when online" confirmation
  Critical: Balance shows — not "Error loading data"
  
WHAT FAILS GRACEFULLY OFFLINE:
  Viya chat: "Viya will respond when you're back online"
  Email sync: "Showing emails from last sync"
  Investment prices: "Showing prices from [date]"
  WhatsApp: Device handles independently (always works)
```

### 3.6 Theming System

```
DESIGN TOKENS (All values sourced from token system):

TOKEN CATEGORIES:
  color.*         — All color values
  typography.*    — Fonts, sizes, weights, line heights
  spacing.*       — All spacing values
  radius.*        — Border radii
  shadow.*        — All shadow definitions
  animation.*     — Duration, easing, spring configs
  zIndex.*        — Layering hierarchy
  breakpoint.*    — Screen size breakpoints

TOKEN IMPLEMENTATION (React Native):
  Store in: constants/tokens.ts
  Access via: useTheme() hook
  Changes via: ThemeProvider context
  
  const { colors, typography, spacing } = useTheme();
  // Returns correct values for light/dark mode

THEME MODES:
  light: Default, high contrast, white backgrounds
  dark:  Deep backgrounds, reduced eye strain (cosmos palette)
  auto:  Follows system setting (Appearance.colorScheme)
  
  DARK MODE SPECIFICS:
    Background layers: 4 depth levels (bg → s1 → s2 → s3)
    Brand colors: Same saturation (never dim brand teal in dark)
    Shadows: Convert to glow effects (outward glow, not shadow)
    Borders: Slightly lighter than background (visible but subtle)
    Text: 3 levels (primary/secondary/tertiary opacity)

FESTIVAL THEMES (Seasonal feature):
  Diwali (Oct-Nov): Gold sparkle accents, diya icons, warm gradients
  Holi (Mar): Colorful splashes on celebration moments
  New Year (Jan): Fireworks on goal achievements
  These overlay brand colors (don't replace) — opt-in by user
```

### 3.7 UX Flows — Critical Paths

```
FLOW 1: ONBOARDING COMPLETION
Target: 85% completion rate, <90 seconds

Steps:
  Language → Phone → OTP → Connect Gmail (optional) → Interests → Complete
  
Friction removal:
  SMS auto-read: Auto-fills OTP (0 typing)
  Gmail: Pre-authorized button (1 tap, no form)
  Skip: Available on every screen except Phone
  Progress: Clear dots showing position
  
Post-completion:
  Viya sends first WhatsApp message within 30 seconds
  App shows "Welcome, [Name]! Here's what I found..." with first insight

─────────────────────────────────────────────────

FLOW 2: UPGRADE TO PREMIUM
Target: 12% conversion within 3 months

Trigger points (smart, not annoying):
  After 3rd "feature locked" encounter
  After first goal milestone (emotional high)
  After monthly report (shows value already delivered)
  After email detects a bill due (shows intelligence)
  
Upgrade screen:
  Show personalized value: "In 30 days, Viya saved you ₹8,200"
  Show what premium adds specifically for this user
  1-tap upgrade with Razorpay/UPI
  14-day free trial (remove barrier)
  Confirmation: "Welcome to Premium! 🎉" celebration
  
Anti-patterns to avoid:
  No paywalls on critical safety features (medicine reminders)
  No "upgrade" prompts in moments of user stress
  No dark patterns (pre-checked, confusing pricing)

─────────────────────────────────────────────────

FLOW 3: PERMISSION REQUESTS
Target: 75% accept rate for each permission

Strategy: Ask in context, explain value, never ask more than once on rejection

SMS Permission (Android):
  Context: User just set up first bank account
  Message: "To auto-track expenses from bank SMS, allow SMS reading.
            Only financial SMS is read — nothing personal."
  If denied: Show manual logging option, don't ask again
  
Notification Permission:
  Context: User creates first reminder
  Message: "To send you this reminder, allow notifications.
            Viya sends max 3 notifications per day."
  If denied: Offer WhatsApp as alternative
  
Camera Permission:
  Context: User taps "Scan Food" or "Scan Receipt"
  Message: Implied by feature (no additional prompt needed)
  System prompt appears naturally in-context

─────────────────────────────────────────────────

FLOW 4: REMINDER COMPLETION FLOW
Goal: 80% action rate on reminders (vs 15% industry avg for push)

Reminder delivery order:
  1. WhatsApp message (80% read rate, 50% action rate)
  2. Push notification (5% open rate — backup only)
  3. In-app banner when user opens app (if not handled)
  4. Follow-up WhatsApp after 2 hours if unacknowledged

Reminder message format:
  Context-aware (includes relevant data)
  Binary choice (Done / Remind in 1hr)
  Deep link back to relevant screen
  Never asks same reminder more than 3 times before removing

─────────────────────────────────────────────────

FLOW 5: FAILED ACTION RECOVERY
Goal: 90% of failed actions offer a clear next step

NETWORK ERROR:
  During: "Saving..." (optimistic UI — looks like it worked)
  On fail: Toast: "Couldn't save — will retry automatically"
  Retry: 3 times with exponential backoff
  Final fail: "Tap to retry" button on the item

PAYMENT FAILED:
  Immediate: "Payment didn't go through — no charge was made"
  Options: [Try different payment] [Try again] [Cancel]
  Context: Show specific reason if available (insufficient funds, etc.)
  
AI API TIMEOUT:
  During: "Viya is thinking..." (typing indicator)
  At 5s: "Taking a bit longer than usual..."
  At 10s: "Viya is taking too long. [Show simplified response]"
  Simplified: Rule-based fallback, not blank

EMPTY STATES (Never just blank):
  No transactions: "Log your first expense — tap the + button above"
  No goals: "What are you saving for? [Create first goal →]"
  No emails connected: "Connect Gmail to see email intelligence [Connect →]"
  No health data: "Track your health starting today [Log now →]"
```

---

## SECTION 4: BACKEND, APIS, AND DATA FLOWS

### 4.1 API Design Principles

```
PROTOCOL: REST (primary) with GraphQL consideration for future
WHY REST OVER GRAPHQL:
  Mobile apps have predictable data needs (no N+1 problem)
  REST is simpler to cache (CDN caching works natively)
  GraphQL adds complexity without mobile benefit at our stage
  REST is easier to rate-limit and monitor per-endpoint
  Reconsider GraphQL at Phase 3 for complex admin dashboard needs

API DESIGN RULES:

RESOURCE NAMING:
  Nouns, plural, lowercase: /transactions, /goals, /reminders
  Nested for ownership: /users/:id/transactions (max 2 levels)
  Actions as sub-resources: /bills/:id/mark-paid (not /payBill)
  
HTTP METHODS USED:
  GET:    Read (idempotent, cacheable)
  POST:   Create + non-idempotent actions
  PUT:    Full replace (idempotent)
  PATCH:  Partial update (idempotent)
  DELETE: Soft delete only (set deleted_at, never hard delete data)

RESPONSE ENVELOPE:
  ALL responses wrap in:
  {
    "success": true/false,
    "data": {}, // The actual payload
    "meta": {   // Pagination, rate limits, timing
      "page": 1,
      "per_page": 20,
      "total": 145,
      "request_id": "uuid",
      "took_ms": 45
    },
    "error": {  // Only on success: false
      "code": "BILL_NOT_FOUND",
      "message": "Human readable message",
      "field": "bill_id"  // For validation errors
    }
  }

PAGINATION:
  Cursor-based for lists (not offset — consistent with real-time updates)
  Parameters: ?cursor=<base64_cursor>&limit=20
  Response includes: next_cursor, has_more
  Max limit: 100 items per request (enforced server-side)

VERSIONING:
  URL path: /api/v1/, /api/v2/
  Current: v1 (stable), v2 in development
  Deprecation: 6 months notice, X-Deprecated-API header
  Breaking changes: New major version only

RATE LIMITING:
  Default: 200 requests/hour per user
  Chat endpoint: 50 messages/hour (AI cost protection)
  Auth endpoints: 5/minute (brute force protection)
  Admin endpoints: 1000/hour
  Headers returned: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  429 response: Includes retry_after in body

IDEMPOTENCY:
  All POST requests accept Idempotency-Key header
  Store idempotency keys in Redis (24hr TTL)
  Return same response if duplicate key within TTL
  Critical for: payment processing, transaction logging

ERROR CODES:
  Format: SCREAMING_SNAKE_CASE, domain-prefixed
  Examples:
    AUTH_INVALID_TOKEN
    AUTH_TOKEN_EXPIRED
    AUTH_PHONE_RATE_LIMITED
    FINANCE_TRANSACTION_NOT_FOUND
    FINANCE_BUDGET_EXCEEDED
    EMAIL_SYNC_FAILED
    AI_RATE_LIMIT_EXCEEDED
    PLAN_FEATURE_NOT_AVAILABLE
```

### 4.2 Authorization Model

```
AUTHORIZATION: RBAC + Plan-Based Access Control

ROLES:
  user:           Standard registered user
  premium_user:   Paid subscriber
  enterprise_user: Enterprise plan member
  admin:          Internal Viya team
  super_admin:    Can modify any data (audit-logged)

PLAN-BASED FEATURE FLAGS:
  Feature access stored in PostgreSQL, cached in Redis
  
  Free Plan:
    max_goals:              3
    ai_messages_per_day:    50
    email_accounts:         1
    bank_accounts:          2
    family_members:         1 (self only)
    ai_model:               haiku (fast, cheap)
    report_export:          false
    tax_planning:           false
    investment_ai:          false
    
  Premium Plan (₹149/month):
    max_goals:              unlimited
    ai_messages_per_day:    500
    email_accounts:         3
    bank_accounts:          unlimited
    family_members:         4
    ai_model:               sonnet (powerful)
    report_export:          true (PDF)
    tax_planning:           true
    investment_ai:          true
    priority_email_sync:    true (5min vs 15min)
    
  Enterprise Plan (₹999/user/month):
    Everything in Premium
    ai_messages_per_day:    unlimited
    ai_model:               opus (most powerful)
    team_sharing:           true
    custom_agents:          true
    api_access:             true
    sla_uptime:             99.9%
    dedicated_support:      true

MIDDLEWARE PATTERN (Backend):
  @router.get("/goals")
  @require_auth                    # Validates JWT
  @require_plan(min_plan="free")   # Checks plan access
  @rate_limit(limit=200)           # Applies rate limit
  async def list_goals(user: CurrentUser):
      goals = await goals_service.list(user.id)
      return response(goals)

TENANT AWARENESS (for future enterprise multi-tenancy):
  user_id tied to organization_id
  All queries include WHERE organization_id = ?
  Row-level security in PostgreSQL as additional safety layer
  Separate Redis key namespacing per organization
```

### 4.3 Background Jobs and Scheduling

```
JOB SYSTEM: Celery + Redis (reliable, battle-tested)

JOB CATEGORIES:

SCHEDULED JOBS (cron-like):
  
  email_sync_job:
    Frequency: Every 15 minutes per user with email connected
    Priority: Medium
    Retry: 3 times, exponential backoff (1min, 5min, 15min)
    Alert if: >5% failure rate
    
  morning_brief_job:
    Frequency: Once daily at user's local 7:30 AM
    Priority: High
    Data: Emails + bills + goals + health + reminders
    Delivery: WhatsApp message + in-app notification
    
  proactive_check_job:
    Frequency: Every hour, all active users (batched by 1000)
    Priority: Low
    Function: Check all 12 trigger conditions
    Output: Insert into proactive_messages queue
    
  investment_price_update:
    Frequency: Daily at 3:35 PM IST (after NSE market close)
    Priority: Low
    Data: All stock prices + MF NAVs
    
  subscription_audit_job:
    Frequency: First Sunday of each month
    Priority: Low
    Function: Check usage vs spend for each subscription
    
  weekly_report_job:
    Frequency: Every Sunday at 7 PM local time
    Priority: Medium
    Output: PDF report + WhatsApp summary

  reminder_delivery_job:
    Frequency: Every minute (polling reminders table)
    Priority: Critical
    Function: Find reminders due in next 5 minutes, queue delivery
    Reliability: Must not miss reminders (Redis sorted set pattern)

EVENT-DRIVEN JOBS (triggered by user actions):
  
  on_email_received:
    Trigger: Gmail push notification webhook
    Job: Classify email → extract data → create alert if needed
    SLA: <2 minutes from email received to user notified
    
  on_salary_received:
    Trigger: Large income transaction detected
    Job: Send salary allocation suggestion
    Timing: Immediate (don't wait for morning brief)
    
  on_goal_milestone:
    Trigger: goal.current_amount crosses milestone threshold
    Job: Send celebration message + create share moment
    
  on_bill_overdue:
    Trigger: Bill due date passed, status still pending
    Job: Escalate alert (1 WhatsApp → push notification)
    Frequency: Once overdue, alert every 24 hours until resolved

RETRY POLICY STANDARD:
  Attempt 1: Immediate
  Attempt 2: 1 minute delay
  Attempt 3: 5 minutes delay
  Attempt 4: 30 minutes delay
  Attempt 5: 2 hours delay
  After 5 failures: Dead letter queue → alert ops team
  
JOB MONITORING:
  Flower (Celery web UI) for job inspection
  Custom metrics: jobs_enqueued, jobs_completed, jobs_failed, avg_duration
  Alert: PagerDuty if queue depth >10,000 or failure rate >5%
```

### 4.4 Notification System

```
MULTI-CHANNEL NOTIFICATION ARCHITECTURE:

CHANNELS (Priority order):
  1. WhatsApp Business API    (80% read rate — primary)
  2. In-app notifications     (100% delivery if app open)
  3. Push (FCM)               (5-10% open rate — backup)
  4. SMS (Twilio/MSG91)       (High delivery, last resort)
  5. Email (Resend)           (Transactional only: receipt, upgrade)

DELIVERY GUARANTEE PATTERN:
  
  Step 1: Insert notification into notifications table (status: pending)
  Step 2: Attempt delivery via primary channel
  Step 3: If delivered (webhook confirmation): status → delivered
  Step 4: If failed: Try next channel after 5 minutes
  Step 5: After all channels fail: status → failed, alert ops
  
  WhatsApp delivery confirmation: Meta read receipts via webhook
  Push delivery confirmation: FCM delivery receipt
  SMS delivery: Twilio delivery webhook

NOTIFICATION CATEGORIES:
  transactional:  Bill due, SIP executed, goal milestone — ALWAYS send
  reminders:      User-set reminders — ALWAYS send
  proactive:      Viya insights — max 2/day, user can disable
  marketing:      Product announcements — opt-in only, weekly max
  
RATE LIMITING (Per user, per day):
  WhatsApp: Max 3 proactive + unlimited transactional
  Push: Max 5 total (no separate transactional/proactive limit)
  SMS: Max 2 (high cost, reserved for critical)
  Email: Unlimited transactional, 1 marketing/week

TEMPLATE SYSTEM:
  All notification content defined as templates in DB
  Templates support: {{user.name}}, {{bill.amount}}, {{goal.name}}
  Multi-language: Each template has versions for all 6 languages
  A/B testing: Multiple template variants, track open/action rates
  Emoji: Curated per template category (not auto-inserted)

NOTIFICATION PREFERENCES (User-controlled):
  per_channel: WhatsApp ON/OFF, Push ON/OFF, SMS ON/OFF
  per_category: Reminders, Bills, Goals, Health, Proactive
  quiet_hours: Start time + End time (default 11 PM - 7 AM)
  frequency: Some categories support "daily digest" option
```

### 4.5 Observability Stack

```
THREE PILLARS: Logs + Metrics + Traces

LOGGING (Structured, not string logs):
  Tool: Python structlog → Datadog Log Management
  Format: JSON always
  Required fields: timestamp, level, service, request_id, user_id (if available)
  Log levels: DEBUG (dev only), INFO (key events), WARNING (degraded), ERROR (failures)
  PII masking: Automatic in logging middleware (mask phone, email, amounts)
  
  What to log:
    Every API request: method, path, status, duration, user_id
    Every external API call: service, endpoint, status, duration
    Every background job: job_name, start, end, result
    Every AI call: model, tokens_in, tokens_out, cost, duration
    Every notification: channel, template, user_id, delivery_status
    Business events: signup, upgrade, goal_created, bill_paid

METRICS (Time-series, aggregated):
  Tool: Datadog Metrics (StatsD protocol)
  
  Infrastructure: CPU, memory, disk, network per service
  Application: Request rate, error rate, latency (p50/p95/p99)
  Business: signups/day, DAU, revenue/day, churn events
  AI: API calls by model, cost/day, cache hit rate
  Email sync: Success rate, emails processed/hour, lag
  Notifications: Sent/delivered/opened/acted rate by channel
  
  SLA Metrics (Alert if breached):
    API p95 latency > 2 seconds
    API error rate > 1%
    Email sync lag > 30 minutes
    Notification delivery rate < 90%
    AI cost > $2,000/day

DISTRIBUTED TRACING:
  Tool: Datadog APM (auto-instrumentation for FastAPI)
  
  Trace: Every request from API Gateway → FastAPI → DB + External APIs
  Span: Each function/service boundary gets a span
  Tags: user_id, plan, feature_flag states
  Sampling: 100% for errors, 10% for normal traffic, 100% for slow (>2s)
  
  Key traces to instrument:
    /chat/message: FastAPI → Context Builder → LLM → Actions → Response
    email_sync_job: Gmail API → Classification → Extraction → Store → Alert
    proactive_check_job: DB query → Trigger eval → Notification queue

ALERTING:
  Tool: PagerDuty (production) + Slack (non-critical)
  
  P1 (PagerDuty immediate):
    Service down (health check failing >2 minutes)
    Error rate >5% for 5 minutes
    Database connection failure
    Payment processing down
    
  P2 (PagerDuty, 30min delay):
    Error rate >2% for 15 minutes
    API p95 latency >3 seconds
    AI cost spike >2x daily average
    
  P3 (Slack only):
    Email sync falling behind (>1 hour lag)
    Notification delivery rate dropping
    Unusual signup/churn patterns

HEALTH CHECKS:
  /health: Returns 200 if service is running
  /health/ready: Returns 200 if service can handle requests
    Checks: DB connection, Redis connection, external API connectivity
  /health/live: Returns 200 if process is alive (for ECS health checks)
  
  Downstream dependencies: Check with 5-second timeout
  Response: { status, checks: { db, redis, claude, whatsapp }, version, uptime }
```

---

## SECTION 5: DATABASE AND DATA STRATEGY

### 5.1 Schema Outline

```
CORE AGGREGATES:

users:              Core identity, profile, plan, connected services
oauth_tokens:       Encrypted tokens for Gmail/Outlook/Fit/Health
viya_memory:        Long-term facts about user (pgvector for semantic search)
conversations:      Chat history, intent, actions taken, embeddings
sessions:           Active sessions, refresh tokens

emails:             Extracted email data (NOT full body — metadata + extracted)
calendar_events:    Synced from Google/Apple Calendar
email_attachments:  References to R2 stored attachments

transactions:       All financial movements (partitioned by month)
bank_accounts:      Linked via AA framework
investments:        All investment positions
investment_prices:  Daily price history per holding
bills_and_dues:     Recurring bills with due dates
subscription_services: Active subscriptions with usage tracking
budgets:            Category-level budget allocations

goals:              User financial/life goals
goal_transactions:  Money added to goal (goal_id + transaction_id)
habits:             Daily habit definitions
habit_completions:  Daily completion records

health_logs:        Time-series health data (steps, sleep, weight, etc.)
meals:              Meal logs with nutrition
food_database:      India-specific nutrition reference data (500K+ items)
medicines:          Active medication definitions
medicine_logs:      Daily dose taken/missed/skipped

reminders:          Scheduled and recurring reminders
tasks:              Task list with priority and due dates
shopping_lists:     Grocery and wish lists with items
documents:          References to R2-stored docs/receipts
mood_logs:          Daily mood tracking

notifications:      All notification records (sent, status, channel)
proactive_messages: AI-generated proactive alerts
audit_logs:         Admin actions, data access, security events
feature_flags:      Feature toggle states per user/plan/cohort

plans:              Subscription plan definitions and limits
subscriptions:      User subscription history
invoices:           Billing history
payment_methods:    Saved payment methods (tokenized, never raw)

INDEXING STRATEGY:

ALWAYS index:
  Foreign keys (user_id on every table)
  Status/state columns used in WHERE (bill status, notification status)
  Date columns used in WHERE/ORDER (transaction_date, due_at)
  
COMPOSITE indexes for common query patterns:
  (user_id, transaction_date DESC)   — "User's recent transactions"
  (user_id, category, transaction_date) — "User's category spending"
  (user_id, status, due_at)          — "User's pending reminders"
  (user_id, is_active, memory_type)  — "User's active memories by type"

PARTIAL indexes (for hot paths):
  ON transactions WHERE is_deleted = FALSE
  ON reminders WHERE status = 'pending'
  ON emails WHERE action_required = TRUE
  ON bills WHERE status != 'paid'

pgvector index (for semantic search):
  ON viya_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists=200)
  ON conversations USING ivfflat (embedding vector_cosine_ops) WITH (lists=100)
  Train index after 10K+ rows per table (ivfflat requirement)
```

### 5.2 Security and Privacy

```
DATA CLASSIFICATION:

TIER 1 — CRITICAL PII (Encrypt at field level):
  phone_number
  email_address
  bank_account_numbers
  oauth_access_tokens
  oauth_refresh_tokens
  
  Encryption: AES-256-GCM
  Key management: AWS KMS (one key per user, derived from master key)
  At rest: Field-level encrypted before insert
  In transit: Always TLS 1.3 (no TLS 1.1 or 1.2)

TIER 2 — SENSITIVE DATA (Encrypt at column level):
  financial_amounts (if precise tracking needed)
  health_conditions
  medication_names
  mood_scores
  
  Encryption: Transparent Data Encryption (PostgreSQL TDE)

TIER 3 — STANDARD DATA (Standard DB security):
  transaction categories
  goal names
  habit names
  conversation intent labels
  
  Security: DB-level access controls + network isolation

PII HANDLING:

Collection minimization:
  Collect only what features require
  Explicit data purpose for each field
  Regular audit: "Why do we store this?"

Data retention:
  Conversations: 90 days (then summarize + archive to cold storage)
  Full email bodies: Never stored (only extracted data)
  Health logs: User-defined retention (default: forever, can delete)
  Audit logs: 2 years (compliance requirement)
  Deleted account data: 30 days then permanently deleted

User rights (GDPR/India PDPB compliant):
  Right to access: GET /user/my-data (generates download zip)
  Right to deletion: DELETE /user (30-day processing, then gone)
  Right to correction: PATCH any user-owned resource
  Right to portability: Export in CSV + JSON format
  
  Data deletion SLA: Complete within 30 days of request
  Deletion verification: User receives email confirming deletion

GDPR/India PDPB READINESS:
  Privacy policy: Clear, plain language, reviewed by lawyer
  Cookie consent: N/A (mobile app, no cookies)
  Data processing agreements: Signed with Anthropic, AWS, Twilio
  Data residency: India data stays in ap-south-1 (Mumbai) region
  DPA documentation: Records of processing activities maintained
  Breach notification: 72-hour process for user notification

SECRETS MANAGEMENT:
  NEVER in code: API keys, database credentials, JWT secrets
  NEVER in .env files committed to git
  Store in: AWS Secrets Manager (production) + Vault (development)
  Rotation: Monthly for all API keys, quarterly for DB passwords
  Access: IAM role-based, least privilege principle
  Audit: Every secret access logged in CloudTrail
```

### 5.3 Migration Strategy

```
DATABASE MIGRATION APPROACH:

Tool: Alembic (Python, FastAPI ecosystem)

PRINCIPLES:
  Migrations are code: Committed to git, reviewed in PRs
  Forward-only: Never write rollback migrations (too complex, too risky)
  Small and frequent: Each migration does one thing
  Zero-downtime: All schema changes must be backward-compatible during deploy

ZERO-DOWNTIME PATTERNS:
  
  Adding a column:
    Step 1: Add column (nullable or with default) → deploy
    Step 2: Backfill data → migrate
    Step 3: Add NOT NULL constraint (if needed) → deploy
    Never: Add NOT NULL without default in a single migration
    
  Renaming a column:
    Step 1: Add new_name column, copy data from old_name → deploy
    Step 2: Update application to write to BOTH columns → deploy
    Step 3: Update application to read from new_name → deploy
    Step 4: Drop old_name column → deploy
    
  Creating an index:
    Always: CREATE INDEX CONCURRENTLY (non-blocking)
    Never: CREATE INDEX (blocks table during creation)
    
  Dropping a table:
    Never drop immediately — set deprecated_at first
    Wait 30 days, verify no reads/writes
    Then drop with team review

MIGRATION TESTING:
  Run migrations on production-sized staging DB before production
  Test: "Does production app run correctly against new schema?"
  Test: "Does rollback (redeploy old code) work with new schema?"
  Record migration duration: Alert if >30 seconds

BACKUP STRATEGY:
  Automated: Daily full backups (AWS RDS automated)
  Point-in-time: Continuous WAL shipping (restore to any second)
  Cross-region: Backup replicated to secondary AWS region
  Retention: 7 daily, 4 weekly, 12 monthly
  
  Recovery testing (quarterly):
    Restore last backup to isolated environment
    Verify data integrity
    Document actual RTO/RPO achieved
    Target: RTO <2 hours, RPO <1 hour
```

---

## SECTION 6: SECURITY, COMPLIANCE, AND RELIABILITY

### 6.1 Threat Model

```
THREAT ACTORS:
  Script kiddies:       Automated attacks, credential stuffing
  Competitors:          Data scraping, account takeover
  Malicious users:      Abuse of AI features, prompt injection
  Insider threats:      Employee data access, admin abuse
  Nation-state:         Low risk for current scale, monitor as grows

TOP RISKS AND MITIGATIONS:

RISK 1: Account Takeover
  Attack: Credential stuffing, SIM swap, OTP interception
  Mitigations:
    - OTP-only auth (no passwords to steal)
    - Rate limit OTP requests (3/hour per phone)
    - Device fingerprinting (alert on new device login)
    - Biometric app lock (device-level security)
    - Suspicious login detection (new device + new location)

RISK 2: Financial Data Exposure
  Attack: SQL injection, insecure direct object reference
  Mitigations:
    - Parameterized queries everywhere (SQLAlchemy ORM)
    - Row-level security in PostgreSQL
    - All requests authenticated + user_id validated in queries
    - Regular automated security scanning (Snyk)
    - Penetration testing quarterly

RISK 3: AI Prompt Injection
  Attack: Malicious input causes AI to act outside intended scope
  Mitigations:
    - System prompt includes instructions against injection
    - Output validation before executing any action
    - Action allowlist (AI can only call predefined tool set)
    - Sandboxed execution: AI actions run with user's permission scope only
    - Rate limiting on AI calls prevents mass exploitation

RISK 4: OAuth Token Theft
  Attack: Steal Gmail/bank OAuth tokens, access user data
  Mitigations:
    - Tokens encrypted at rest (AES-256)
    - Tokens never logged
    - Tokens never returned to client (server-side only)
    - Minimal scopes requested (read-only where possible)
    - Token rotation on each use
    - Instant revocation on suspicious activity

RISK 5: WhatsApp Bot Abuse
  Attack: Send spam to users via compromised bot number
  Mitigations:
    - Message signing (verify sender is Viya)
    - Rate limiting per user (max 10 messages/hour from bot)
    - User opt-out (send "STOP" to unsubscribe)
    - Meta compliance (follow WhatsApp Business Policy)
    - Monitor outbound message count anomalies

VULNERABILITY MANAGEMENT:
  Dependency scanning: Snyk (runs on every PR)
  Container scanning: AWS ECR image scanning
  SAST: Bandit (Python), ESLint security rules (JS)
  DAST: OWASP ZAP (quarterly against staging)
  Bug bounty: HackerOne program (post-Series A)
```

### 6.2 Audit Trails

```
AUDIT LOG DESIGN:

Every sensitive action creates an audit_log entry:

  actor_id:       Who did it (user or admin)
  actor_type:     user / admin / system / ai_agent
  action:         Verb (created, updated, deleted, accessed, exported)
  resource_type:  What was affected (transaction, goal, user, etc.)
  resource_id:    Specific resource
  changes:        JSON diff of what changed (before/after)
  ip_address:     Request origin
  user_agent:     Client device info
  timestamp:      Immutable, server-side generated
  
WHAT ALWAYS GETS AUDITED:
  Account creation and deletion
  Password changes (N/A — OTP only)
  OAuth token creation and revocation
  Payment events (upgrade, downgrade, refund)
  Data export requests
  Admin access to user data
  Failed authentication attempts
  Permission changes
  Any action by super_admin role

AUDIT LOG PROPERTIES:
  Immutable: Once written, never updated or deleted
  Append-only: No UPDATE statements ever touch audit_logs
  Separate storage: Different DB schema, different access controls
  Retention: 2 years minimum (compliance)
  Query: Read-only access for compliance/security team
```

### 6.3 High Availability

```
AVAILABILITY TARGET: 99.9% uptime = 8.7 hours downtime/year

ARCHITECTURE PATTERNS:

Multi-AZ deployment:
  PostgreSQL: Primary in ap-south-1a, hot standby in ap-south-1b
  Redis: Cluster mode, 3 shards × 2 replicas
  ECS Fargate: Tasks distributed across 3 availability zones
  Failover: Automatic, <60 seconds for DB, <30 seconds for app

Load balancing:
  AWS ALB: distributes across ECS tasks
  Health checks: /health/ready, 10-second interval
  Unhealthy task: Removed from rotation, new task started
  Minimum healthy: 50% during deployments (never drops below)

Circuit breakers:
  External API calls: CircuitBreaker pattern (5 failures → open, 30s cooldown)
  Database queries: Timeout after 30 seconds, return error
  AI API calls: Timeout after 20 seconds, fall back to simpler response
  Email sync: Disable if Gmail API down, retry later

Graceful degradation:
  AI API down → Use cached/rule-based responses for common queries
  Email sync down → Show "Email sync paused" banner, rest works normally
  Bank sync down → Show last known data + "Sync paused" indicator
  WhatsApp API down → App continues, messages queued + sent when restored

DISASTER RECOVERY PLAN:

RTO (Recovery Time Objective): 2 hours
RPO (Recovery Point Objective): 1 hour maximum data loss

Scenarios and responses:

Scenario 1: Database primary fails
  Detection: CloudWatch alarm within 2 minutes
  Response: RDS automated failover to standby
  Recovery: Automatic, ~60 seconds
  
Scenario 2: Entire availability zone fails
  Detection: AWS health dashboard + monitoring
  Response: Traffic shifted to remaining AZs automatically
  Recovery: Within 5 minutes
  
Scenario 3: Full region failure (rare)
  Detection: Cannot reach Mumbai region
  Response: Manual DNS failover to secondary region (Virginia/Singapore)
  Data: Restore from cross-region backup (up to 1 hour data loss)
  Recovery: 2-4 hours

Scenario 4: Ransomware / data corruption
  Detection: Data integrity monitoring alerts
  Response: Isolate affected systems, activate incident response
  Data: Point-in-time recovery from backup
  Recovery: 2-6 hours depending on scope

RUNBOOK: All scenarios have documented step-by-step runbooks
DRILLS: Full DR drill every 6 months
ON-CALL: PagerDuty rotation, 2-minute response SLA
```

---

## SECTION 7: DEPLOYMENT, SCALING, AND OPERATIONS

### 7.1 Infrastructure as Code

```
TERRAFORM STRUCTURE:

terraform/
  environments/
    production/
      main.tf
      variables.tf
      outputs.tf
    staging/
      main.tf (inherits from modules)
  modules/
    vpc/            — Network isolation
    ecs/            — Container orchestration
    rds/            — PostgreSQL cluster
    elasticache/    — Redis cluster
    alb/            — Load balancer
    cloudfront/     — CDN configuration
    waf/            — Web Application Firewall
    iam/            — Roles and policies
    monitoring/     — Datadog integration

KEY INFRASTRUCTURE:

VPC Design:
  Public subnets: Load balancers, NAT gateways
  Private subnets: ECS tasks, RDS, ElastiCache
  No direct internet access to application servers
  VPC Endpoints for AWS services (no internet traversal)

ECS Fargate Configuration:
  API service: 2 vCPU, 4GB RAM per task
  Worker service: 1 vCPU, 2GB RAM per task (Celery)
  Auto-scaling: CPU >70% → scale out, <30% for 5min → scale in
  Min tasks: 2 (always have redundancy)
  Max tasks: 20 (cost cap)

RDS PostgreSQL:
  Instance: db.r6g.xlarge (4 vCPU, 32GB RAM)
  Storage: 500GB gp3, auto-scaling to 2TB
  Multi-AZ: Yes (automatic failover)
  Backup: 7-day retention, continuous WAL
  Encryption: At rest with AWS KMS
  Parameter group: Tuned for connection pooling + pgvector

ElastiCache Redis:
  Engine: Redis 7.x, cluster mode
  Node type: cache.r6g.large
  Shards: 3, replicas per shard: 2
  Failover: Automatic on primary failure

SCALING STRATEGY:

Horizontal scaling triggers:
  ECS tasks scale out when:
    CPU utilization >70% for 3 minutes
    Memory utilization >75% for 3 minutes
    Request count >1000/minute per task
  
  ECS tasks scale in when:
    CPU <30% for 10 consecutive minutes
    (Hysteresis prevents flapping)

Vertical scaling plan:
  Phase 1 (0-100K users): db.r6g.large + 2 ECS tasks
  Phase 2 (100K-1M users): db.r6g.xlarge + 4-8 ECS tasks
  Phase 3 (1M-5M users): db.r6g.2xlarge + read replicas + 8-20 tasks
  Phase 4 (5M+ users): Evaluate extract email_sync + ai_agents to separate services

COST MANAGEMENT:
  Reserved instances: DB and cache (1-year, 40% savings)
  Spot instances: Worker tasks (70% savings, acceptable for background jobs)
  S3 lifecycle: Move old logs to Glacier after 90 days
  Monthly budget alerts: Alert at 80% of monthly budget
  Cost per user target: <$0.08/month at scale
```

### 7.2 Feature Flags

```
FEATURE FLAG STRATEGY (PostHog):

FLAG TYPES:
  boolean:    Simple on/off
  percentage: Rollout to X% of users
  cohort:     Specific user segments
  plan-based: Available to certain plans only

KEY FLAGS IN USE:

  new_email_intelligence_v2:
    Purpose: Test new email extraction model
    Rollout: 5% → 25% → 50% → 100% over 2 weeks
    
  premium_investment_ai:
    Purpose: Investment portfolio AI (premium feature)
    Condition: user.plan == 'premium' AND user.investments_connected
    
  family_mode_beta:
    Purpose: Multi-member account sharing
    Rollout: Waitlist users only first, then premium users
    
  voice_first_mode:
    Purpose: Voice-primary interface experiment
    Rollout: 10% of users, measure engagement vs control
    
  dark_mode_system_default:
    Purpose: Match system dark mode preference by default
    Rollout: 100% (ready for full rollout)

FLAG GOVERNANCE:
  Each flag: Owner (engineer), purpose, rollout plan, cleanup date
  No flags older than 90 days without review
  Dead flags (100% or 0%): Remove from codebase within 2 weeks
  Flag evaluation: Cached in Redis, refreshed every 5 minutes

KILLSWITCHES (Emergency flags):
  disable_ai_chat:       Turn off all AI responses, show cached/static
  disable_email_sync:    Stop Gmail syncing, keep rest working
  disable_bank_sync:     Stop AA framework, keep rest working
  enable_maintenance_mode: Show maintenance screen to all users
  These bypass normal flag evaluation, flip instantly
```

### 7.3 Performance and Load Testing

```
PERFORMANCE TESTING STRATEGY:

TOOL: k6 (JavaScript-based, cloud-native)

TEST TYPES:

Smoke test (Every deployment):
  1 virtual user, 1 minute
  Purpose: "Does the system work at all?"
  Failure: Any error = block deployment

Load test (Weekly):
  Ramp: 0 → 100 users over 5 minutes
  Hold: 100 users for 10 minutes
  Ramp down: 100 → 0 over 2 minutes
  Targets: p95 < 500ms, error rate < 0.1%

Stress test (Monthly):
  Ramp: 0 → 500 users over 10 minutes
  Hold: 500 users for 20 minutes
  Purpose: Find breaking point and failure mode
  Target: System degrades gracefully (not catastrophically)

Spike test (Quarterly):
  Instant jump to 1000 users (Diwali/salary-day simulation)
  Hold 5 minutes, then drop to 10 users
  Purpose: "How does system handle sudden viral traffic?"
  Target: <5% error rate during spike, recovery within 2 minutes

Soak test (Pre-major release):
  100 users for 8 hours
  Purpose: Memory leaks, connection pool exhaustion, cache bloat
  Alert: Memory growth >20MB/hour = leak

KEY SCENARIOS TO TEST:
  POST /chat/message (most expensive, AI call)
  GET /email/inbox (complex query + cache)
  POST /auth/verify-otp (critical path)
  GET /finance/overview (multi-table join)
  Background: email_sync_job (concurrent many-user simulation)
```

---

## SECTION 8: MVP ROADMAP AND PHASED DELIVERABLES

### Phase 1: Premium Foundation (Weeks 1-8)

```
GOAL: Upgrade MVP to premium quality. Fix all rough edges.
      Achieve: 40% Day-7 retention, 10% premium conversion

WEEK 1-2: Core Platform Hardening
  ✅ Migrate to production infrastructure (ECS + RDS + ElastiCache)
  ✅ Implement proper error handling (every endpoint, every edge case)
  ✅ Add skeleton loaders on all screens (eliminate blank states)
  ✅ Set up Datadog monitoring + PagerDuty alerting
  ✅ Implement structured logging (JSON, correlation IDs)
  ✅ Database: Add missing indexes, analyze slow queries
  ✅ Security: OTP rate limiting, JWT refresh rotation, secrets in AWS SM

WEEK 3-4: Onboarding Excellence
  ✅ Redesign onboarding (4 screens, 90 seconds, <2 taps each)
  ✅ SMS auto-read for OTP (Android) / AutoFill (iOS)
  ✅ Gmail OAuth + immediate first email insight on completion
  ✅ WhatsApp first message within 60 seconds of signup
  ✅ First expense log < 3 minutes from signup
  ✅ Measure and optimize: Track every onboarding drop-off point

WEEK 5-6: Email Intelligence Launch
  ✅ Gmail sync pipeline (15-minute incremental, push webhook)
  ✅ Bill email detection + amount/date extraction
  ✅ Meeting invite detection + calendar conflict check
  ✅ Delivery tracking detection
  ✅ Email intelligence feed (tabbed, action-first)
  ✅ Google Calendar OAuth + accept meetings from app

WEEK 7-8: Premium Tier Launch
  ✅ Razorpay integration (subscription, UPI, cards)
  ✅ Premium feature gates (plan checking middleware)
  ✅ Upgrade flow (premium page + trial + payment)
  ✅ Investment portfolio tracking (Zerodha/Kuvera APIs)
  ✅ Tax planning module (80C tracking, ITR prep)
  ✅ PDF report generation and export

PHASE 1 SUCCESS CRITERIA:
  Day-7 retention: 40% (was 35%)
  Onboarding completion: 80% (was 65%)
  Email connection rate: 50%
  Premium conversion: 5% (baseline established)
  App Store rating: 4.5+
  API p95 latency: <500ms
```

### Phase 2: Intelligence and Automation (Weeks 9-16)

```
GOAL: Make Viya proactively intelligent. Users say "How did you know?"
      Achieve: 40% Day-30 retention, 12% premium conversion

WEEK 9-10: Proactive Intelligence Engine
  ✅ All 12 trigger conditions implemented and tested
  ✅ Background scheduler with Celery (reliable job execution)
  ✅ Morning brief generation + delivery (personalized, daily)
  ✅ Spending anomaly detection
  ✅ Goal risk alerts (falling behind triggers)
  ✅ Subscription waste detection (monthly audit)

WEEK 11-12: Health Intelligence Upgrade
  ✅ Food scanner (Claude Vision + Indian food database 500K items)
  ✅ Google Fit + Apple HealthKit deep integration
  ✅ Medicine adherence tracking + smart reminders
  ✅ Nutrition analysis + meal suggestions
  ✅ Health score algorithm (composite 0-100)
  ✅ Sleep analysis integration

WEEK 13-14: Wealth Management Depth
  ✅ Account Aggregator full integration (10+ banks)
  ✅ Investment XIRR calculation
  ✅ Portfolio rebalancing insights
  ✅ FD maturity alerts
  ✅ Tax loss harvesting detection
  ✅ EMI prepayment calculator

WEEK 15-16: Notification Excellence
  ✅ Multi-channel delivery (WhatsApp → Push → SMS fallback)
  ✅ Delivery confirmation tracking + retry logic
  ✅ User notification preferences (per channel, per category)
  ✅ Quiet hours enforcement
  ✅ WhatsApp interactive buttons (3-button max, list messages)
  ✅ Notification engagement tracking (open, act, dismiss)

PHASE 2 SUCCESS CRITERIA:
  Day-30 retention: 38% (was 22%)
  Proactive message action rate: 40%
  Health tracking adoption: 50% of users
  Premium conversion: 12%
  WhatsApp daily messages per user: 8+
  NPS score: 55+
```

### Phase 3: AI-Powered Personalization (Weeks 17-24)

```
GOAL: Viya knows each user better than they know themselves.
      Achieve: 30% Day-90 retention, 18% premium conversion

WEEK 17-18: Memory and Personalization
  ✅ Long-term memory system (pgvector semantic search)
  ✅ Relationship graph (know every important person in user's life)
  ✅ Behavioral pattern detection (spending triggers, health cycles)
  ✅ Personalized morning brief (references past conversations)
  ✅ Context-aware responses (Viya references user's history)

WEEK 19-20: Advanced AI Agents
  ✅ Shopping intelligence (price tracking, deal alerts)
  ✅ Travel planning assistant (trip extraction from emails + planning)
  ✅ Document intelligence (receipt OCR, IDs, insurance policies)
  ✅ Career finance planning (salary negotiation, skill investment ROI)
  ✅ Mental health support (stress detection + response protocol)

WEEK 21-22: Family and Social Features
  ✅ Family mode (4 members, shared goals, privacy controls)
  ✅ Couple finance mode (shared budgets, conflict prevention)
  ✅ Achievement sharing (goal completion → WhatsApp status card)
  ✅ Referral program (₹50 each, track viral loops)
  ✅ Social comparison (anonymized: "Top 20% savers like you")

WEEK 23-24: Enterprise Foundation
  ✅ Team workspaces (enterprise plan scaffold)
  ✅ Admin dashboard (user management, analytics, ops)
  ✅ API access (enterprise: programmatic access to Viya data)
  ✅ Custom AI agent builder (enterprise-only)
  ✅ White-label option (bank partnerships)

PHASE 3 SUCCESS CRITERIA:
  Day-90 retention: 32% (was 15%)
  Memory feature usage: 70% of users have >10 memories
  Family mode adoption: 25% of premium users
  Referral viral coefficient: 0.4+
  Enterprise signups: 100 companies
  Annual Recurring Revenue: ₹25 Crore
```

---

## SECTION 9: DELIVERABLES AND ARTIFACTS

### 9.1 High-Level API Contracts

```
AUTHENTICATION:
  POST /api/v1/auth/send-otp
    Request:  { phone, country_code }
    Response: { success, expires_in: 600, request_id }
    Errors:   AUTH_RATE_LIMITED, AUTH_INVALID_PHONE
    
  POST /api/v1/auth/verify-otp
    Request:  { phone, otp, device_id?, device_name? }
    Response: { access_token, refresh_token, user, is_new_user }
    Errors:   AUTH_OTP_EXPIRED, AUTH_OTP_INVALID
    
CHAT:
  POST /api/v1/chat/message
    Request:  { content, type: text|voice|image, session_id }
    Response: { message_id, response, response_type, rich_content, 
                actions_taken, quick_replies, ui_action }
    SSE:      Accept: text/event-stream for streaming
    
  GET /api/v1/chat/history
    Query:    ?session_id=&before=<cursor>&limit=20
    Response: { messages: [], next_cursor, has_more }

EMAIL:
  GET /api/v1/emails
    Query:    ?tab=action|meetings|finance|orders|all&cursor=&limit=20
    Response: { emails: [], next_cursor, counts_by_tab }
    
  POST /api/v1/emails/:id/action
    Request:  { action: accept_meeting|mark_paid|archive|..., data?: {} }
    Response: { success, result, follow_up_action? }

FINANCE:
  GET /api/v1/finance/overview
    Response: { net_worth, monthly_spent, monthly_income, 
                goals_summary, bills_summary, investments_summary }
    
  POST /api/v1/transactions
    Request:  { amount, category, merchant_name, type, transaction_date, 
                payment_method?, notes? }
    Idempotency-Key: Required for POST
    Response: { transaction, budget_impact, goal_impact }

HEALTH:
  GET /api/v1/health/today
    Response: { score, steps, sleep, water, calories, medicines_today, mood }
    
  POST /api/v1/health/diet/scan
    Request:  FormData(image, meal_type)
    Response: { food_items, total_nutrition, confidence, suggested_log }

NOTIFICATIONS:
  GET /api/v1/notifications
    Query:    ?status=unread&limit=20
    Response: { notifications: [], unread_count }
    
  PUT /api/v1/notifications/settings
    Request:  { channels: {}, categories: {}, quiet_hours: {} }
    Response: { settings }
```

### 9.2 Success Criteria and Risk Assessment

```
SUCCESS CRITERIA DASHBOARD:

WEEK 4 CHECKPOINT:
  ☐ Onboarding completion >75%
  ☐ Day-7 retention >38%
  ☐ API error rate <0.5%
  ☐ API p95 latency <500ms
  ☐ App Store reviews >4.4 average

WEEK 8 CHECKPOINT:
  ☐ Gmail connection rate >45%
  ☐ Email intelligence DAU >50% (of Gmail-connected users)
  ☐ Premium conversion >5%
  ☐ Zero P1 incidents in production
  ☐ GDPR audit passed (internal)

WEEK 16 CHECKPOINT:
  ☐ Day-30 retention >35%
  ☐ Proactive message action rate >35%
  ☐ Health tracker DAU >40%
  ☐ Premium conversion >10%
  ☐ Monthly revenue >₹50 Lakhs
  ☐ WhatsApp messages/user/day >6

WEEK 24 CHECKPOINT:
  ☐ Day-90 retention >30%
  ☐ 500K+ active users
  ☐ Premium conversion >15%
  ☐ Monthly revenue >₹2 Crore
  ☐ NPS >60
  ☐ App Store rating >4.6 both platforms

RISK REGISTER:

RISK 1: WhatsApp API Rate Limits / Policy Changes
  Probability: Medium | Impact: Critical
  Meta could change Business API policies
  Mitigation: 
    Build in-app chat as primary, WhatsApp as secondary
    Maintain SMS fallback channel
    Multi-provider strategy (360Dialog + Infobip as backup)
  Contingency: Push notification fallback + in-app daily brief

RISK 2: Anthropic API Cost Spike
  Probability: Medium | Impact: High
  AI costs scale with usage; abuse or viral growth could spike costs
  Mitigation:
    4-tier routing (40% handled without LLM)
    Per-user daily limits enforced
    Cost alerts at 150% of projected daily spend
    Response caching for common queries
    Kill switch: Disable AI for specific users if costs spike

RISK 3: Gmail API Quota Limits
  Probability: Medium | Impact: High
  Google limits API calls per project, can suspend for abuse
  Mitigation:
    Push webhooks (not polling) dramatically reduce API calls
    Incremental sync (only new since last check)
    Request quota increase before scaling (Google process)
    Cache all email data server-side (re-read from cache, not Gmail)

RISK 4: Indian Banking AA Framework Reliability
  Probability: Low-Medium | Impact: Medium
  AA framework is newer, occasional outages
  Mitigation:
    SMS parsing as fallback (no AA needed)
    Manual transaction entry always available
    Clear user messaging when sync fails
    Show cached data with timestamp

RISK 5: Team Capacity / Execution Speed
  Probability: High | Impact: Medium
  Phase 3 is ambitious for 24-week timeline
  Mitigation:
    Hire 2 senior engineers before Phase 2 starts
    Contract AI/ML specialist for food scanner + memory features
    Phase 3 features can slip 2 weeks without revenue impact
    Core retention features (Phases 1-2) take priority
```

### 9.3 Tech Stack Rationale Summary

```
WHY THIS STACK WINS:

React Native + Expo:
  ✅ Single codebase → iOS + Android (50% faster development)
  ✅ OTA updates (fix bugs without App Store review)
  ✅ Expo SDK covers 95% of native features we need
  ✅ Large community, extensive documentation
  ✅ Reanimated 3 gives true 60fps animations on UI thread
  Alternative considered: Flutter (rejected: Dart ecosystem, smaller community)

FastAPI + Python:
  ✅ Native async (critical for AI API calls)
  ✅ Pydantic v2 validation (production-ready type safety)
  ✅ Auto-generated OpenAPI docs (team velocity)
  ✅ ML libraries readily available (pandas, numpy, scikit-learn)
  ✅ Fastest growing backend framework in 2024
  Alternative considered: Node.js/Express (rejected: weaker typing, ML ecosystem)

PostgreSQL + pgvector:
  ✅ ACID compliance (financial data requires this)
  ✅ pgvector: Semantic search in same DB (no separate vector DB)
  ✅ Mature, battle-tested at scale (Instagram, Reddit, Discord)
  ✅ Rich querying capabilities (window functions, CTEs, JSON)
  ✅ Row-level security for multi-tenant isolation
  Alternative considered: MongoDB (rejected: no ACID for financial data)

Celery + Redis:
  ✅ Proven reliability at massive scale
  ✅ Rich monitoring (Flower, Datadog integration)
  ✅ Priority queues (critical reminders vs low-priority analytics)
  ✅ Redis dual-purpose (cache + queue = one less service)
  Alternative considered: AWS SQS (rejected: harder local dev, less visibility)

ECS Fargate:
  ✅ No server management (focus on product, not infra)
  ✅ Auto-scaling built-in
  ✅ Per-second billing (cost-efficient for variable load)
  ✅ ECR integration (seamless Docker deployments)
  Alternative considered: Kubernetes (rejected: over-complex for current scale)

TOTAL INFRASTRUCTURE COST ESTIMATE:

At 100K MAU (₹3-5 Lakh/month):
  ECS Fargate: $400
  RDS PostgreSQL: $400
  ElastiCache: $200
  Data transfer: $100
  Monitoring (Datadog): $500
  Other services: $200
  Total: ~$1,800/month = ₹1.5 Lakh/month

At 1M MAU (₹15-20 Lakh/month):
  ECS (scaled): $1,500
  RDS (larger): $1,200
  ElastiCache: $600
  Data transfer: $500
  Monitoring: $1,000
  AI API costs: $45,000
  Other: $1,200
  Total: ~$51,000/month = ₹42 Lakh/month

Revenue at 1M MAU (10% premium, ₹149/month):
  100,000 premium users × ₹149 = ₹1.49 Crore/month
  Infrastructure: ₹42 Lakh/month (28% of revenue — healthy)
  Gross margin: ~72% at this scale
```

---

## FINAL DIRECTIVE

```
YOU ARE BUILDING SOMETHING THAT HAS NEVER EXISTED BEFORE.

Not another finance app.
Not another health tracker.
Not another AI chatbot.

A COMPLETE LIFE OPERATING SYSTEM — for 50 million Indians who deserve
a brilliant, tireless, always-available intelligence working for them.

Every architectural decision in this document was made for ONE reason:
Make users' lives genuinely, measurably better.

The fastest API responses → Users trust the product
The most accurate email extraction → Users save ₹1,000+ in late fees
The most proactive reminders → Users never miss what matters
The most human-like AI responses → Users feel understood

Build it exactly this way.
Ship it on time.
Change 50 million lives.

🚀
```
