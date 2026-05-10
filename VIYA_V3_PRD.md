# VIYA V3 — THE LIFE OPERATING SYSTEM
## Product Requirements Document (PRD)

> **Vision:** The only app anyone needs to run their entire life — money, health, time, relationships, and growth — powered by AI.

> **Tagline:** *"Your Life. Automated."*

---

## 1. MARKET RESEARCH & USER PAIN POINTS

### 1.1 What Users Hate About Current Apps
| Pain Point | Viya's Solution |
|-----------|----------------|
| Too many apps (banking, health, calendar, habits) | **Single app** for everything |
| Manual data entry kills engagement (78% abandon in 30 days) | **Zero-input AI** — auto-detect from SMS/email |
| Generic advice with no context | **Contextual AI** that knows salary, goals, patterns |
| Miss bill dates, meetings, checkups | **Proactive WhatsApp nudges** before things go wrong |
| Apps feel like websites, not native | **Capacitor + Framer Motion** — true native feel |
| Privacy anxiety linking bank accounts | **Read-only SMS parsing** — no bank login needed |
| No reward for being disciplined | **Gamification** — streaks, XP, levels, rewards |

### 1.2 Competitive Gap
> **No app in India combines:** SMS expense auto-tracking + AI financial advisor + health logging + habit streaks + bill reminders + email intelligence + WhatsApp bot — all in ONE native app with gamification. **Viya V3 fills this gap.**

---

## 2. TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + Vite 8 | Current codebase |
| Native Wrapper | **Capacitor 7** | PWA → Play Store + App Store |
| Animations | **Framer Motion 12** | Page transitions, gestures |
| Gestures | **@use-gesture/react** | Swipe, pull-to-refresh, drag |
| State | Zustand + React Query | Optimistic UI |
| Backend | Vercel Serverless (Python) | Auto-scales |
| Database | Supabase PostgreSQL 16 | Real-time subscriptions |
| AI | OpenAI GPT-4o-mini | Chat, insights, categorization |
| Notifications | Capacitor Push + WhatsApp | Dual-channel alerts |

