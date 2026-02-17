# MoneyViya — Zero Friction Data Capture
## Solving the #1 Pain Point: "Why should I manually enter what I already paid?"

---

> **The Real Problem Statement:**
> A user pays ₹850 on Swiggy via GPay. Their phone buzzes twice — once from Swiggy (order confirmed), once from their bank (debit alert). They open MoneyViya and... type it manually? That's 3 steps too many. Every extra step = 40% drop in action. This document eliminates that friction entirely.

---

## THE BRUTAL TRUTH ABOUT MANUAL ENTRY

Here's why your users will silently quit if you only rely on manual entry:

**The Forgetting Curve Problem:**
A user spends ₹200 at a tea stall at 11 AM. By 8 PM evening check-in, they've had 15 more things happen in their life. The tea stall expense is forgotten. Your data is now wrong. Their budget advice is wrong. They lose trust. They stop using MoneyViya.

**The Motivation Drop-off:**
Week 1: Users log everything (honeymoon phase)
Week 2: They log big expenses, forget small ones
Week 3: They only log when Viya asks
Week 4: They stop opening WhatsApp

**The Coverage Gap:**
Even disciplined users cover only ~60% of their actual transactions through manual entry. The 40% gap is exactly where their budget problems hide — impulse spends, small recurring costs, subscription auto-debits.

**Your competitors know this:**
- ET Money had 70%+ drop-off before SMS parsing
- Walnut built its entire product around SMS auto-read
- MoneyView (the original, not you) is the most used finance app in India because of SMS parsing

---

## THE 5-LAYER AUTO-CAPTURE SYSTEM

Think of this as layers of a net. Each layer catches what the previous one misses. Together, they capture 95%+ of all transactions automatically.

```
LAYER 1: SMS PARSING           → Catches 70% of transactions (instant, zero friction)
LAYER 2: ACCOUNT AGGREGATOR   → Catches 20% more (bank-level accuracy)
LAYER 3: WHATSAPP FORWARD     → Catches 5% more (online receipts, payment apps)
LAYER 4: NOTIFICATION BRIDGE  → Future (for Android users)
LAYER 5: SMART PROMPTING      → Catches the remaining cash/offline transactions
```

---

## LAYER 1: SMS PARSING — THE POWERHOUSE

### What Is It?
Every time you pay via GPay, PhonePe, Paytm, or your debit/credit card — your bank sends you an SMS. This SMS contains everything: amount, merchant name, account balance, transaction type. MoneyViya can read this SMS with your permission and auto-log the transaction.

### Why This Is Your #1 Priority

India's banking system mandates SMS notifications for every account transaction — this is RBI-regulated, not optional for banks. That means every single digital payment your user makes generates an SMS. Every. Single. One.

This is not scraping. This is not hacking. It is reading a message the bank already sent to the user's own phone, with the user's consent.

**What it captures automatically:**
- GPay payments → Bank SMS says "₹500 debited via UPI"
- PhonePe payments → Same SMS trigger
- Paytm → Same
- Credit card swipe → "₹1,200 charged at BigBazaar"
- ATM withdrawal → "₹2,000 withdrawn at ATM"
- Salary credit → "₹45,000 credited — Salary"
- EMI auto-debit → "₹8,500 debited — EMI"
- Subscription → "₹199 debited — Netflix"

**What it CANNOT capture:**
- Cash transactions (user pays roadside vendor in cash)
- UPI peer-to-peer (sometimes SMS delayed)
- International transactions (different format)
- Cash from ATM that then gets spent as cash

### How the SMS Parsing Works (Without Code, Just the Idea)

**Step 1 — Permission:**
MoneyViya (Android app or companion app) asks: "Can I read your bank SMS messages to auto-track expenses?"
This is a single Android READ_SMS permission. Standard. Legal. Used by PhonePe itself.

**Step 2 — Pattern Recognition:**
Every bank SMS follows patterns. The AI learns to extract:
- Amount: "debited by Rs.500" / "₹500 debited" / "INR 500.00 charged"
- Merchant: "at SWIGGY" / "to UPI ID abc@okaxis" / "to AMAZON"
- Account: Last 4 digits (XXXX1234)
- Date/Time: From SMS timestamp
- Transaction type: Debit/Credit

**Step 3 — Smart Categorization:**
- "SWIGGY" → Food Delivery
- "AMAZON" → Shopping
- "BIGBAZAAR" or "DMART" → Groceries
- "NETFLIX" → Entertainment (Streaming)
- "SALARY" in credit → Income
- "EMI" in debit → Debt Repayment
- UPI ID patterns → Identify known merchants vs. person-to-person

