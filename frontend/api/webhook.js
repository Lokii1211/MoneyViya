/**
 * MoneyViya WhatsApp Cloud API Webhook — V2 Smart NLP
 * Runs as Vercel Serverless Function
 */

// ===== SMART NLP ENGINE =====

// Intent patterns with priority — checked in ORDER
const INTENTS = [
  // ----- GREETINGS -----
  {
    name: 'greeting',
    patterns: [
      /^(hi|hello|hey|hlo|hii|namaste|vanakkam|start|yo|sup)$/i,
      /^(good\s*(morning|afternoon|evening|night))$/i,
      /^(howdy|hola|ola)$/i,
    ],
    handler: () => GREETINGS,
  },

  // ----- HELP / MENU -----
  {
    name: 'help',
    patterns: [
      /^(help|menu|\?|commands|options|features)$/i,
      /what\s*(can|do)\s*you\s*do/i,
      /how\s*(to|do)\s*(i\s*)?use/i,
    ],
    handler: () => GREETINGS,
  },

  // ----- REMINDER -----
  {
    name: 'reminder',
    patterns: [
      /remind/i,
      /alarm/i,
      /alert\s*me/i,
      /yaad\s*dila/i,  // Hindi
      /don't\s*forget/i,
      /set\s*(a|an)?\s*(reminder|notification)/i,
    ],
    handler: (text) => {
      // Extract time (6:30 AM, 7pm, 18:00, etc.)
      const timeMatch = text.match(/(\d{1,2})\s*[:\.]?\s*(\d{2})?\s*(am|pm|AM|PM)/);
      const time24 = text.match(/(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/i);
      let timeStr = '';
      if (timeMatch) {
        timeStr = `${timeMatch[1]}${timeMatch[2] ? ':' + timeMatch[2] : ':00'} ${timeMatch[3].toUpperCase()}`;
      } else if (time24) {
        timeStr = `${time24[1]}:${time24[2]}`;
      }
      
      // Extract date (8/4/2026, tomorrow, today, etc.)
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
      const relDate = text.match(/(today|tomorrow|kal|aaj)/i);
      let dateStr = '';
      if (dateMatch) {
        dateStr = `${dateMatch[1]}/${dateMatch[2]}${dateMatch[3] ? '/' + dateMatch[3] : ''}`;
      } else if (relDate) {
        const d = relDate[1].toLowerCase();
        const now = new Date();
        if (d === 'tomorrow' || d === 'kal') now.setDate(now.getDate() + 1);
        dateStr = now.toLocaleDateString('en-IN');
      } else {
        dateStr = new Date().toLocaleDateString('en-IN');
      }
      
      // Extract task — everything after "to" or "for" or "about"
      let task = '';
      const taskMatch = text.match(/(?:to|for|about|that)\s+(.+?)(?:\s+at\s+\d|\s+on\s+\d|\s+tomorrow|\s+today|$)/i);
      const taskMatch2 = text.match(/remind(?:er)?\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at\s+\d|\s+on\s+\d|$)/i);
      if (taskMatch) task = taskMatch[1].replace(/\s*(at|on)\s*$/, '').trim();
      else if (taskMatch2) task = taskMatch2[1].replace(/\s*(at|on)\s*$/, '').trim();
      else task = 'Your reminder';

      return `⏰ *Reminder Saved!*\n\n📋 Task: ${task}\n🕐 Time: ${timeStr || 'Not specified'}\n📅 Date: ${dateStr}\n\n✅ _I'll notify you at the scheduled time._\n\n💡 Tip: You can also say:\n• "remind me to pay rent tomorrow 10 AM"\n• "remind me about SIP on 5th"`;
    },
  },

  // ----- EXPENSE TRACKING -----
  {
    name: 'expense',
    patterns: [
      /(?:spent|paid|bought|expense|kharcha|kharch)\s/i,
      /(?:₹|rs\.?|inr)\s*\d+\s*(on|for)/i,
      /\d+\s*(rupees?|rs)\s*(on|for)/i,
    ],
    handler: (text) => {
      const amtMatch = text.match(/(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*)\s*/i) || text.match(/(\d[\d,]+)/);
      const amount = amtMatch ? amtMatch[1].replace(/,/g, '') : '0';
      
      // Category detection
      const catPatterns = {
        '🍕 Food': /food|lunch|dinner|breakfast|snack|tea|coffee|biryani|dosa|chai|eat|restaurant|swiggy|zomato|hotel/i,
        '🚗 Transport': /transport|uber|ola|auto|bus|train|petrol|diesel|metro|cab|fuel|travel/i,
        '🛒 Shopping': /shopping|clothes|dress|shirt|shoes|amazon|flipkart|myntra|mall/i,
        '💊 Health': /health|medicine|doctor|hospital|medical|pharmacy|gym|clinic/i,
        '📱 Recharge': /recharge|mobile|phone|jio|airtel|vi|wifi|internet|broadband/i,
        '🏠 Rent': /rent|house|room|pg|hostel|flat|apartment/i,
        '📚 Education': /education|book|course|class|tuition|school|college|udemy/i,
        '🎬 Entertainment': /movie|netflix|prime|spotify|game|party|outing|fun/i,
        '💡 Bills': /bill|electricity|water|gas|maintenance|emi|loan/i,
        '🎁 Gift': /gift|present|birthday|wedding|donation/i,
      };
      
      let category = '📦 General';
      for (const [cat, pattern] of Object.entries(catPatterns)) {
        if (pattern.test(text)) { category = cat; break; }
      }
      
      const a = parseInt(amount);
      let tip = '';
      if (a > 5000) tip = '\n\n⚠️ _Big expense! Make sure this was planned._';
      else if (a > 1000) tip = '\n\n💡 _Track these regularly to stay on budget._';
      else tip = '\n\n✨ _Small consistent tracking = big savings!_';

      return `✅ *Expense Recorded!*\n\n💸 Amount: ₹${parseInt(amount).toLocaleString('en-IN')}\n📁 Category: ${category}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n⏰ Time: ${new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}${tip}`;
    },
  },

  // ----- INCOME TRACKING -----
  {
    name: 'income',
    patterns: [
      /(?:received|got|earned|income|salary|credited|deposited)\s/i,
      /salary\s*(is|of|=)?\s*\d/i,
      /\d+\s*(salary|income|credited)/i,
    ],
    handler: (text) => {
      const amtMatch = text.match(/(\d[\d,]+)/);
      const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : 0;
      
      return `✅ *Income Recorded!*\n\n💰 Amount: ₹${amount.toLocaleString('en-IN')}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n*Smart Split Suggestion (50-30-20):*\n🏠 Needs (50%): ₹${Math.round(amount * 0.5).toLocaleString('en-IN')}\n🎮 Wants (30%): ₹${Math.round(amount * 0.3).toLocaleString('en-IN')}\n💰 Save (20%): ₹${Math.round(amount * 0.2).toLocaleString('en-IN')}\n\n🔥 _If you invest ₹${Math.round(amount * 0.2).toLocaleString('en-IN')}/month in SIP:_\n• 5 years → ~₹${Math.round(amount * 0.2 * 78).toLocaleString('en-IN')}\n• 10 years → ~₹${Math.round(amount * 0.2 * 195).toLocaleString('en-IN')}\n\n_Start your investment journey today!_ 🚀`;
    },
  },

  // ----- GOAL SETTING -----
  {
    name: 'goal',
    patterns: [
      /\b(goal|target)\b/i,
      /\bsave\s*for\b/i,
      /\bsaving\s*for\b/i,
      /\bwant\s*to\s*buy\b/i,
      /\bplanning\s*to\b/i,
      /\bsave\s*up\b/i,
    ],
    handler: (text) => {
      const goalMatch = text.match(/(?:for|buy|to\s+buy|to\s+get|goal\s*:?)\s+(?:a\s+|an\s+)?(.+?)(?:\s+worth|\s+of\s+₹|\s+costing|$)/i);
      const goal = goalMatch ? goalMatch[1].trim() : 'your goal';
      const amtMatch = text.match(/(\d[\d,]+)/);
      const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : null;

      let plan = '';
      if (amount) {
        const monthly3 = Math.round(amount / 3);
        const monthly6 = Math.round(amount / 6);
        const monthly12 = Math.round(amount / 12);
        plan = `\n\n*Savings Plan:*\n• 3 months: ₹${monthly3.toLocaleString('en-IN')}/month\n• 6 months: ₹${monthly6.toLocaleString('en-IN')}/month\n• 12 months: ₹${monthly12.toLocaleString('en-IN')}/month`;
      }

      return `🎯 *Goal Created!*\n\n📋 Goal: ${goal}${amount ? '\n💰 Target: ₹' + amount.toLocaleString('en-IN') : ''}\n📅 Started: ${new Date().toLocaleDateString('en-IN')}${plan}\n\n*Tips:*\n• Set aside money on salary day itself\n• Track progress weekly\n• Cut 1 unnecessary expense\n\n_Every ₹100 saved gets you closer!_ 💪`;
    },
  },

  // ----- BALANCE / SUMMARY -----
  {
    name: 'balance',
    patterns: [
      /\b(balance|summary|overview|report|status)\b/i,
      /how\s*much\s*(have|did|do)\s*i/i,
      /\b(kitna|kharcha|bachat)\b/i,
      /total\s*(expense|income|spent|earned)/i,
      /show\s*(my|all)\s*(expense|transaction)/i,
    ],
    handler: () => {
      return `📊 *Your Financial Dashboard*\n\n_Visit the MoneyViya app for detailed charts!_\n🌐 https://frontend-lokiis-projects-97ceb281.vercel.app\n\n*Quick Commands:*\n• "spent 200 on food" → Track expense\n• "received 30000 salary" → Record income\n• "what is SIP" → Learn investing\n\n_All your data syncs automatically!_ 📱`;
    },
  },

  // ----- EDUCATION (word boundary) -----
  { name: 'edu_sip', patterns: [/\bsip\b/i, /systematic\s*investment/i], handler: () => EDUCATION.sip },
  { name: 'edu_mf', patterns: [/mutual\s*fund/i, /\bmf\b/i], handler: () => EDUCATION.mutual_fund },
  { name: 'edu_emi', patterns: [/\bemi\b/i, /equated\s*monthly/i, /installment/i], handler: () => EDUCATION.emi },
  { name: 'edu_credit', patterns: [/credit\s*score/i, /cibil/i], handler: () => EDUCATION.credit_score },
  { name: 'edu_fd', patterns: [/\bfd\b/i, /fixed\s*deposit/i], handler: () => EDUCATION.fd },
  { name: 'edu_tax', patterns: [/\btax\b/i, /80c/i, /80d/i, /tax\s*sav/i], handler: () => EDUCATION.tax },
  { name: 'edu_ins', patterns: [/\binsurance\b/i, /\bterm\s*plan/i, /\blic\b/i, /\bulip/i], handler: () => EDUCATION.insurance },
  { name: 'edu_budget', patterns: [/\bbudget\b/i, /50.?30.?20/i, /budgeting/i], handler: () => EDUCATION.budget },
  { name: 'edu_ef', patterns: [/emergency\s*fund/i, /rainy\s*day/i], handler: () => EDUCATION.emergency_fund },
  { name: 'edu_ppf', patterns: [/\bppf\b/i, /public\s*provident/i], handler: () => EDUCATION.ppf },
  { name: 'edu_nps', patterns: [/\bnps\b/i, /national\s*pension/i, /pension/i], handler: () => EDUCATION.nps },
  { name: 'edu_gold', patterns: [/\bgold\b/i, /\bsovereign\s*gold/i, /\bsgb\b/i], handler: () => EDUCATION.gold },
  { name: 'edu_stock', patterns: [/\bstock/i, /\bshare\s*market/i, /\bsensex/i, /\bnifty\b/i, /\bdemat/i], handler: () => EDUCATION.stocks },
  { name: 'edu_crypto', patterns: [/\bcrypto/i, /\bbitcoin/i, /\bethereum/i], handler: () => EDUCATION.crypto },
  { name: 'edu_loan', patterns: [/\bhome\s*loan/i, /\bcar\s*loan/i, /\bpersonal\s*loan/i, /\bloan\b/i], handler: () => EDUCATION.loan },
  { name: 'edu_upi', patterns: [/\bupi\b/i, /\bgpay\b/i, /\bphonepe\b/i, /\bpaytm\b/i], handler: () => EDUCATION.upi },

  // ----- SAVINGS ADVICE -----
  {
    name: 'save_advice',
    patterns: [
      /how\s*to\s*save/i,
      /\b(save|saving|savings|bachat)\b/i,
      /tips?\s*(to|for)\s*sav/i,
      /money\s*sav/i,
      /paise\s*bacha/i,
    ],
    handler: () => EDUCATION.budget,
  },

  // ----- THANK YOU -----
  {
    name: 'thanks',
    patterns: [
      /\b(thanks|thank\s*you|thanku|tq|ty)\b/i,
      /\b(dhanyavaad|shukriya|nandri)\b/i,
    ],
    handler: () => `🙏 *You're welcome!*\n\nRemember: _Financial freedom starts with one smart decision today!_ 💰\n\nI'm here 24/7. Type *"help"* anytime you need me.\n\n_Keep tracking, keep growing!_ 🌱`,
  },

  // ----- ABOUT -----
  {
    name: 'about',
    patterns: [
      /who\s*(are|r)\s*(you|u)/i,
      /what\s*(are|r)\s*(you|u)/i,
      /your\s*name/i,
      /\babout\b/i,
      /tell\s*me\s*about\s*(yourself|u)/i,
    ],
    handler: () => `🤖 *I'm Viya — Your Private Wealth Manager*\n\nI'm built by *MoneyViya* to help Indians manage money better.\n\n*What I can do:*\n• 💸 Track your expenses & income\n• 📚 Teach financial concepts (SIP, EMI, etc.)\n• 🎯 Help set & track savings goals\n• ⏰ Set bill payment reminders\n• 📊 Give personalized budget advice\n\n🌐 *Web App:* Visit the full dashboard at\nhttps://frontend-lokiis-projects-97ceb281.vercel.app\n\n_I'm getting smarter every day!_ 🧠`,
  },

  // ----- FUNNY / CASUAL -----
  {
    name: 'casual',
    patterns: [
      /\b(lol|haha|😂|🤣|funny|joke)\b/i,
      /\b(bore|bored|boring)\b/i,
      /\b(ok|okay|okey|okie|k|kk|hmm|ohh|accha|acha)\b/i,
      /^(yes|no|yeah|nah|yep|nope|ha|ji|haan)$/i,
    ],
    handler: (text) => {
      const lower = text.toLowerCase();
      if (/bore|bored/.test(lower)) {
        return `😄 Bored? Let's make it fun!\n\n🎮 *Quick Finance Quiz:*\nIf you save ₹100/day for 1 year, how much do you have?\n\nA) ₹36,500\nB) ₹30,000\nC) ₹42,000\n\n_Reply with A, B, or C!_ 🤔`;
      }
      if (/joke|funny|lol|haha/.test(lower)) {
        const jokes = [
          `😄 Why did the rupee go to school?\nBecause it wanted to gain *interest*! 📈`,
          `😂 What's a banker's favorite yoga pose?\n*The balance*! 🧘`,
          `🤣 Why don't financial advisors ever get cold?\nThey're always wrapped up in *bonds*! 🏦`,
        ];
        return jokes[Math.floor(Math.random() * jokes.length)] + '\n\n_Now back to growing your wealth!_ 💰';
      }
      return `👍 Got it!\n\nAnything else I can help with?\n• Track expenses → "spent 500 on food"\n• Learn investing → "what is SIP"\n• Set reminder → "remind me to pay rent"\n\n_I'm always here!_ 💬`;
    },
  },

  // ----- QUIZ ANSWER -----
  {
    name: 'quiz',
    patterns: [/^[abc]$/i],
    handler: (text) => {
      const ans = text.toLowerCase();
      if (ans === 'a') {
        return `🎉 *Correct!* ₹100 × 365 = ₹36,500!\n\nThat's the power of daily saving!\nNow imagine investing it in a SIP → ~₹42,000! 📈\n\n_Start saving ₹100/day from today!_ 💪`;
      }
      return `❌ Not quite! The answer is *A) ₹36,500*\n\n₹100 × 365 days = ₹36,500\nWith SIP investing → ~₹42,000! 📈\n\n_Small daily savings = BIG yearly results!_ 💰`;
    },
  },
];

