"""
MoneyViya 2.0 — Specialist Agent System
=========================================
Multi-Agent Architecture: 5 Specialist AI Agents that transform
MoneyViya from an expense tracker into a complete AI Life & Money Manager.

Agents:
1. IncomeAgent — Passive + active income ideas by persona
2. CareerAgent — Career paths, salary benchmarks, interview prep
3. LearningAgent — Course recommendations with ROI analysis
4. ProductivityAgent — Habits, time management, daily planning
5. TaxAgent — GST, ITR, tax optimization, invoicing

Each agent:
- Has deep knowledge for its domain
- Adapts to user's persona (student/freelancer/homemaker/salaried/business)
- Uses OpenAI for complex queries, local intelligence for common ones
- Returns WhatsApp-formatted responses
"""

from typing import Dict, Optional
import random, re
from datetime import datetime


# ═══════════════════════════════════════════════════════════════
# INCOME AGENT — Help users EARN MORE (active + passive)
# ═══════════════════════════════════════════════════════════════

class IncomeAgent:
    """Helps users generate income — both active (freelancing, side hustle)
    and passive (courses, affiliate, investments, digital products)."""
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        income = user.get("monthly_income", 0)
        occupation = user.get("occupation", "")
        msg_lower = message.lower()
        
        # Route to specific income feature
        if any(w in msg_lower for w in ["passive", "passive income", "earn while sleeping",
                                         "side income", "extra income", "paisa kamana"]):
            return self._passive_income_ideas(user)
        
        if any(w in msg_lower for w in ["freelance", "freelancing", "upwork", "fiverr",
                                         "client", "gig", "project work"]):
            return self._freelance_guide(user)
        
        if any(w in msg_lower for w in ["earn more", "increase income", "zyada kamana",
                                         "income badhana", "growth", "raise"]):
            return self._income_growth_strategy(user)
        
        if any(w in msg_lower for w in ["income source", "income streams", "multiple income",
                                         "diversify"]):
            return self._income_diversification(user)
        
        # Default: show all income options for their persona
        return self._income_overview(user)
    
    def _passive_income_ideas(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        income = user.get("monthly_income", 0)
        
        ideas = {
            "student": f"""💡 *Passive Income Ideas for Students*

1️⃣ *Sell Study Notes* (Zero effort, existing work)
   📚 Platforms: Stuvia, Studocu, NotesGen
   💰 Earning: ₹1,500-₹3,000/month
   ⏰ Time: You already have the notes!

2️⃣ *YouTube Study Vlogs* (Low effort, fun)
   🎥 Film study routine + tips
   💰 Monetize in 6-12 months: ₹5,000-₹20,000/month
   ⏰ 2 hours/week

3️⃣ *Campus Ambassador Programs*
   🏢 Join: Internshala, Unacademy, Coding Ninjas
   💰 ₹500-₹2,000/month + free courses
   ⏰ 3-5 hours/week

4️⃣ *Referral Income* (1-click passive)
   📱 Groww, Upstox, Zerodha: ₹300-₹600/referral
   💰 50 friends = ₹15,000-₹30,000 one-time

5️⃣ *Mini Digital Products*
   📝 Canva templates, Notion templates, cheat sheets
   💰 ₹2,000-₹8,000/month on Gumroad/Instamojo

_Reply a number (1-5) for detailed roadmap!_ 🚀""",
            
            "freelancer": f"""💡 *Passive Income Ideas for Freelancers*

1️⃣ *Create an Online Course* (High effort → recurring income)
   📚 You've done 40+ projects — teach what you know!
   💰 Potential: ₹8,000-₹25,000/month passive
   ⏰ 30-40 hours upfront, then hands-off
   📍 Udemy, Teachable, Skillshare

2️⃣ *Template/Asset Library*
   🎨 Sell your design templates, code snippets, presets
   💰 ₹5,000-₹30,000/month on Gumroad/Creative Market
   ⏰ Repackage work you've already done!

3️⃣ *Affiliate Marketing*
   🔗 Share affiliate links for tools you genuinely use
   💰 ₹2,000-₹8,000/month (Figma, AWS, hosting, etc.)
   ⏰ 1 hour/week — just share naturally

4️⃣ *YouTube Tutorials*
   🎥 Repurpose client work into tutorials
   💰 ₹15,000-₹50,000/month after 1 year
   ⏰ 3-5 hours/week

5️⃣ *SaaS Micro-Product*
   🔧 Build a small tool that solves a specific problem
   💰 ₹20,000-₹1,00,000/month (scalable!)
   ⏰ 100-200 hours upfront

_Reply a number for a detailed 90-day action plan!_ 🚀""",
            
            "homemaker": f"""💡 *Income Ideas from Home*

1️⃣ *Tiffin Service* (High demand, local)
   🍱 Start: 5 tiffins/day @ ₹120 = ₹18,000/month
   📈 Scale: 15/day = ₹54,000/month
   💵 Setup: ₹15,000 (containers, packaging)
   ⏰ 3-4 hours/day

2️⃣ *Online Tutoring* (Flexible timing)
   📚 Help kids with homework (Classes 1-8)
   💰 ₹200-₹400/hour × 2 hours/day = ₹12,000-₹24,000/month
   📍 Vedantu, Chegg, local WhatsApp groups

3️⃣ *Recipe E-Book + YouTube*
   📖 Your family loves your cooking — share with the world!
   💰 E-book: ₹3,000-₹8,000/month passive
   🎥 YouTube: ₹20,000-₹1,00,000/month after 1 year

4️⃣ *Reselling Business*
   👗 Sarees, kids clothes, home decor
   📍 Meesho, WhatsApp Business
   💰 ₹8,000-₹20,000/month profit
   💵 Start with just ₹10,000

5️⃣ *Digital Products*
   📋 Meal planners, budget sheets, recipe cards
   💰 Sell on Etsy/Gumroad: ₹5,000-₹12,000/month
   ⏰ 20 hours total to create

_Reply a number for a step-by-step business plan!_ 🚀""",
            
            "salaried": f"""💡 *Passive Income for Busy Professionals*

You have 2 hours/day + weekends. Here's what works:

1️⃣ *Freelance Your Skill* (Immediate income)
   🔧 Use your 9-5 skill on weekends
   💰 ₹25,000-₹50,000/month extra
   📍 Upwork, Toptal, direct clients
   ⏰ 10 hours/week (weekends)

2️⃣ *Dividend Stocks* (True passive)
   📈 Invest in high-dividend stocks
   💰 4-6% yield — ₹2,000-₹5,000/month on ₹5L invested
   ⏰ 0 hours/week after setup

3️⃣ *Create Online Course* (Build once, earn forever)
   📚 Topic: Your professional expertise
   💰 ₹8,000-₹25,000/month long-term
   ⏰ 30-40 hours upfront (1-2 months)

4️⃣ *P2P Lending* (Medium passive)
   🏦 Faircent, LenDenClub
   💰 12-18% returns → ₹1,200-₹1,500/month on ₹1L
   ⏰ 1 hour/month

5️⃣ *Digital Products/Templates*
   📝 Excel templates, Notion setups, industry guides
   💰 ₹3,000-₹15,000/month on Gumroad
   ⏰ 20-40 hours to create

_Reply a number for complete action plan!_ 🚀""",
            
            "business_owner": f"""💡 *Income Diversification for Business Owners*

1️⃣ *Productize Your Service* (Scale without hiring)
   📦 Turn your service into a product/template
   💰 Recurring revenue without proportional effort

2️⃣ *White-Label / Franchise Model*
   🏢 Let others run your business model
   💰 Franchise fees + royalty = passive

3️⃣ *Digital Presence*
   🎥 YouTube/Instagram showcasing your expertise
   💰 Ad revenue + leads = double benefit

4️⃣ *Real Estate from Business Profits*
   🏠 Use business profits for commercial property
   💰 Rental yield 4-6% + appreciation

5️⃣ *Business Consulting*
   💼 Teach others what you learned building your business
   💰 ₹5,000-₹25,000/hour consulting

_Reply a number for implementation guide!_ 🚀"""
        }
        
        result = ideas.get(persona, ideas["salaried"])
        return result
    
    def _freelance_guide(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        
        return f"""🚀 *{name}'s Freelancing Roadmap*

*Phase 1: Setup (Week 1-2)*
✅ Create profile on Upwork + Fiverr
✅ Write a killer bio (I can help draft it!)
✅ Set competitive rates (start 20% below market, raise after 5 reviews)
✅ Build 3 portfolio samples

*Phase 2: First Clients (Week 3-4)*
✅ Apply to 10 projects/day
✅ Write personalized proposals (not copy-paste!)
✅ Take small projects for reviews
✅ Target: First ₹5,000 earned

*Phase 3: Scale (Month 2-3)*
✅ Raise rates by 30%
✅ Get repeat clients (80% of income should be recurring)
✅ Add direct clients (LinkedIn outreach)
✅ Target: ₹25,000-₹40,000/month

*Top Platforms:*
🌐 Upwork — Long-term projects
🎯 Toptal — Premium rates (top 3%)
🎨 Fiverr — Quick gigs
💼 LinkedIn — Direct clients (highest margins)

*Freelance Rates (India 2026):*
🤖 AI/ML: ₹2,500-₹5,000/hour
💻 Full-Stack Dev: ₹1,200-₹3,000/hour
🎨 UI/UX Design: ₹1,000-₹2,500/hour
✍️ Content Writing: ₹400-₹1,500/hour
📹 Video Editing: ₹800-₹2,000/hour

_Want me to help write your freelance profile? Just say "write my profile"!_ ✍️"""
    
    def _income_growth_strategy(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        persona = user.get("persona", "salaried")
        occupation = user.get("occupation", "professional")
        
        if not income:
            income = 30000
        
        target_6m = int(income * 1.5)
        target_1y = int(income * 2)
        
        return f"""📈 *{name}'s Income Growth Strategy*

💰 Current: ₹{int(income):,}/month
🎯 6-Month Target: ₹{int(target_6m):,}/month (+50%)
🚀 1-Year Target: ₹{int(target_1y):,}/month (+100%)

*How to get there:*

📊 *Active Income Growth (faster):*
1. Skill upgrade → Higher-paying role/clients
   _(Type "learn" for skill recommendations)_
2. Negotiate salary/rates (most people undercharge by 30-40%)
3. Add freelance income on top of existing work

📊 *Passive Income Layer (slower but compounds):*
1. Start with ₹{int(income * 0.1):,}/month in SIP → builds to ₹{int(income * 0.1 * 72):,} in 5 years
2. Build ONE digital product (course/template)
3. Start content creation (YouTube/Instagram)

*The Math:*
If you add ₹{int(income * 0.3):,}/month freelance income
+ ₹{int(income * 0.1):,}/month passive
= ₹{int(income * 1.4):,}/month total (+40% in 6 months!)

*First Step Today:*
→ Type "passive income" for ideas
→ Type "freelance" for freelancing guide
→ Type "learn" for skill upgrade path"""
    
    def _income_diversification(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        
        return f"""🔄 *{name}'s Income Diversification Plan*

*Current:* 1 income source = HIGH RISK ⚠️
*Goal:* 3+ income sources = FINANCIAL SECURITY ✅

*The 3-Layer Income Model:*

*Layer 1: Primary Income (60-70%)*
💼 Your main job/business
→ Focus on growth: promotions, rate increases

*Layer 2: Active Side Income (20-25%)*
🔧 Freelancing, consulting, tutoring
→ Use existing skills, 5-10 hrs/week
→ Target: ₹{int(income * 0.3):,}/month

*Layer 3: Passive Income (10-15%)*
📈 Investments, digital products, content
→ Build systems that earn while you sleep
→ Target: ₹{int(income * 0.15):,}/month in Year 1

*Timeline to 3 Streams:*
Month 1-2: Start Layer 2 (first freelance clients)
Month 3-6: Grow Layer 2 to ₹{int(income * 0.2):,}/month
Month 6-12: Build Layer 3 (course, YouTube, investments)

*Why This Matters:*
If you lose your primary income:
❌ 1 stream: ₹0 immediately (panic)
✅ 3 streams: Still have ₹{int(income * 0.4):,}/month (breathing room)

_Which layer do you want to start building?_ 🚀"""
    
    def _income_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        income = user.get("monthly_income", 0)
        
        return f"""💰 *{name}, let's grow your income!*

I can help you with:

1️⃣ *Passive Income Ideas* — Earn while you sleep
   Type: "passive income"

2️⃣ *Freelancing Guide* — Start freelancing today
   Type: "freelance"

3️⃣ *Income Growth Strategy* — 2x your income in 1 year
   Type: "earn more"

4️⃣ *Income Diversification* — Build 3+ income streams
   Type: "income streams"

5️⃣ *Skill-Based Earning* — Which skills pay most?
   Type: "learn to earn"

💡 *Quick Fact:*
Top earners have 3.2 income streams on average.
You currently have: 1
Let's change that! 🚀

_Just type what interests you!_"""


# ═══════════════════════════════════════════════════════════════
# CAREER AGENT — Career growth, job search, salary negotiation
# ═══════════════════════════════════════════════════════════════

class CareerAgent:
    """Career strategist & coach — job search, resume, interview,
    salary negotiation, career switches, promotions."""
    
    SALARY_BENCHMARKS = {
        "software engineer": {"0-2": "4-8L", "2-5": "8-18L", "5-8": "18-35L", "8+": "35-70L"},
        "data scientist": {"0-2": "5-10L", "2-5": "10-22L", "5-8": "22-40L"},
        "product manager": {"0-2": "6-12L", "2-5": "15-30L", "5-8": "30-55L"},
        "ui/ux designer": {"0-2": "3-7L", "2-5": "8-18L", "5-8": "18-30L"},
        "marketing": {"0-2": "3-6L", "2-5": "6-15L", "5-8": "15-30L"},
        "content writer": {"0-2": "2-5L", "2-5": "5-10L", "5-8": "10-18L"},
        "teacher": {"0-2": "2-4L", "2-5": "4-8L", "5-8": "8-15L"},
        "accountant": {"0-2": "3-5L", "2-5": "5-10L", "5-8": "10-18L"},
    }
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["salary", "pay", "compensation", "ctc",
                                         "kitna milta", "package"]):
            return self._salary_insights(user)
        
        if any(w in msg_lower for w in ["switch", "change job", "new job", "resign",
                                         "quit", "naukri", "job search"]):
            return self._job_switch_analysis(user)
        
        if any(w in msg_lower for w in ["resume", "cv", "bio data"]):
            return self._resume_tips(user)
        
        if any(w in msg_lower for w in ["interview", "prepare", "leetcode", "dsa"]):
            return self._interview_prep(user)
        
        if any(w in msg_lower for w in ["promotion", "hike", "appraisal", "raise"]):
            return self._promotion_guide(user)
        
        if any(w in msg_lower for w in ["career path", "roadmap", "what should i do",
                                         "confused about career"]):
            return self._career_path(user)
        
        return self._career_overview(user)
    
    def _salary_insights(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        occupation = user.get("occupation", "professional")
        yearly = income * 12 if income else 0
        
        return f"""💵 *{name}'s Salary Analysis*

📊 *Your Current:* ₹{int(income):,}/month (₹{int(yearly):,}/year)

*Industry Benchmarks (India 2026):*

💻 *Tech:*
  Software Engineer (0-2yr): ₹4-8L/year
  Software Engineer (2-5yr): ₹8-18L/year
  Senior SDE (5-8yr): ₹18-35L/year
  Lead/Architect (8+yr): ₹35-70L/year

📊 *Data & AI:*
  Data Analyst: ₹4-12L/year
  Data Scientist: ₹8-22L/year
  AI/ML Engineer: ₹10-30L/year

📱 *Product & Design:*
  Product Manager: ₹12-30L/year
  UI/UX Designer: ₹6-18L/year

📈 *Business:*
  Marketing Manager: ₹6-15L/year
  HR Manager: ₹5-12L/year
  Finance/CA: ₹8-20L/year

⚡ *City Adjustments:*
  Bangalore/Mumbai: +20% above average
  Delhi/Hyderabad: +10%
  Tier-2 cities: -20% to -30%

💡 *Are you underpaid?* If your salary is below the lower range for your role, it's time to negotiate or switch!

_Type "switch job" for job change analysis_
_Type "promotion" for internal growth tips_"""
    
    def _job_switch_analysis(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        savings = user.get("current_savings", 0)
        expenses = user.get("monthly_expenses", 0)
        
        runway = savings / expenses if expenses > 0 else 0
        expected_hike = int(income * 1.3)  # 30% avg switch hike
        
        return f"""🔄 *{name}'s Job Switch Analysis*

📊 *Financial Readiness:*
💰 Current Salary: ₹{int(income):,}/month
🏦 Savings: ₹{int(savings):,}
📅 Emergency Runway: {runway:.1f} months {"✅" if runway >= 3 else "⚠️ (need 3+ months)"}

📈 *Switch Benefits (typical):*
💵 Expected new salary: ₹{int(expected_hike):,}/month (+30% hike)
📅 Extra ₹{int(expected_hike - income):,}/month = ₹{int((expected_hike - income) * 12):,}/year more

✅ *Switch Readiness Checklist:*
{"✅" if runway >= 3 else "❌"} 3+ months emergency fund
{"✅" if income > 0 else "❌"} Have current job (never quit before next offer)
{"❌"} Skills updated for target role
{"❌"} Resume optimized
{"❌"} 50+ LeetCode problems done (for tech roles)
{"❌"} 10 companies shortlisted

📋 *90-Day Switch Plan:*
*Month 1:* Resume + Skills
  - Update resume (I can help!)
  - Fill skill gaps (top 2 skills)
  - Connect with 20 people on LinkedIn

*Month 2:* Interviews
  - Apply to 10 companies/week
  - Practice: 2 mock interviews/week
  - Negotiate every offer

*Month 3:* Transition
  - Accept best offer (aim for ₹{int(expected_hike):,}+)
  - Smooth handover (protect reputation)
  - Start strong at new company

_Type "resume" for resume tips_
_Type "interview prep" for preparation plan_"""
    
    def _interview_prep(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        
        return f"""📝 *{name}'s Interview Prep Guide*

*90-Day Preparation Plan:*

📌 *Week 1-4: Fundamentals*
  ✅ DSA: 50 LeetCode problems (20 Easy, 25 Medium, 5 Hard)
  ✅ System Design: Read "Designing Data-Intensive Applications"
  ✅ Behavioral: Prepare STAR stories for 10 common questions
  ⏰ 2 hours/day

📌 *Week 5-8: Practice*
  ✅ DSA: 50 more problems (focused on company patterns)
  ✅ System Design: Practice 5 designs (URL shortener, chat, etc.)
  ✅ Mock Interviews: 3 sessions on Pramp/Interviewing.io
  ⏰ 2 hours/day

📌 *Week 9-12: Company-Specific*
  ✅ DSA: 50 company-tagged problems
  ✅ Company research: Culture, products, recent news
  ✅ Mock Interviews: 2 more sessions
  ✅ Start applying!
  ⏰ 2-3 hours/day

*🎯 STAR Method for Behavioral:*
📍 *S*ituation — Set the scene
📍 *T*ask — What was your responsibility
📍 *A*ction — What YOU specifically did
📍 *R*esult — Measurable outcome (numbers!)

*Top Resources:*
💻 LeetCode Premium (₹1,500/month) — Most important investment
📖 "Cracking the Coding Interview" — The bible
🎥 NeetCode YouTube — Visual DSA explanations
🤝 Pramp.com — Free mock interviews

_I'll track your prep progress! Type "interview progress" to see where you stand_ 📊"""
    
    def _resume_tips(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""📄 *{name}'s Resume Power-Up Guide*

*5 Rules for a Winning Resume:*

1️⃣ *Impact, Not Responsibilities*
   ❌ "Worked on React projects"
   ✅ "Built 3 React apps serving 50K+ users, reducing load time by 40%"

2️⃣ *Numbers Everywhere*
   ❌ "Improved sales"
   ✅ "Increased sales by 35% (₹12L additional revenue in Q3)"

3️⃣ *ATS-Friendly Format*
   ✅ Simple layout (no fancy graphics for ATS)
   ✅ Use job description keywords
   ✅ PDF format always

4️⃣ *Length Rules*
   📏 0-5 years: 1 page strict
   📏 5-10 years: 1-2 pages
   📏 10+ years: 2 pages max

5️⃣ *Top Section = High Impact*
   📍 Name + contact
   📍 2-line professional summary
   📍 Key skills (matching job description)
   📍 Experience (most recent first)
   📍 Education + Certifications

*Quick Wins:*
• Remove "Objective" section (outdated)
• Add GitHub/Portfolio link
• List 3 strongest technical skills first
• Include 1-2 quantified achievements per role

_Send me your current resume text and I'll suggest improvements!_ ✍️"""

    def _promotion_guide(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        
        return f"""🚀 *{name}'s Promotion Strategy*

*How to Get Promoted (instead of just hoping):*

📋 *Step 1: Know the Criteria*
  Ask your manager directly:
  "What specific things do I need to demonstrate for the next level?"
  Write it down. This is your promotion checklist.

📋 *Step 2: Visibility > Hard Work*
  Working hard alone ≠ promotion
  You need to make your work VISIBLE:
  • Send weekly updates to your manager
  • Present in team meetings
  • Share wins on internal channels
  • Volunteer for high-visibility projects

📋 *Step 3: Build Your Case (Document Everything)*
  Create a "brag document" with:
  • Projects delivered + impact (with numbers)
  • Skills developed
  • Cross-team collaborations
  • Mentoring/helping others
  
  Update this weekly. Use it during appraisal.

📋 *Step 4: Get a Sponsor (Not Just a Mentor)*
  Mentor = gives advice
  Sponsor = advocates for you in rooms you're not in
  Find a senior leader and build relationship.

📋 *Step 5: The Ask*
  Don't wait for appraisal cycle.
  Schedule a 1:1: "Based on my contributions [share brag doc], I'd like to discuss my growth path and promotion timeline."

💡 *Expected Promotion Hike:*
  Internal: 15-25% typically
  If below, negotiate or switch (30%+ hike)

_Type "salary" to check if you're underpaid_"""
    
    def _career_path(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        
        if persona == "student":
            return f"""🎯 *{name}'s Career Path Options*

Based on job market data (2026):

🔥 *Highest Demand + Highest Pay:*
1. AI/ML Engineer — 32K openings, ₹12L+ starting
2. Full-Stack Developer — 28K openings, ₹8L+ starting
3. Cloud Engineer (AWS/Azure) — 22K openings, ₹10L+ starting
4. Data Analyst — 18K openings, ₹6L+ starting
5. Cybersecurity — 15K openings, ₹8L+ starting

🏢 *Best Companies for Freshers:*
  FAANG: Google, Amazon, Microsoft, Meta
  Indian Tech: Flipkart, PhonePe, Razorpay, CRED
  Startups: Higher learning, stock options

📊 *Career Path Comparison:*
  Software Dev → 5 years → ₹18-35L
  Data Science → 5 years → ₹15-30L
  Product Mgmt → 5 years → ₹20-40L
  
*What interests you most?* Reply with the career path name and I'll create a complete roadmap! 🚀"""
        
        return f"""🎯 *{name}, here's my career advice:*

Type what you need:
• "salary" — Am I paid fairly?
• "switch job" — Should I change companies?
• "promotion" — How to get promoted?
• "resume" — Resume improvement tips
• "interview prep" — Prepare for interviews
• "career path" — What's the best path for me?

_Your career is the biggest asset you have — let's make it grow!_ 💼"""
    
    def _career_overview(self, user: Dict) -> str:
        return self._career_path(user)


# ═══════════════════════════════════════════════════════════════
# LEARNING AGENT — Strategic skill development with ROI
# ═══════════════════════════════════════════════════════════════

class LearningAgent:
    """Course recommendations with ROI analysis. Makes learning
    strategic — not random courses, but income-impacting skills."""
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["course", "learn", "study", "padhai",
                                         "certification", "certificate"]):
            return self._recommend_courses(user)
        
        if any(w in msg_lower for w in ["skill gap", "what to learn", "kya seekhu",
                                         "which skill", "best skill"]):
            return self._skill_gap_analysis(user)
        
        if any(w in msg_lower for w in ["roadmap", "learning path", "learning plan"]):
            return self._learning_roadmap(user)
        
        if any(w in msg_lower for w in ["free", "free course", "scholarship"]):
            return self._free_resources(user)
        
        return self._learning_overview(user)
    
    def _recommend_courses(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        income = user.get("monthly_income", 0)
        
        return f"""📚 *Top Courses with Income ROI (2026)*

*🤖 AI & Machine Learning*
  📍 Andrew Ng ML Specialization (Coursera)
  💰 Cost: Free audit / ₹4,000 for certificate
  📈 Income Impact: +₹20,000-₹50,000/month
  ⏰ 3-4 months (6 hrs/week)
  🎯 ROI: 500%+ in first year

*☁️ Cloud Computing (AWS)*
  📍 AWS Solutions Architect (Udemy + AWS Exam)
  💰 Cost: ₹2,000 course + ₹10,000 exam
  📈 Income Impact: +₹15,000-₹30,000/month
  ⏰ 2-3 months
  🎯 ROI: 250%+ in first year

*💻 Full-Stack Development (MERN)*
  📍 FreeCodeCamp + The Odin Project
  💰 Cost: FREE
  📈 Income Impact: +₹10,000-₹25,000/month (freelance)
  ⏰ 4-6 months
  🎯 ROI: Infinite (free!)

*📊 Data Analytics*
  📍 Google Data Analytics Certificate (Coursera)
  💰 Cost: Free with financial aid
  📈 Income Impact: +₹8,000-₹20,000/month
  ⏰ 4-6 months
  🎯 ROI: Infinite (if aid approved)

*📱 Digital Marketing*
  📍 Google Digital Garage + HubSpot Academy
  💰 Cost: FREE
  📈 Income Impact: +₹10,000-₹25,000/month (freelance)
  ⏰ 2-3 months
  🎯 ROI: Infinite

_Which course interests you? I'll create a study schedule!_ 🎯"""
    
    def _skill_gap_analysis(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        persona = user.get("persona", "salaried")
        occupation = user.get("occupation", "professional")
        
        top_skill_income = int(income * 2) if income else 50000
        
        return f"""🔍 *{name}'s Skill Gap Analysis*

📊 *Current Income:* ₹{int(income):,}/month
🎯 *Potential with right skills:* ₹{int(top_skill_income):,}/month

*Most Impactful Skills to Learn (2026):*

🥇 *#1: AI/ML + LLMs*
   Gap: Most professionals lack this
   Impact: +100% to +300% income
   Learn: 4-6 months serious effort
   Why: Every company needs AI talent

🥈 *#2: Cloud (AWS/GCP/Azure)*
   Gap: Only 15% of devs are cloud-certified
   Impact: +40% to +80% income
   Learn: 2-3 months
   Why: Cloud is the new normal

🥉 *#3: Data Skills (Python + SQL + Analytics)*
   Gap: Data literacy is the new English
   Impact: +30% to +60% income
   Learn: 3-4 months
   Why: Every role needs data skills now

*Skill Combinations That Pay Most:*
💎 React + TypeScript + Node.js = ₹15-25L/year
💎 Python + ML + Cloud = ₹18-35L/year
💎 Product + Data + Design = ₹20-40L/year

*Your Recommended Learning Order:*
1. First: The skill with highest income impact for YOUR role
2. Then: A complementary skill that makes you rare
3. Finally: A creative skill for passive income

_Tell me your current skills and I'll create a personalized gap analysis!_ 📋"""
    
    def _learning_roadmap(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🗺️ *{name}'s 6-Month Learning Roadmap*

*Month 1-2: Foundation*
📚 Pick ONE high-impact skill
✅ Enroll in recommended course
✅ Study 1 hour/day (consistency > intensity)
✅ Build 1 small project
🎯 Goal: Complete 50% of course

*Month 3-4: Application*
📚 Complete course + certification
✅ Build 2 portfolio projects
✅ Write about your learning (LinkedIn/blog)
✅ Start applying skill at work
🎯 Goal: Have 3 projects to show

*Month 5-6: Monetization*
📚 Start earning from new skill
✅ Freelance: Take first paid project
✅ Job: Apply to higher-paying roles
✅ Teach: Create content about what you learned
🎯 Goal: New skill generating income

*The Power of 1 Hour/Day:*
365 hours/year = equivalent to 9 work-weeks
That's enough to become proficient in ANY skill!

_Type "courses" to see top courses_
_Type "skill gap" for personalized analysis_"""
    
    def _free_resources(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🆓 *{name}, here are the BEST free learning resources!*

*💻 Coding & Tech:*
  📍 FreeCodeCamp — Full-stack, 100% free, certificates
  📍 The Odin Project — Full-stack web dev
  📍 CS50 (Harvard) — Best intro to CS, free on YouTube
  📍 MIT OpenCourseWare — University-level, 100% free

*📊 Data & AI:*
  📍 Kaggle Learn — Hands-on data science, free
  📍 Fast.ai — Practical deep learning, free
  📍 Google Colab — Free GPU for ML experiments

*📱 Digital Marketing:*
  📍 Google Digital Garage — Certified, free
  📍 HubSpot Academy — Marketing + Sales, free
  📍 Meta Blueprint — Social media marketing, free

*☁️ Cloud:*
  📍 AWS Free Tier — 12 months free access
  📍 Google Cloud Skills Boost — Free credits

*🎨 Design:*
  📍 Figma — Free plan (enough to learn)
  📍 Canva Design School — Free tutorials

*💰 Coursera Financial Aid:*
  Apply for 100% scholarship on ANY course!
  Takes 15 days to approve, but worth it.
  _I can guide you through the application!_

*📋 Government Programs (India):*
  📍 NPTEL (IIT courses) — Free, certificates at ₹150
  📍 SWAYAM — UGC approved, free
  📍 PMKVY — Skill India, subsidized

_Start with ONE course. Consistency beats quantity!_ 🎯"""
    
    def _learning_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""📚 *{name}, ready to level up?*

I can help with:

1️⃣ *Course Recommendations* — Best courses with ROI
   Type: "courses"

2️⃣ *Skill Gap Analysis* — What skills will increase your income?
   Type: "skill gap"

3️⃣ *Learning Roadmap* — Month-by-month plan
   Type: "learning roadmap"

4️⃣ *Free Resources* — Best free courses & tools
   Type: "free courses"

5️⃣ *Scholarship Finder* — Get courses free/subsidized
   Type: "scholarship"

💡 *Did you know?*
Just 1 hour/day of learning = mastery in 6 months
That could mean ₹10,000-₹50,000 more per month!

_What do you want to learn?_ 🎯"""


# ═══════════════════════════════════════════════════════════════
# PRODUCTIVITY AGENT — Time management, habits, daily planning
# ═══════════════════════════════════════════════════════════════

class ProductivityAgent:
    """Helps users manage time, build habits, and achieve goals."""
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["habit", "routine", "daily routine",
                                         "morning routine", "adat"]):
            return self._habit_tracker(user)
        
        if any(w in msg_lower for w in ["plan my day", "daily plan", "schedule",
                                         "aaj kya karu", "time table"]):
            return self._daily_planner(user)
        
        if any(w in msg_lower for w in ["time waste", "procrastinat", "lazy",
                                         "aalas", "time management", "distract"]):
            return self._time_management(user)
        
        if any(w in msg_lower for w in ["wakeup", "wake up", "sleep",
                                         "morning", "night routine"]):
            return self._sleep_schedule(user)
        
        return self._productivity_overview(user)
    
    def _daily_planner(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        occupation = user.get("occupation", "professional")
        
        now = datetime.now()
        day = now.strftime("%A")
        
        return f"""📋 *{name}'s Smart Daily Plan — {day}*

*🌅 Morning (6-9 AM)*
  ☐ Wake up + 10 min exercise/walk
  ☐ Track yesterday's expenses (takes 30 sec!)
  ☐ Read 1 article/chapter (skill building)
  ☐ Plan top 3 tasks for today

*💼 Work (9 AM - 6 PM)*
  ☐ Deep work: Most important task first
  ☐ Meetings/calls
  ☐ Learning: 30 min skill practice during lunch
  ☐ Track any expenses: "lunch 200"

*🌆 Evening (6-9 PM)*
  ☐ 1 hour: Side project / freelance / learning
  ☐ Exercise / walk
  ☐ Family/personal time
  ☐ Quick financial check: "balance"

*🌙 Night (9-11 PM)*
  ☐ Review day: What went well? What to improve?
  ☐ Tomorrow's top 3 tasks (write them down)
  ☐ Track remaining expenses
  ☐ Read/relax/sleep by 11 PM

*📊 Daily Targets:*
💰 Expenses tracked: All of them
📚 Learning: 30-60 min
💪 Exercise: 20+ min
🎯 Big tasks done: 3

_Customize this plan? Tell me your typical day!_ ⚡"""
    
    def _habit_tracker(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        
        habits = user.get("habits", [])
        if not habits:
            return f"""🔥 *{name}'s Habit Tracker*

No habits being tracked yet! Let's start.

*Recommended High-Impact Habits:*

💰 *Financial:*
  • Track all expenses daily (1 min/day)
  • Save before spending (auto-debit on salary day)
  • Review spending weekly (5 min/week)

📚 *Learning:*
  • Read/learn 30 min/day
  • Practice skill 1 hour/day
  • Share what you learned weekly

💪 *Health:*
  • Exercise 20 min/day
  • Sleep 7+ hours
  • Drink 8 glasses water

🎯 *Productivity:*
  • Plan top 3 tasks every morning
  • No phone first 1 hour after waking
  • Weekly review every Sunday

*Start with just 1-2 habits!*
Type "add habit: track expenses daily" to begin!

💡 *The science:* It takes 66 days to form a habit.
I'll remind you daily and track your streaks! 🔥"""
        
        habit_display = "\n".join([
            f"  {'🔥' if h.get('streak', 0) > 7 else '✅'} {h['name']} — {h.get('streak', 0)} day streak"
            for h in habits
        ])
        return f"""🔥 *{name}'s Habits*

{habit_display}

_Mark today's habits: "done [habit name]"_
_Add new: "add habit [name]"_"""
    
    def _time_management(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""⏰ *{name}'s Anti-Procrastination Guide*

*The 4 Pillars of Time Management:*

1️⃣ *Pomodoro Technique*
   🍅 Work 25 min → Break 5 min → Repeat 4x → Long break 15 min
   Why: Your brain can't focus more than 25 min anyway
   Result: 4 hours of focused work = 8 hours of distracted work

2️⃣ *2-Minute Rule*
   If it takes less than 2 min → Do it NOW
   Reply to message, file a document, log expense
   Small tasks pile up and create mental load

3️⃣ *Time Blocking*
   Block your calendar for deep work (9-11 AM ideal)
   No meetings, no messages during this time
   This is where 80% of your real work happens

4️⃣ *Phone Detox*
   📱 Average screen time: 4+ hours/day (India)
   Remove Instagram/YouTube from home screen
   Use Focus mode during work hours
   Result: 2+ hours freed up daily

*The Opportunity Cost:*
2 hours/day saved = 730 hours/year
That's 91 work days!
Imagine: learning a new skill, freelancing, exercising

*Quick Wins:*
• Delete 3 distracting apps right now
• Set phone to "Do Not Disturb" during work
• Plan tomorrow's top 3 tasks tonight

_Type "plan my day" for a daily schedule!_ 📋"""
    
    def _sleep_schedule(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""😴 *{name}'s Sleep & Energy Guide*

*Optimal Schedule for Peak Performance:*

🌙 *Night Routine (10-11 PM):*
  • No screens 30 min before bed
  • Light reading or meditation
  • Review tomorrow's 3 tasks
  • Track today's expenses
  • Sleep by 11 PM

🌅 *Morning Routine (6-7 AM):*
  • Wake at 6 AM (consistent daily!)
  • 5 min: Sunlight exposure (sets circadian rhythm)
  • 10 min: Exercise/walk
  • 15 min: Learn/read
  • Breakfast + plan the day

*Why This Matters Financially:*
Morning people earn 4-5% more on average
More time = more learning = more earning

_Set a wake-up reminder? Type "wake me at 6 AM"_ ⏰"""
    
    def _productivity_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""⚡ *{name}, boost your productivity!*

1️⃣ *Daily Planner* — AI-scheduled day
   Type: "plan my day"

2️⃣ *Habit Tracker* — Build winning habits
   Type: "habit tracker"

3️⃣ *Time Management* — Beat procrastination
   Type: "time management"

4️⃣ *Sleep Schedule* — Optimize energy
   Type: "morning routine"

_Your time is your most valuable asset — let's use it wisely!_ ⏰"""


# ═══════════════════════════════════════════════════════════════
# TAX AGENT — GST, ITR, tax optimization
# ═══════════════════════════════════════════════════════════════

class TaxAgent:
    """Tax strategist — ITR filing, GST compliance, tax-saving investments."""
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["gst", "gst return", "gstr", "gst filing"]):
            return self._gst_guide(user)
        
        if any(w in msg_lower for w in ["itr", "income tax return", "file tax",
                                         "tax return", "tax filing"]):
            return self._itr_guide(user)
        
        if any(w in msg_lower for w in ["tax save", "tax saving", "80c", "80d",
                                         "save tax", "tax bachao"]):
            return self._tax_saving(user)
        
        if any(w in msg_lower for w in ["old regime", "new regime",
                                         "which regime", "tax regime"]):
            return self._tax_regime(user)
        
        if any(w in msg_lower for w in ["invoice", "bill generate", "client bill"]):
            return self._invoice_help(user)
        
        return self._tax_overview(user)
    
    def _tax_saving(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        yearly_income = income * 12
        
        if yearly_income <= 700000:
            return f"""✅ *{name}, good news!*

Your annual income: ₹{int(yearly_income):,}

Under the New Tax Regime (2026):
Income up to ₹7,00,000 → *ZERO TAX!* 🎉

You don't need to do anything extra.
But still invest for GROWTH:
• Start SIP of ₹{int(income * 0.1):,}/month in Index Fund
• Build emergency fund (6 months expenses)

_Type "invest" for investment plan_"""
        
        potential_savings = min(150000 + 50000 + 25000, yearly_income * 0.25)
        tax_saved = int(potential_savings * 0.3)
        
        return f"""🏦 *{name}'s Tax Saving Strategy*

📊 *Annual Income:* ₹{int(yearly_income):,}
💰 *Potential Tax Savings:* Up to ₹{int(tax_saved):,}/year!

*Tax-Saving Investments (Old Regime):*

📋 *Section 80C (Max ₹1,50,000):*
  ✅ ELSS Mutual Fund — Best returns (12-15%), 3yr lock-in
     Monthly SIP: ₹12,500
  ✅ EPF — Already deducted from salary
  ✅ PPF — Safe at 7.1% (15yr lock-in)
  ✅ NPS — Extra ₹50,000 under 80CCD(1B)

📋 *Section 80D (Health Insurance):*
  ✅ Self/Family: Up to ₹25,000 deduction
  ✅ Parents (60+): Up to ₹50,000 additional
  💡 Buy health insurance = save tax + protection!

📋 *Other Deductions:*
  ✅ Home Loan Interest (80EEA): Up to ₹2,00,000
  ✅ Education Loan (80E): Full interest deductible
  ✅ Donations (80G): 50-100% deductible

*Recommended Action Plan:*
1. Start ELSS SIP: ₹12,500/month (saves ₹45,000 tax)
2. NPS: ₹50,000/year (saves ₹15,000 tax)
3. Health insurance: ₹15,000/year (saves ₹4,500 tax + protection)

*Total Tax Saved: ~₹{int(tax_saved):,}/year!* 🎉

_Type "tax regime" to compare Old vs New regime_"""
    
    def _tax_regime(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        yearly = income * 12
        
        # Simplified calculation
        old_tax = max(0, (yearly - 500000 - 225000) * 0.2) if yearly > 500000 else 0
        new_tax = max(0, (yearly - 700000) * 0.15) if yearly > 700000 else 0
        
        better = "OLD" if old_tax < new_tax else "NEW"
        savings = abs(old_tax - new_tax)
        
        return f"""⚖️ *Old vs New Tax Regime for {name}*

📊 *Annual Income:* ₹{int(yearly):,}

*New Regime (Default):*
  Standard deduction: ₹75,000
  No 80C/80D deductions
  Lower tax rates
  Tax: ~₹{int(new_tax):,}/year

*Old Regime:*
  80C: ₹1,50,000 deduction
  80D: ₹25,000 (health insurance)
  NPS: ₹50,000 (80CCD)
  HRA: If applicable
  Tax: ~₹{int(old_tax):,}/year

📌 *Recommendation: {better} Regime*
  Saves you: ~₹{int(savings):,}/year

💡 *Rule of Thumb:*
  If deductions > ₹3.75L → Old Regime better
  If deductions < ₹3.75L → New Regime better

_Type "tax saving" for investment recommendations_"""
    
    def _gst_guide(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""📋 *{name}'s GST Guide*

*Do You Need GST Registration?*
  ✅ Turnover > ₹20 lakh/year (₹10L for NE states)
  ✅ Inter-state supply (any amount)
  ✅ E-commerce seller

*GST Rates:*
  5% — Essential goods, transport
  12% — Processed food, IT services
  18% — Most services, electronics (MOST COMMON)
  28% — Luxury goods, cars

*Filing Calendar:*
  📅 GSTR-1 (Sales): 11th of next month
  📅 GSTR-3B (Summary): 20th of next month
  📅 Annual Return: December 31

*I Can Help With:*
  • Calculate GST on your invoices
  • Track input credit
  • Remind before filing dates
  • Prepare filing summary

_Type "invoice" to generate a GST invoice_"""
    
    def _itr_guide(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        persona = user.get("persona", "salaried")
        
        itr_form = "ITR-1" if persona == "salaried" else "ITR-4" if persona == "freelancer" else "ITR-1"
        
        return f"""📋 *{name}'s ITR Filing Guide*

*Your Details:*
📊 Annual Income: ₹{int(income * 12):,}
📝 Recommended Form: *{itr_form}*
📅 Due Date: July 31, 2026

*Documents Needed:*
  ✅ Form 16 (from employer) — for salaried
  ✅ Bank statements (all accounts)
  ✅ Investment proofs (ELSS, PPF, NPS receipts)
  ✅ Health insurance premium receipt
  ✅ Home loan certificate (if applicable)
  ✅ Form 26AS (tax credit statement — download from TRACES)

*Filing Options:*
  1. Self-file on incometax.gov.in (free)
  2. CA partner (₹1,000-₹5,000)
  3. ClearTax / Tax2Win (₹500-₹2,000)

*Common Mistakes to Avoid:*
  ❌ Not reporting savings account interest
  ❌ Missing Form 26AS TDS mismatch
  ❌ Not claiming all eligible deductions
  ❌ Filing after deadline (₹5,000 penalty)

_Type "tax save" for tax-saving investment tips_"""
    
    def _invoice_help(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""📄 *Invoice Generator*

{name}, I can help create professional invoices!

*Format:* "create invoice for [Client Name], ₹[Amount], [Project/Service]"

*Example:*
"create invoice for Acme Corp, 25000, Website Development"

*Your Invoice Will Include:*
  ✅ Professional header with your details
  ✅ Client details
  ✅ Service description
  ✅ Amount + GST (if registered)
  ✅ Payment terms & bank details
  ✅ Due date

*I'll Also:*
  🔔 Track if payment is received
  📧 Remind you to follow up if overdue
  📊 Track total invoiced this month/quarter

_Create your first invoice now!_ 📄"""
    
    def _tax_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🏛️ *{name}, tax planning made simple!*

1️⃣ *Tax Saving* — Save up to ₹1.5L/year
   Type: "tax saving"

2️⃣ *Old vs New Regime* — Which is better for you?
   Type: "tax regime"

3️⃣ *ITR Filing* — Step-by-step guide
   Type: "itr filing"

4️⃣ *GST Guide* — Registration, rates, filing
   Type: "gst"

5️⃣ *Invoice Generator* — Professional invoices
   Type: "invoice"

💡 *Tax Tip:* Invest ₹12,500/month in ELSS before March 31 to save ~₹45,000 in tax!

_What do you need help with?_ 🏦"""


# ═══════════════════════════════════════════════════════════════
# SINGLETON INSTANCES
# ═══════════════════════════════════════════════════════════════

income_agent = IncomeAgent()
career_agent = CareerAgent()
learning_agent = LearningAgent()
productivity_agent = ProductivityAgent()
tax_agent = TaxAgent()