**Step 4 — WhatsApp Notification:**
Within 30 seconds of the SMS:
"✅ Auto-logged: ₹500 spent on Food (Swiggy)
 Budget left today: ₹683
 Wrong category? Reply 'fix'"

**Step 5 — Correction Loop:**
User can reply "fix" → Viya asks "What should it be?" → One-tap correction. Over time, AI learns their corrections and improves accuracy.

### The "Instant Feedback Loop" — The Real WOW Moment

This is where MoneyViya becomes magical. Here's the user experience:

```
11:34 AM — User pays ₹650 on Swiggy (GPay)
11:34 AM — Bank SMS arrives
11:34 AM — MoneyViya reads SMS (2 seconds)
11:34 AM — Viya WhatsApp message arrives:

"🍔 Auto-logged!
 ₹650 → Food Delivery (Swiggy)
 Budget left today: ₹533
 
 You've ordered Swiggy 4 times this week!
 That's ₹2,100 this week on food delivery 😅
 Reply 'goal' to see how this affects your bike savings."
```

The user didn't type a single word. They got their expense logged, their budget updated, AND a behavioral insight — all in under 30 seconds.

**This is your product's defining moment. This is why users will tell their friends.**

### What You Need to Build This

**Option A: Android Companion App (Recommended for SMS)**
A lightweight Android app (under 5MB) that:
- Runs in background (like a widget)
- Reads incoming SMS
- Sends relevant ones to MoneyViya API
- Shows no UI of its own (everything happens in WhatsApp)

User installs it once, grants SMS permission once, never opens it again. The magic happens in WhatsApp.

**Option B: Forwarding Partnership**
Some banks now offer official "transaction alert forwarding" — where their app can send data to partner apps. This is more reliable but requires bank partnerships.

**Why Option A first:** Faster to ship, captures all banks simultaneously, no partnerships needed.

### SMS Library Intelligence — The Patterns to Train

Here's the strategic insight: Indian bank SMS messages follow predictable patterns that are well-documented. Your AI needs to be trained on:

- SBI SMS format (largest bank in India — 500M customers)
- HDFC, ICICI, Axis, Kotak formats (private banks)
- Paytm Bank, Airtel Payments Bank (payment banks)
- IDFC First, Yes Bank (tech-forward banks)
- Google Pay, PhonePe's own notification formats
- NACH/ECS debit formats (for EMIs and subscriptions)

Once trained on these patterns, the parser achieves 95%+ accuracy across all Indian banks.

---

## LAYER 2: ACCOUNT AGGREGATOR — THE BANK STATEMENT SUPERPOWER

### What Is It?
The Account Aggregator (AA) framework is an RBI-regulated system that transfers data from one financial institution to another based on an individual's instruction and consent. Think of it as India's version of Open Banking — but more powerful and specifically designed for Indian users.

As of 2025, over 2.2 billion financial accounts are now enabled for secure, consent-based data sharing through the AA framework, with 112.34 million users having already linked their accounts.

### Why This Is Game-Changing for MoneyViya

When you grant consent, your financial data moves digitally from the provider to the user — encrypted, verified, and time-bound. Once you approve the consent request, the app receives the data — but not your login credentials.

This means MoneyViya can receive:
- Complete bank transaction history (going back months)
- Mutual fund portfolio data
- Insurance policy details
- Loan/EMI information
- Fixed deposit information

ALL with user consent. ALL without asking for bank passwords.

### The AA Onboarding Flow for MoneyViya

```
Viya: "Want me to auto-track all your bank transactions?
      I can connect securely to your bank — no passwords needed.
      Takes 2 minutes. [Connect Bank →]"

User taps → Opens AA consent screen
→ User sees exactly what data will be shared (transparent)
→ User sets duration: "Share for 6 months"
→ User approves

MoneyViya now receives:
→ Last 3 months of transactions (historical import)
→ New transactions as they happen (ongoing)
→ All accounts: savings, credit card, RD, FD
```

### What AA Gives You That SMS Cannot

**1. Historical Data Import**
When a user signs up, they can instantly import 3-6 months of past transactions. MoneyViya can immediately show:
- "Your average monthly spending is ₹18,400"
- "You've been paying ₹1,199 for a subscription you haven't used in 4 months"
- "Your spending jumped 40% in December — festivals?"

This is incredibly powerful for onboarding. User signs up and already has 6 months of insights on Day 1.

**2. Credit Card Tracking**
SMS only captures credit card swipes (debit alert). AA captures complete credit card statements — including the billing cycle, minimum due, total due, interest charges. MoneyViya can warn users before they fall into credit card debt.