// ===== EDUCATION DATABASE =====
const EDUCATION = {
  sip: '📊 *SIP = Systematic Investment Plan*\n\nInstead of investing ₹12,000 at once,\nyou invest ₹1,000 every month.\n\n*Why it\'s great:*\n• Small amounts (₹500/month OK!)\n• Automatic (set & forget)\n• Rupee cost averaging\n\n*Real example:*\n₹2,000/month SIP in Nifty 50\n• 5 years → ~₹1,65,000 (invested ₹1.2L)\n• 10 years → ~₹4,40,000 (invested ₹2.4L)\n• 20 years → ~₹20,00,000! (invested ₹4.8L)\n\n_Start with ₹500/month on Groww or Zerodha_ 📈',
  mutual_fund: '💰 *Mutual Fund = Group Investment*\n\n100 people each put ₹1,000\nTotal pool = ₹1,00,000\nExpert manager invests wisely\nProfits shared among all\n\n*Types:*\n• Equity (stocks — 12-15% returns)\n• Debt (bonds — 6-8% returns)\n• Hybrid (mix — 8-12% returns)\n• Index (Nifty/Sensex — lowest cost)\n\n*Start with:* Nifty 50 Index Fund SIP ₹500/month\n*Apps:* Groww, Zerodha Coin, Paytm Money 📊',
  emi: '🏦 *EMI = Equated Monthly Installment*\n\nBig purchase? Pay in parts!\n\nExample: Phone ₹24,000\nEMI = ₹2,000/month × 12 months\n+ Interest (~₹1,200 total)\n\n*Golden Rule:* Total EMIs < 40% salary\nSalary ₹30,000 → Max EMI = ₹12,000\n\n*Types:*\n• Home loan: 8-10% (tax benefit!)\n• Car loan: 8-12%\n• Personal loan: 12-18%\n• Credit card: 36-42% (AVOID! 🚫)\n\n⚠️ _No-cost EMI has processing fees!_',
  credit_score: '📊 *Credit Score = Financial Report Card*\n\nRange: 300-900\n• 750+ = Excellent (best loan rates)\n• 700-749 = Good\n• 650-699 = Fair\n• Below 650 = Poor\n\n*5 Ways to Improve:*\n1. Pay bills ON TIME (35% weightage!)\n2. Keep credit usage < 30%\n3. Don\'t apply for many loans\n4. Keep old cards active\n5. Mix credit types\n\n*Check free:* CIBIL, Paytm, CRED app 📱',
  fd: '🏦 *FD = Fixed Deposit*\n\nGive bank ₹1,00,000 for 1 year\nGet back ~₹1,07,000 (7% interest)\n\n*Pros:* Zero risk, guaranteed\n*Cons:* Low returns, TDS on interest > ₹40K\n\n*Smart FD Tips:*\n• FD ladder: Split into 1-2-3 year FDs\n• Use for emergency fund only\n• Tax-saving FD (5-year lock, 80C benefit)\n\n_For long term: SIP > FD_ 📈',
  tax: '🧾 *Tax Saving for Beginners*\n\n*Section 80C (Save ₹1.5L):*\n• ELSS mutual fund (best returns ~12%)\n• PPF (safest, 7.1%)\n• EPF (auto from salary)\n• Life insurance premium\n• Home loan principal\n\n*Section 80D (Health Insurance):*\n• Self: ₹25,000\n• Parents (60+): ₹50,000\n\n*Section 80CCD (NPS):*\n• Extra ₹50,000 deduction!\n\n*Quick hack:* ₹12,500/month ELSS SIP = zero tax up to ₹7.5L! 💰',
  insurance: '🛡️ *Insurance = Protection, NOT Investment*\n\n*Must Have:*\n1. 🏥 Health: ₹5-10L cover (₹500/month)\n2. 💀 Term Life: 10× salary (₹700/month)\n\n*Avoid These:*\n❌ LIC endowment (~4% return)\n❌ ULIPs (high charges)\n❌ Money-back plans\n\nThese give ~5% returns. FD gives 7%! 😅\n\n*Formula:*\nTerm plan + SIP > Traditional LIC plan\n\n_Buy term plan by age 30 for lowest premium_ 🎯',
  budget: '📋 *50-30-20 Budget Rule*\n\n*50% NEEDS* (rent, food, bills, EMI)\n*30% WANTS* (shopping, movies, trips)\n*20% SAVINGS* (SIP, FD, emergency)\n\n*On ₹30,000 salary:*\n• Needs: ₹15,000\n• Wants: ₹9,000\n• Savings: ₹6,000\n\n*7 Quick Money-Saving Tips:*\n1. Cook at home (save ₹3000/month)\n2. Cancel unused subscriptions\n3. Use UPI cashback offers\n4. Buy generic brands\n5. Wait 24hrs before big purchases\n6. Carry water bottle\n7. Track EVERY expense here!\n\n_₹200/day saved = ₹73,000/year!_ 🎯',
  emergency_fund: '🆘 *Emergency Fund = Sleep-Well Money*\n\n*How much?* 3-6 months expenses\nSpend ₹20K/month → Save ₹60K-1.2L\n\n*Where to keep:*\n1. Savings account (instant access)\n2. Liquid mutual fund (better returns)\n3. Short FD (if disciplined)\n\n*Build it:*\n• Month 1-6: ₹5,000/month\n• You\'ll have ₹30,000 → 1.5 months safety!\n\n_NEVER invest this money. It\'s for emergencies only._ 💪',
  ppf: '🏛️ *PPF = Public Provident Fund*\n\n*Best safe investment in India:*\n• Interest: ~7.1% (100% tax-free!)\n• Lock-in: 15 years\n• Min: ₹500/year, Max: ₹1.5L/year\n• Tax benefit under 80C\n\n*₹12,500/month for 15 years:*\nInvested: ₹22.5L → Get: ~₹40L (tax-free!)\n\n*₹5,000/month for 15 years:*\nInvested: ₹9L → Get: ~₹16L\n\nOpen at any bank or post office 📮',
  nps: '🏢 *NPS = National Pension System*\n\n*Extra ₹50,000 tax deduction!* (above 80C)\n\n*How it works:*\n• You invest monthly until age 60\n• At 60: Get 60% lump sum + 40% pension\n• Returns: 9-12% (market-linked)\n\n*Best for:*\n• Salaried people wanting extra tax saving\n• Long-term retirement planning\n\n*Tip:* Choose Aggressive (75% equity) if under 40 📈',
  gold: '🥇 *Gold Investment Options*\n\n*Don\'t buy physical gold!* Here\'s better:\n\n1. *Sovereign Gold Bond (SGB)*\n   • 2.5% annual interest + gold price gain\n   • Tax-free after 8 years!\n   • Buy from RBI (via banks)\n\n2. *Gold ETF*\n   • Trade like stocks on Zerodha/Groww\n   • No making charges\n\n3. *Digital Gold*\n   • Buy from ₹1 on Paytm/PhonePe\n\n*Rule:* Gold = max 10% of portfolio 🎯',
  stocks: '📈 *Stock Market Basics*\n\n*What:* Buying tiny pieces of companies\n*Where:* NSE/BSE via Zerodha, Groww\n*Minimum:* Even ₹100!\n\n*For Beginners:*\n1. Start with Index Fund SIP (not direct stocks)\n2. Open Demat account on Zerodha\n3. Learn for 6 months before buying stocks\n\n*Never do:*\n❌ Trade on tips\n❌ Invest borrowed money\n❌ Panic sell during crashes\n\n_SIP in Nifty 50 index = easiest way to start_ 📊',
  crypto: '🪙 *Crypto in India*\n\n⚠️ *High Risk — Only invest what you can lose!*\n\n*Tax:* 30% flat tax on gains + 1% TDS\n*Platforms:* WazirX, CoinDCX, CoinSwitch\n\n*If you must:*\n• Max 5% of portfolio\n• Only Bitcoin/Ethereum\n• Don\'t daytrade\n• Hold long term\n\n_Most experts say: SIP in index fund > crypto for wealth building_ 📈',
  loan: '🏦 *Loans Guide*\n\n*Interest Rates (approx):*\n• Home loan: 8.5-10%\n• Car loan: 8-12%\n• Education: 8-11%\n• Personal: 12-18%\n• Credit card: 36-42% 🚫\n\n*Before taking loan:*\n1. EMI < 40% of salary\n2. Compare 3+ banks\n3. Check processing fees\n4. Read terms carefully\n5. Prepay whenever possible\n\n_Always pay credit card full amount, never minimum!_ ⚠️',
  upi: '📲 *UPI Smart Tips*\n\n*Cashback hacks:*\n• GPay: Rewards on bill payments\n• PhonePe: Cashback on recharges\n• Paytm: UPI lite for small txns\n• CRED: Rewards for credit card bills\n\n*Safety:*\n• Never share UPI PIN\n• Don\'t accept unknown requests\n• Use app lock\n• Set daily transaction limit\n\n*Tip:* Use UPI for everything = automatic expense tracking! 📊',
};