### Capacitor Setup
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm install @capacitor/push-notifications @capacitor/haptics @capacitor/status-bar
npm install @capacitor/splash-screen @capacitor/local-notifications @capacitor/share @capacitor/camera
npx cap init "Viya" "com.viya.app" --web-dir=dist
npx cap add android && npx cap add ios
```

---

## 3. KILLER FEATURES

### 3.1 AI Money Brain (AEIE v2)
- **Auto-log from SMS** via Capacitor SMS plugin
- **15 smart categories** with ML learning from user corrections
- **Spending predictions** ("You'll overspend ₹3,200 on food this month")
- **Bill auto-detection** from recurring debits
- **Split detection** from UPI transactions
- **Subscription tracker** auto-detects Netflix, Spotify from SMS

### 3.2 WhatsApp Agentic Bot V3
| Command | Action |
|---------|--------|
| "spent 500 on food" | Logs expense + updates budget + shows remaining |
| "how much left" | Real-time budget with visual chart |
| "remind me rent on 1st" | Creates recurring reminder + WhatsApp alert |
| "health update" | Asks weight/water/mood → logs to dashboard |
| "show my week" | Sends weekly summary image |
| Send receipt photo | OCR extracts amount → auto-logs |
| Send voice note | Transcribes → extracts intent → executes |
| "good morning" | Personalized daily brief |
| "monthly report" | Generates report card with grades |

**Proactive Messages (bot messages YOU first):**
- "Your electricity bill ₹2,400 is due tomorrow"
- "You've maintained gym streak for 14 days! 🔥"
- "You've spent ₹8,200 on food — ₹1,800 left"
- "Meeting invite from boss — tomorrow 3 PM"
- "Time for evening Vitamin D 💊"

### 3.3 Gamification Engine
| Element | Detail |
|---------|--------|
| XP System | Log expense (+5), complete habit (+10), stay under budget (+50) |
| Levels | Beginner → Saver → Investor → Master → Legend |
| Streaks | Login, habit, budget streaks with freeze tokens |
| Challenges | "No-Spend Weekend", "Log All Meals", "10K Steps" |
| Leaderboard | Compete with friends on savings rate |
| Rewards | Custom themes, AI personality unlocks |

### 3.4 Native App Feel
| Animation | Implementation |
|-----------|---------------|
| Page transitions | Framer Motion AnimatePresence — iOS-style slide/fade |
| Pull to refresh | Elastic pull with haptic feedback |
| Swipe to delete | Swipe left on expense/reminder |
| Bottom sheets | Drag-up sheets for add expense, filters |
| Haptic feedback | Capacitor Haptics on press, toggle, delete |
| Skeleton loading | Content-aware skeletons everywhere |
| Tab bar | Animated active indicator sliding between tabs |
| Micro-interactions | Button scale, icon morphs, count-up numbers |

---

## 4. SCREEN MAP (35+ Screens)

### Bottom Tab Navigation
| Tab | Icon | Screen |
|-----|------|--------|
| 🏠 Home | Dashboard + Quick Add + Daily Brief |
| 💰 Money | Expenses, Budget, Bills, Goals |
| 💬 Viya | AI Chat with full context |
| 🔥 Life | Health + Habits + Calendar unified |
| 👤 Profile | Settings, Rewards, Modules |

### Money Screens
| Screen | Route | Key Features |
|--------|-------|-------------|
| Expenses | `/expenses` | Auto-logged list, swipe-delete, charts |
| Add Expense | Bottom sheet | Amount, category, notes, recurring |
| Budget | `/budget` | Progress rings, category limits, alerts |
| Bills | `/bills` | Auto-detected, due dates, pay reminders |
| Goals | `/goals` | Savings goals, progress, auto-deduct |
| Wealth | `/wealth` | Net worth, investments, SIP calculator |
| Report | `/report` | Monthly/weekly with AI grades |
| Subscriptions | `/subscriptions` | **NEW** Auto-detected recurring charges |
| Splits | `/splits` | **NEW** Track debts, send reminders |

### Life Screens
| Screen | Route | Key Features |
|--------|-------|-------------|
| Health | `/health` | Weight, water, mood, sleep, steps |
| Habits | `/habits` | Grid view, streaks, freeze tokens |
| Calendar | `/calendar` | Unified: bills + meetings + reminders |
| Reminders | `/reminders` | Smart reminders via WhatsApp |
| Meals | `/meals` | **NEW** Food log + calorie estimation |
| Medicine | `/medicine` | **NEW** Schedule + push alerts |
| Journal | `/journal` | **NEW** Daily reflection + AI mood analysis |
| Sleep | `/sleep` | **NEW** Sleep tracking + quality score |

### Social Screens
| Screen | Route |
|--------|-------|
| Friends | `/friends` |
| Family | `/family` |
| Community | `/community` |
| Leaderboard | `/leaderboard` | **NEW** Weekly rankings |

### Intelligence Screens
| Screen | Route |
|--------|-------|
| Email Intelligence | `/email` |
| Insights | `/insights` | **NEW** Deep spending analytics |
| Predictions | `/predictions` | **NEW** AI spending forecasts |

### Settings & Utility
| Screen | Route |
|--------|-------|
| Settings | `/settings` | **NEW** Full settings hub |
| Permissions | `/permissions` | **NEW** SMS, Email, Notification toggles |
| Rewards | `/rewards` | **NEW** XP, levels, badges |

---

## 5. WHATSAPP BOT V3 ARCHITECTURE

### Message Pipeline
```
User message → Webhook → V3 Orchestrator
  ├── INSTANT (<1s): Greetings, quick queries
  ├── FAST (<3s): Log expense, set reminder
  ├── STANDARD (<10s): Insights, reports
  └── DEEP (<30s): Monthly analysis, predictions
  → Execute → Update DB → Format rich response → Send
```

### Proactive Crons
| Cron | Schedule | Purpose |
|------|----------|---------|
| Morning Brief | 7 AM | Today's agenda + alerts |
| Bill Reminder | 1 day before | Due date warning |
| Budget Alert | Real-time | 90% budget threshold |
| Weekly Summary | Sunday 8 PM | Visual spending card |
| Habit Nudge | 9 PM | Streak protection |
| Medicine Alert | Custom times | Medication reminders |
| Monthly Report | 1st of month | Full AI report card |

### Multi-Modal Input
| Type | Processing |
|------|-----------|
| Text | NLP intent → action |
| Voice note | Whisper transcription → NLP → action |
| Image (receipt) | OCR → auto-log expense |
| Location | Context for expense logging |

---

## 6. DATABASE ADDITIONS (V3)

```sql
-- Gamification
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL, total_xp INT DEFAULT 0, level INT DEFAULT 1,
  current_streak INT DEFAULT 0, longest_streak INT DEFAULT 0,
  badges JSONB DEFAULT '[]', updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL, name TEXT, amount DECIMAL(12,2),
  frequency TEXT DEFAULT 'monthly', next_charge DATE,
  detected_from TEXT DEFAULT 'sms', is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Splits
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL, title TEXT, total_amount DECIMAL(12,2),
  participants JSONB, settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal
CREATE TABLE journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL, entry TEXT, mood TEXT,
  ai_analysis TEXT, tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, description TEXT, xp_reward INT DEFAULT 50,
  type TEXT, start_date DATE, end_date DATE, is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL, challenge_id UUID REFERENCES challenges(id),
  progress DECIMAL(5,2) DEFAULT 0, completed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. API ENDPOINTS (V3)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/whatsapp` | POST | WhatsApp webhook |
| `/api/auth/gmail` | GET | Gmail OAuth |
| `/api/auth/gmail/callback` | GET | Token exchange |
| `/api/sms/process` | POST | **NEW** SMS batch processing |
| `/api/insights/weekly` | GET | **NEW** Weekly insights |
| `/api/insights/predict` | GET | **NEW** Spending predictions |
| `/api/gamification/xp` | POST | **NEW** Award XP |
| `/api/gamification/leaderboard` | GET | **NEW** Leaderboard |
| `/api/cron/morning-brief` | GET | **NEW** 7 AM brief |
| `/api/cron/habit-nudge` | GET | **NEW** 9 PM nudge |
| `/api/cron/weekly-summary` | GET | **NEW** Sunday summary |
| `/api/ocr/receipt` | POST | **NEW** Receipt OCR |

---

## 8. MONETIZATION

| Feature | Free | Pro ₹99/mo | Premium ₹199/mo |
|---------|------|-----------|-----------------|
| Auto expense tracking | 50/mo | Unlimited | Unlimited |
| AI chat | 10 msg/day | 100/day | Unlimited |
| Habits | 3 habits | Unlimited | Unlimited |
| WhatsApp bot | Basic | Full | Full + Proactive |
| Reports | ❌ | ✅ | ✅ |
| Email Intelligence | ❌ | ✅ | ✅ |
| Predictions | ❌ | ❌ | ✅ |
| Family mode | ❌ | ❌ | ✅ |
| Ad-free | ❌ | ✅ | ✅ |

---

## 9. PLAY STORE REQUIREMENTS

| Field | Value |
|-------|-------|
| App name | Viya — Your Life, Automated |
| Category | Finance |
| Target SDK | 35 (Android 15) |
| Min SDK | 26 (Android 8.0) |
| Assets needed | 512x512 icon, 1024x500 feature graphic, 8 screenshots |

### Permissions
| Permission | Why |
|-----------|-----|
| READ_SMS | Auto-detect bank transactions |
| RECEIVE_SMS | Real-time expense logging |
| POST_NOTIFICATIONS | Bill/habit reminders |
| CAMERA | Receipt scanning |
| INTERNET | API calls |
| VIBRATE | Haptic feedback |

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Native Foundation (Week 1)
- [x] Capacitor + Android/iOS setup
- [x] Framer Motion + gesture library
- [x] PageTransition, BottomSheet, PullToRefresh components
- [x] Haptic hooks, skeleton loaders
- [x] Redesign tab bar with animated indicator
- [x] CSS: safe-area insets, momentum scroll

### Phase 2: Money Intelligence (Week 2)
- [x] AEIE v2: SMS permission + auto-parsing (`api/sms/process.py`)
- [x] Subscription auto-detection
- [x] Split bills screen
- [x] Spending predictions endpoint (`api/insights/weekly.py`)
- [x] Receipt OCR via camera (`api/ocr/receipt.py`)
- [x] Swipe-to-delete gestures

### Phase 3: Life Hub (Week 3)
- [x] Unified Life tab: Health + Habits + Calendar
- [x] Journal with AI mood analysis
- [x] Medicine tracker + push alerts (`api/cron/medicine-alert.py`)
- [x] Sleep log + Meal logger
- [x] Enhanced habit grid with streak-freeze

### Phase 4: Gamification (Week 4)
- [x] XP + levels + badges (50 badges)
- [x] Weekly challenges engine
- [x] Leaderboard + Rewards screen
- [x] Streak animations + celebrations (confetti)

### Phase 5: WhatsApp V3 Bot (Week 5)
- [x] V3 Orchestrator with agentic routing (14 intents)
- [x] Voice note transcription (Whisper integration)
- [x] Receipt OCR processing (Vision API)
- [x] Proactive crons (brief, alerts, nudges, medicine, monthly)
- [x] Rich media responses (interactive buttons, multi-modal)

### Phase 6: Polish & Launch (Week 6)
- [x] Capacitor build config (`capacitor.config.ts`)
- [x] All API endpoints registered in vercel.json
- [x] Database migration v3 complete (11 tables + RLS)
- [x] Performance optimizations (preconnect, DNS prefetch, R8 minify, SEO meta)
- [x] Capacitor Android build → `npx cap add android` + sync ✅ (7 plugins)
- [x] Play Store listing draft (`PLAY_STORE_LISTING.md`)
- [x] Android permissions (SMS, Camera, Notifications, Vibrate)
- [x] Deep links configured (https + viya:// scheme)
- [x] Network security config (HTTPS enforced)
- [x] Android SDK installed → `D:\AndroidSdk`
- [x] Keystore generated → `viya-release.keystore`
- [x] **RELEASE AAB BUILT** → `builds/viya-v3.0.0-release.aab` (15.5 MB) ✅
- [x] **DEBUG APK BUILT** → `builds/viya-v3.0.0-debug.apk` (21.46 MB) ✅
- [ ] Upload AAB to Play Console → https://play.google.com/console
- [ ] Beta test 50 users → Production launch

---

> **STATUS:** ALL 6 PHASES COMPLETE ✅ | AAB + APK ready | Upload to Play Store to go live 🚀