**3. Investment Tracking**
AA can pull mutual fund NAV and holdings from CAMS/KFintech. MoneyViya shows users their complete net worth — not just spending. SIP auto-deductions are tracked without any manual entry.

**4. Loan Health**
EMI schedules, outstanding principal, interest vs principal split — all pulled automatically. MoneyViya can tell users "You've paid ₹2,40,000 in EMIs so far, ₹1,87,000 was interest."

### How to Integrate the AA Framework

Almost 600 financial institutions participate in the AA framework. Fintechs can offer personalised financial solutions after getting a holistic view of users' financial data.

MoneyViya needs to register as a **Financial Information User (FIU)**. This requires:
- Registering with RBI as an NBFC-AA or partnering with an existing AA
- Implementing the consent framework
- Passing security audits

**The Shortcut:** Instead of building your own AA, partner with existing ones:
- **Setu AA** (by Pine Labs) — Developer-friendly API
- **Finvu** — Most widely adopted consumer AA
- **CAMS Finserv** — Strong for investment data
- **OneMoney** — Good UPI/bank coverage

These providers let you integrate in weeks, not months, through APIs.

---

## LAYER 3: WHATSAPP FORWARD PARSER — THE ZERO-FRICTION BRIDGE

### The Problem This Solves
For GPay, PhonePe, Amazon Pay — the transaction notification appears IN the app, not always via SMS. Users see a beautiful payment success screen but MoneyViya doesn't.

### The Elegant Solution: "Forward to Viya"

**The User Experience:**
```
User pays ₹340 on Amazon Pay for groceries
Amazon Pay shows: "Payment Successful! ₹340 paid"
User sees this notification/screenshot

User long-presses the notification → Share → WhatsApp → MoneyViya contact
OR
User takes screenshot → Sends to MoneyViya WhatsApp

Viya receives image/text → AI reads it in 3 seconds →
"✅ ₹340 from Amazon Pay → Categorized as Groceries
 Is this correct? [Yes ✓] [Fix Category]"
```

### What the AI Needs to Parse (The Intelligence Layer)

**Type 1: Forwarded WhatsApp payment messages**
GPay, PhonePe, Paytm all send WhatsApp confirmation messages. Users can forward these directly to Viya's number.

Format recognition needed:
- "You paid ₹X to [name/merchant] using [app]"
- "₹X sent successfully to UPI ID"
- "Payment of ₹X received from [name]"

**Type 2: Screenshots of payment success screens**
User sends a screenshot. Viya's vision AI reads:
- Amount (look for large bold numbers with ₹)
- Merchant name (usually largest text after amount)
- App logo (identifies which payment app)
- Status (confirmed/success)

**Type 3: Email receipt forwarding**
Users forward bank statements, Amazon receipts, Flipkart order confirmations, Zomato receipt emails to Viya.

AI extracts: merchant, amount, category, date.

### The WhatsApp Forward Prompt for Users

Train users to do this naturally:
```
Viya message (sent during onboarding):
"💡 Quick tip: Whenever you make a payment on GPay, PhonePe, 
or get an email receipt — just forward it here. I'll log it instantly!

Try it now — forward your last payment notification to this chat."
```

This trains the behavior once. After that, it becomes a habit.

---

## LAYER 4: SMART NOTIFICATION BRIDGE (ANDROID) — THE FUTURE LAYER

### What This Is
On Android, apps can request "Notification Access" permission — which lets them read all incoming notifications from ALL apps. This is legal, requires explicit user permission, and is the same system used by smartwatch apps, screen time apps, and accessibility tools.

### What MoneyViya Can Capture with This
- GPay notification: "₹500 paid to Swiggy"
- PhonePe: "Payment successful ₹1,200 to Amazon"
- Paytm: "₹340 paid"
- Credit card app notifications
- Any payment app notification

**Without the user doing anything.** Not forwarding. Not typing. Zero friction.

### Why This Is "Future Layer"
This requires an Android app (not just WhatsApp bot). The companion app you build for SMS reading (Layer 1) can also handle this once the user grants notification access.

The user installs once, grants permission once, and from that point every digital payment is auto-captured — whether GPay, PhonePe, Paytm, credit card, or any payment app.

---

## LAYER 5: THE SMART PROMPT SYSTEM — CATCHING CASH

### The Unsolvable Problem (Almost)
Cash transactions cannot be automatically captured. Ever. When Ravi pays ₹50 to the autorickshaw driver, no digital trace exists.

But cash is still 30-40% of daily spending for many Indian users, especially:
- Street food, chai, vegetables
- Auto/rickshaw/local transport
- Domestic help (maid salary)
- Temple/religious expenses
- Local kirana store (if not on UPI)