const GREETINGS = `👋 *Namaste! I'm Viya — Your Private Wealth Manager* 💰

*What I can do:*

💸 *Track Money*
• "spent 500 on food"
• "received 30000 salary"
• "balance" — see summary

📚 *Learn Finance*
• "what is SIP" / "explain EMI"
• "how to save money"
• "tax saving tips"

🎯 *Plan & Organize*
• "save for iPhone"
• "remind me to pay rent tomorrow 10 AM"

📊 *Quick Info*
• "credit score tips"
• "gold investment"
• "stock market basics"

_Just type naturally — I understand!_ 💬`;

// ===== PROCESS MESSAGE =====
function processMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return GREETINGS;

  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        return intent.handler(trimmed);
      }
    }
  }

  // Fuzzy fallback — check if any word matches an education topic
  const words = trimmed.toLowerCase().split(/\s+/);
  const topicMap = {
    'invest': 'sip', 'investment': 'sip', 'nivesh': 'sip',
    'mutual': 'mutual_fund', 'mf': 'mutual_fund',
    'deposit': 'fd', 'bank': 'fd',
    'tax': 'tax', 'itr': 'tax',
    'term': 'insurance', 'policy': 'insurance', 'bima': 'insurance',
    'pension': 'nps', 'retire': 'nps', 'retirement': 'nps',
    'gold': 'gold', 'sona': 'gold',
    'share': 'stocks', 'market': 'stocks', 'trading': 'stocks',
  };
  
  for (const word of words) {
    if (topicMap[word]) return EDUCATION[topicMap[word]];
  }

  // Final fallback
  return `🤖 I'm not sure I understood that.\n\nHere's what I can help with:\n\n💸 *Track:* "spent 200 on food"\n📚 *Learn:* "what is SIP", "tax tips"\n⏰ *Remind:* "remind me to pay rent"\n🎯 *Goals:* "save for laptop"\n📊 *Info:* "credit score", "gold"\n\n_Or just say "help" for the full menu!_ 💬`;
}

// ===== WHATSAPP CLOUD API =====
async function sendWhatsAppMessage(to, text) {
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  
  if (!phoneId || !token) {
    console.error('Missing WHATSAPP_PHONE_ID or WHATSAPP_ACCESS_TOKEN');
    return;
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    const data = await resp.json();
    if (data.error) console.error('WhatsApp API error:', data.error);
  } catch (err) {
    console.error('Send error:', err);
  }
}

// ===== VERCEL HANDLER =====
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || '').trim()) {
      console.log('✅ Webhook verified!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }
  
  if (req.method === 'POST') {
    const body = req.body;
    
    if (body?.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const messages = change.value?.messages || [];
          
          for (const msg of messages) {
            if (msg.type === 'text') {
              const from = msg.from;
              const text = msg.text.body;
              console.log(`📩 From ${from}: ${text}`);
              
              const reply = processMessage(text);
              await sendWhatsAppMessage(from, reply);
              console.log(`📤 Replied to ${from}`);
            }
          }
        }
      }
    }
    
    return res.status(200).send('OK');
  }
  
  return res.status(405).send('Method not allowed');
}