### The Smart Solution: Context-Aware Cash Prompting

Instead of asking "did you spend any cash?" generically, Viya asks at the RIGHT moment about the RIGHT category:

**Time-based prompts:**
```
8:00 AM (morning commute time for the user):
"Good morning! Auto/bus fare today? 
Just reply: 'auto 50' and I'll log it 🚖"
```

```
1:00 PM (lunch time):
"Lunch time! Did you eat out today?
Quick reply: amount spent (or 'home' if you ate at home)"
```

```
6:00 PM (evening market time for homemakers):
"Kaviya, evening shopping? 
Type 'veg 200' or 'kirana 350' — I'll handle the rest 🛒"
```

**Pattern-learning prompts:**
If Viya notices every Monday ₹100 is unaccounted for:
"Hey! I notice Mondays you might be spending on something I'm not tracking. 
Local market on Mondays? 🤔"

**Weekly cash estimate:**
At week's end, if cash flow seems off:
"Your income minus tracked expenses leaves ₹2,400 unaccounted this week.
Was this cash spending? Want me to estimate and log it?"

**The "Pocket Money" Feature:**
User says: "I withdrew ₹3,000 from ATM for the week"
Viya tracks this as a "cash budget" envelope — and each day asks for cash spends until the ₹3,000 is accounted for.

---

## THE COMBINED USER EXPERIENCE — ALL LAYERS WORKING TOGETHER

Here's how a real day looks for Ravi (freelancer, ₹30K income) with all 5 layers active:

```
7:30 AM — Ravi takes auto to office. Pays ₹60 cash.
8:02 AM — Viya: "Morning commute? Reply 'auto 60' 🚖"
8:03 AM — Ravi types: "auto 60" → Logged ✅ (Layer 5 — Smart Prompt)

10:15 AM — Ravi orders chai in office canteen. Pays ₹20 UPI.
10:15 AM — Bank SMS arrives. Viya reads it.
10:15 AM — Viya: "☕ ₹20 logged — Canteen. Budget left: ₹1,140" (Layer 1 — SMS)

1:00 PM — Ravi orders Zomato lunch ₹380 via GPay.
1:00 AM — Bank SMS: "₹380 debited via UPI to ZOMATO"
1:00 PM — Viya: "🍽️ ₹380 — Zomato logged! Budget left: ₹760" (Layer 1 — SMS)

3:30 PM — Ravi buys coffee at Starbucks, pays credit card.
3:30 PM — Bank SMS: "₹520 charged to Axis Credit Card at STARBUCKS"
3:30 PM — Viya: "☕ ₹520 — Starbucks via credit card logged!" (Layer 1 — SMS)
3:30 PM — [Silent note: Ravi has ₹520 on his credit card to pay this month]

6:00 PM — Ravi receives ₹12,000 project payment via GPay
6:00 PM — Bank SMS: "₹12,000 credited from UPI"
6:00 PM — Viya: "🎉 ₹12,000 received! Income logged.
            Want to allocate this? 
            Bike goal: ₹3,000? Tax savings: ₹3,600? Reply 'allocate'"
            (Layer 1 — SMS + Investment Intelligence)

8:00 PM — Evening check-in via AA data sync (background)
8:00 PM — Viya shows complete day:
            "📊 Today's summary:
             Auto logged: 4 transactions (₹980 expenses, ₹12,000 income)
             Manual: 1 (auto ₹60)
             Budget: ₹760 remaining
             Great day, Ravi! 💪"
```

**Result: 4 out of 5 transactions happened automatically. User manually entered 1 (cash auto). Zero friction. Complete data.**

---

## THE CONSENT & TRUST ARCHITECTURE

### Why Trust Is Everything Here

Users will give MoneyViya access to their SMS, bank data, and payment notifications only if they fundamentally trust you. One wrong move = they revoke access and never return.

**The 5 Trust Pillars:**

**1. Full Transparency, Always**
Every auto-capture must show the user:
- What was captured
- Where it came from (which source)
- How it was categorized
- How to correct it

Never silently log in the background. Every auto-capture gets a WhatsApp confirmation message. User is always in the loop.

**2. Easy On/Off Controls**
User can turn off any layer independently:
"Pause SMS reading" — works from WhatsApp command
"Stop bank connection" — revokes AA consent in 1 click
"Manual mode only" — everything pauses, only manual entries accepted

**3. Data Never Leaves India**
Servers in India. Complies with DPDP Act 2023. All financial data stored encrypted. Never sold. Never used for ads. This must be stated clearly, repeatedly.

**4. Read-Only, Always**
MoneyViya reads your data. Never writes to your bank. Never initiates payments. Never has your bank password. This distinction must be crystal clear.

**5. The "What We See" Dashboard**
A page that shows users exactly what data MoneyViya has access to and from which sources. Like a permission manager. Users who can see their data feel in control. Users who feel in control, trust you.

---

## IMPLEMENTATION ROADMAP — WHAT TO BUILD WHEN

### Phase 1 (Month 1-2): SMS Parsing — The Quick Win

**Priority:** Highest. Build this first.
**Effort:** Medium (2-3 weeks for solid parser)
**Impact:** Eliminates 70% of manual entry immediately

Build a lightweight Android companion app.
Train the SMS parser on top 15 Indian bank formats.
Add WhatsApp confirmation for every auto-logged transaction.
Build correction flow ("Reply 'fix'" → re-categorize).

**The launch message to users:**
```
Viya: "🆕 Big update! I can now read your bank SMS 
      and auto-log your expenses — no typing needed!
      
      To enable: [Install MoneyViya Tracker →]
      Takes 2 minutes. Your data stays private. 
      You can turn it off anytime."
```

---

### Phase 2 (Month 3-4): WhatsApp Forward Parser

**Priority:** High. Low effort, high user delight.
**Effort:** Low (2-3 days to build vision AI pipeline)
**Impact:** Captures payment app receipts, email receipts

Train the AI to parse:
- Forwarded payment success messages
- Screenshots of payment apps
- Forwarded email receipts

Teach users the habit during onboarding:
"Just forward payment confirmations here — I'll do the rest"

---

### Phase 3 (Month 5-6): Account Aggregator Integration

**Priority:** High. Changes the product fundamentally.
**Effort:** High (need to register as FIU or partner with AA TSP)
**Impact:** Bank-level accuracy, historical import, investment tracking

Partner with Setu AA or Finvu for faster integration.
Focus first on: bank transactions, credit card statements.
Later expand to: mutual funds, insurance, loans.

**The onboarding upgrade:**
```
Viya: "Want to see your COMPLETE financial picture?
      I can connect securely to your bank — no passwords.
      You'll get:
      ✅ All past 6 months auto-imported
      ✅ Credit card tracking
      ✅ Investment overview
      
      Connect Bank → [secure link]"
```

---

### Phase 4 (Month 7+): Notification Bridge

**Priority:** Medium. For power users.
**Effort:** Medium (extend existing companion app)
**Impact:** Captures everything SMS might miss

Add notification access permission to companion app.
Parse payment notifications from GPay, PhonePe, Paytm.
Cross-reference with SMS to avoid duplicates.

---

## THE AI PROMPTS FOR AUTO-CAPTURE SYSTEM

### 🤖 PROMPT 1: SMS TRANSACTION PARSER

```
You are MoneyViya's SMS intelligence engine. Your job is to extract 
financial transaction data from raw Indian bank SMS messages.

EXTRACTION TARGETS:
- transaction_type: "debit" | "credit" | "transfer" | "reversal"
- amount: number (always positive, extract from any format)
- merchant: string (who money went to or came from)
- payment_method: "upi" | "card" | "netbanking" | "neft" | "imps" | "atm" | "cash" | "emi" | "auto_debit"
- bank_name: which bank sent this SMS
- account_last4: last 4 digits of account if present
- balance_after: remaining balance if mentioned
- reference_number: UPI ref/transaction ID if present
- timestamp: from SMS metadata

COMMON INDIAN BANK SMS PATTERNS TO RECOGNIZE:
Format 1 (SBI): "INR {amount} debited from your a/c XXXXNNNN on DD-MON. Ref No. {ref}. Contact helpdesk if not done by you."
Format 2 (HDFC): "Rs.{amount} spent on HDFC Bank Credit Card XX{last4} at {merchant} on {date}."
Format 3 (ICICI): "ICICI Bank Account XX{last4} has been debited with INR {amount} on {date} at {merchant}."
Format 4 (GPay UPI): "Your a/c XX{last4} is debited by {amount} for UPI to {upi_id} on {date}."
Format 5 (Axis): "INR {amount} debited from Axis Ac XX{last4} by UPI on {date}."
Format 6 (Generic Credit): "credited INR {amount}" / "₹{amount} received" / "amount {amount} credited"

MERCHANT INTELLIGENCE — Map UPI IDs to merchants:
- *@oksbi / *@okaxis / *@okicici → Bank transfers (person-to-person, not a merchant)
- zomato@* / swiggy@* → Food delivery
- amazon@* / flipkart@* → E-commerce
- paytm@* → Paytm wallet top-up
- netflix@* / spotify@* / prime@* → Subscription
- Known merchant names in SMS → Extract directly

AMOUNT PARSING RULES:
- "Rs.500" = 500
- "INR 1500.00" = 1500
- "₹2,500" = 2500 (remove comma)
- "50000" as part of "your balance is 50000" = NOT the transaction amount
- Always verify: transaction amount is preceded by "debited", "spent", "paid", or "credited"

CATEGORIZATION (automatic, adjustable by user):
- Swiggy, Zomato, Dominos, Pizza → food_delivery
- BigBazaar, DMart, Spencer's, Reliance Fresh → groceries
- Amazon, Flipkart, Myntra, Ajio → shopping
- Netflix, Spotify, Hotstar, Prime → entertainment_subscription
- BSNL, Airtel, Jio → utilities_telecom
- "Salary" in credit SMS → income_salary
- "EMI", "NACH" in debit → debt_emi
- Ola, Uber, Rapido → transport_cab
- Petrol, HPCL, BPCL, IndianOil → transport_fuel
- Hospital, Pharmacy, MedPlus, Apollo → health
- Unknown merchant → uncategorized (flag for user to categorize)

CONFIDENCE SCORING:
High (>0.9): All fields extracted clearly
Medium (0.7-0.9): Amount clear but merchant uncertain  
Low (<0.7): Parsing uncertain — ask user to confirm

OUTPUT:
{
  "is_financial_transaction": boolean,
  "confidence": 0.0-1.0,
  "transaction": {
    "type": "debit|credit|transfer|reversal",
    "amount": number,
    "merchant": "clean merchant name",
    "category": "from taxonomy",
    "payment_method": "upi|card|netbanking|atm|emi",
    "bank": "bank name",
    "account_last4": "XXXX",
    "balance_after": number or null,
    "reference": "ref number or null",
    "raw_merchant_id": "upi ID or raw merchant string"
  },
  "whatsapp_response": "message to send user in their language",
  "needs_user_confirmation": boolean,
  "duplicate_check": "hash of amount+date for dedup"
}
```

---

### 🤖 PROMPT 2: SCREENSHOT / IMAGE TRANSACTION PARSER

```
You are MoneyViya's visual transaction parser. A user has sent an image 
— either a screenshot of a payment success screen or a forwarded payment 
confirmation.

YOUR JOB: Extract transaction data from visual content.

PAYMENT SUCCESS SCREENS TO RECOGNIZE:
Google Pay: Green checkmark, "Payment Successful", amount in large text, 
            receiver name below, "via Google Pay" or UPI ref
PhonePe: Purple theme, "Money Sent", amount, "to [name/merchant]"
Paytm: Blue theme, amount, "Paid to [name]", "via Paytm"
Amazon Pay: Amazon colors, "Payment of ₹X using Amazon Pay"
BHIM UPI: NPCI branded, "Transaction Successful", amount, UPI ID
Bank apps: Varies by bank — usually shows amount, date, reference number

WHAT TO EXTRACT FROM IMAGES:
1. Amount: The LARGEST number on screen (₹ or Rs prefix)
2. Recipient/Merchant: Usually below amount, smaller text
3. App/Method: From logo/color scheme/watermark
4. Date/Time: Usually at bottom of success screen
5. Status: Confirm it says "Success" / "Paid" / "Sent" — not "Failed" or "Pending"

FOR BANK STATEMENT SCREENSHOTS:
Extract as ARRAY of transactions (multiple rows visible)
For each row: date, description, debit/credit, amount

FOR EMAIL RECEIPTS (forwarded as image/text):
- Amazon order confirmation: Extract order total, item category
- Zomato/Swiggy receipt: Restaurant name, amount, delivery fee separately
- Utility bill: Biller name, amount, period
- Insurance premium: Company, amount, type

AMBIGUOUS CASES:
- Blurry image: Request user to send clearer image
- Partial screenshot: Extract what's visible, flag missing fields
- Non-payment screenshot: "This doesn't look like a payment receipt. What was this for?"

RESPONSE FORMAT:
Same JSON as SMS parser output, PLUS:
"image_type": "payment_success|bank_statement|email_receipt|unknown"
"extraction_method": "ocr_visual"
"clarity_score": 0.0-1.0 (how clear the image was)
```

---

### 🤖 PROMPT 3: ACCOUNT AGGREGATOR DATA PROCESSOR

```
You are MoneyViya's Account Aggregator data intelligence engine. 
You receive structured bank transaction data from the AA framework 
and transform it into MoneyViya's financial model.

AA DATA FORMAT (what banks send via AA):
{
  "account": {
    "type": "SAVINGS|CURRENT|CC|TD|RD",
    "maskedAccountNumber": "XXXXXXXX1234",
    "ifsc": "HDFC0001234",
    "currency": "INR"
  },
  "transactions": [
    {
      "txnId": "TXN123",
      "type": "DEBIT|CREDIT",
      "mode": "UPI|NEFT|IMPS|ATM|POS|ECS",
      "amount": 500.00,
      "currentBalance": 24500.00,
      "transactionTimestamp": "2026-02-17T10:30:00+05:30",
      "valueDate": "2026-02-17",
      "txnNote": "UPI/SWIGGY/ORDER789",
      "reference": "REF456789",
      "narration": "SWIGGY INTERNET PVT"
    }
  ]
}

YOUR PROCESSING TASKS:

1. DEDUPLICATION:
   - AA transactions may overlap with SMS-parsed transactions
   - Match by: amount + date (within 2 hours) + account
   - If duplicate found: Use AA data (more reliable) and discard SMS version

2. CATEGORIZATION:
   Using narration + txnNote + mode to categorize:
   - "SWIGGY" in narration → food_delivery
   - "SALARY" in narration + CREDIT type → income_salary
   - "ECS/NACH" mode → auto_debit (check if EMI or subscription)
   - "ATM" mode → cash_withdrawal (create a "cash budget" for tracking)
   - "POS" mode → in_store_purchase (physical card swipe)
   - UPI with person's name (not merchant) → p2p_transfer (ask user: personal or expense?)

3. HISTORICAL IMPORT INTELLIGENCE:
   When processing 3-6 months of historical data on account linking:
   - Calculate: average_monthly_income, average_monthly_expenses
   - Identify: recurring transactions (same amount, same merchant, monthly)
   - Flag: subscriptions user may have forgotten about
   - Detect: income pattern (salary date, freelance variability)
   - Build: spending baseline by category

4. INSIGHT GENERATION:
   From processed AA data, generate these insights:
   - "You spend an average of ₹X on food every month"
   - "You have 4 subscriptions totaling ₹Y/month (list them)"
   - "Your highest spend month was [month] — ₹Z (festival season?)"
   - "I found a ₹199/month charge to [service] — still using it?"
   - "Your income varies between ₹X and ₹Y — I'll plan for ₹X (conservative)"

5. CREDIT CARD INTELLIGENCE:
   For credit card accounts:
   - Track statement date vs due date
   - Calculate: outstanding_balance, minimum_due, total_due
   - Calculate: credit_utilization_ratio (should be <30%)
   - Flag: if balance is >50% of limit (risk alert)
   - Remind: 5 days before payment due date

OUTPUT STRUCTURE:
{
  "processed_transactions": [...],
  "deduplication_report": {"sms_duplicates_removed": N, "unique_aa_added": M},
  "recurring_detected": [
    {"merchant": "Netflix", "amount": 199, "frequency": "monthly", "category": "subscription"}
  ],
  "historical_insights": [...list of string insights...],
  "monthly_averages": {
    "income": N,
    "expenses_by_category": {...},
    "savings_rate": "X%"
  },
  "credit_alerts": [...],
  "whatsapp_summary": "Human-readable summary message for user in their language"
}
```

---

### 🤖 PROMPT 4: SMART CASH PROMPT ENGINE

```
You are MoneyViya's cash transaction intelligence system. 
Since cash cannot be auto-captured, you must prompt users intelligently 
to log their cash expenses — at the RIGHT time, with the RIGHT question.

YOUR INTELLIGENCE LAYER:

1. ROUTINE LEARNING:
   After 2 weeks, you've identified user patterns:
   - Ravi always spends on auto every weekday morning (₹40-80)
   - Meena buys vegetables every Tuesday (₹150-300)
   - Karan gets chai from canteen at 3 PM (₹20)
   
   Use these patterns to ask at the right time.

2. CASH FLOW GAP DETECTION:
   Income tracked - Expenses tracked = Unaccounted amount
   If gap > 15% of daily budget → Investigate
   "Ravi, I see ₹840 unaccounted today. Any cash spending?"

3. ATM WITHDRAWAL TRACKING:
   When SMS shows ATM withdrawal:
   "₹2,000 withdrawn from ATM! I'll help you track how you spend this.
   Daily I'll ask: 'Cash spent today?' until the ₹2,000 is accounted for."
   
   Start a "cash envelope" for ₹2,000. Each day, reduce by what's logged.

4. CONTEXTUAL TIMING:
   Morning (8-9 AM): Commute expenses
   Afternoon (1-2 PM): Lunch if no food delivery detected
   Evening (6-7 PM): Market / grocery / chai
   Night (9-10 PM): Any remaining cash spent today?

5. FRICTION-MINIMAL PROMPTING:
   Never ask open-ended "any cash spending?"
   Always ask specific, easy-to-answer questions:
   
   BAD: "Did you spend any cash today?"
   GOOD: "Auto fare today? Reply: auto [amount] 🚖"
   
   BAD: "What did you buy at the market?"
   GOOD: "Veg/kirana shopping today? Reply: kirana [amount] 🛒"

USER DATA INPUT:
Name: {user_name}
Language: {language}
Time: {current_time}
Day: {day_of_week}
Current routine patterns: {learned_patterns}
Recent ATM withdrawal: {atm_withdrawal_pending} (or null)
Today's cash gap: ₹{cash_gap}
User occupation: {occupation}
Last prompt sent: {last_prompt_time}

RULES:
- Never send more than 2 cash prompts per day
- If user didn't respond to last prompt, don't ask same thing again
- If user says "nothing" or "no" — don't ask again for that period
- If gap is <₹100 — don't bother asking (not worth the friction)
- Weekend prompts are different (no commute, different spending pattern)

OUTPUT:
{
  "should_prompt": boolean,
  "prompt_type": "routine|atm_tracking|gap_investigation",
  "message": "specific WhatsApp message in {language}",
  "best_send_time": "HH:MM",
  "expected_response_format": "what user would reply to log"
}
```

---

### 🤖 PROMPT 5: DUPLICATE DETECTION & RECONCILIATION

```
You are MoneyViya's transaction reconciliation engine. When multiple 
data sources are active (SMS + AA + Screenshot), the same transaction 
may appear multiple times. You must detect and merge duplicates.

DUPLICATE DETECTION RULES:

DEFINITE DUPLICATE (merge automatically):
- Same amount + same date (within 2 hour window) + same account = DUPLICATE
- Example: SMS "₹500 debited" at 10:30 AND AA record "₹500 debit" at 10:28 = same transaction

PROBABLE DUPLICATE (merge with low-confidence flag):
- Same amount + same day + different source = PROBABLE (90% likely same)
- Same merchant + same week + same amount = PROBABLE (check if recurring)

NOT A DUPLICATE:
- Same merchant, same amount, DIFFERENT day = two separate transactions
- Example: ₹199 Netflix on 1st Feb AND ₹199 Netflix on 1st March = two separate monthly charges

MERGE PRIORITY (which source to keep when merging):
1. AA data (most authoritative — straight from bank)
2. SMS data (near real-time, reliable)
3. Screenshot/OCR data (user-submitted, may have OCR errors)
4. Manual entry (user-typed, may have typos)

When merging:
- Keep amount from highest priority source
- Keep merchant from whichever source has cleaner data
- Merge any notes/corrections user made
- Log which sources contributed (for audit trail)

RECONCILIATION REPORT (weekly, to user):
"📊 This week Viya auto-captured 47 transactions from:
 • Bank SMS: 32 transactions
 • Account Aggregator: 12 transactions  
 • Screenshots you shared: 3 transactions
 • Manual entries: 4 transactions
 
 2 duplicates detected and removed automatically.
 Coverage: ~87% of your spending tracked 👍"

INPUT:
{list of transactions from all sources with metadata}

OUTPUT:
{
  "unique_transactions": [...deduplicated list...],
  "duplicates_removed": N,
  "merge_log": [...what was merged and why...],
  "coverage_score": "X%",
  "uncovered_gaps": [...time periods with no data...]
}
```

---

## THE HONEST SUMMARY — WHAT TO BUILD IN WHAT ORDER

| Layer | What It Solves | How Hard | When to Build |
|---|---|---|---|
| Smart Prompting | Cash & forgotten expenses | Easy | Day 1 (already doable in WhatsApp) |
| SMS Parsing | 70% of all digital payments | Medium | Month 1-2 (build companion app) |
| WhatsApp Screenshot | App receipts, email receipts | Easy | Month 2-3 (add vision AI) |
| Account Aggregator | Bank-level accuracy, history | Hard | Month 4-6 (register as FIU) |
| Notification Bridge | Everything else | Medium | Month 7+ (extend companion app) |

**The North Star:** When all layers are working, MoneyViya should capture 90%+ of user transactions automatically. The user's job becomes only logging cash, and even that is guided by intelligent prompts. This is the standard you're building towards.

---

> **Final Product Thought:**
> The best finance app is one where the user does nothing, but knows everything. That's what these 5 layers achieve together. Build them in order. Ship fast. Each layer independently makes MoneyViya dramatically better — and together, they make manual entry feel like something from 2015.

---
*MoneyViya Auto-Capture Architecture v1.0 — Zero Friction Finance* 🇮🇳
