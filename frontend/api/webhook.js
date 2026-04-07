/**
 * MoneyViya WhatsApp Cloud API Webhook
 * Runs as Vercel Serverless Function — no server needed!
 * 
 * Setup: Set these env vars in Vercel Dashboard:
 *   WHATSAPP_VERIFY_TOKEN   - any secret string you choose
 *   WHATSAPP_ACCESS_TOKEN   - from Meta Developer Dashboard
 *   WHATSAPP_PHONE_ID       - from Meta Developer Dashboard
 */

// ===== FOUNDER AGENTS (Inline for serverless speed) =====
const EDUCATION = {
  'sip': '📊 *SIP = Systematic Investment Plan*\n\nInstead of investing ₹12,000 at once (scary!),\nyou invest ₹1,000 every month for 12 months.\n\n*Why it\'s great:*\n• Small amounts (affordable)\n• Automatic (set & forget)\n• Averaging (buy more when cheap)\n\n*Real example:*\n₹2,000/month SIP in Nifty 50 index fund\nIn 5 years: ₹1,20,000 → ~₹1,65,000\nThat\'s ₹45,000 profit for doing nothing! 📈',
  'mutual fund': '💰 *Mutual Fund = Group Investment*\n\nImagine 100 people each put ₹1,000.\nTotal pool = ₹1,00,000.\nExpert manager invests this wisely.\nProfits shared among all 100 people.\n\n*Types:*\n• Equity funds (stocks — high risk, high return)\n• Debt funds (bonds — low risk, steady return)\n• Hybrid (mix of both)\n\n*Start with:* Index fund SIP of ₹500/month 📊',
  'emi': '🏦 *EMI = Equated Monthly Installment*\n\nBuying something expensive? Pay in parts!\n\nExample: Phone costs ₹24,000\nEMI = ₹2,000/month × 12 months\n+ Interest (~₹1,200 total)\n\n*Rule:* Total EMIs should be < 40% of salary\nIf salary = ₹30,000 → Max EMI = ₹12,000\n\n⚠️ No-cost EMI still has processing fees!',
  'credit score': '📊 *Credit Score = Financial Report Card*\n\nRange: 300-900\n• 750+ = Excellent\n• 650-749 = Good\n• Below 650 = Needs work\n\n*How to improve:*\n1. Pay credit card bills ON TIME\n2. Don\'t use >30% of credit limit\n3. Don\'t apply for too many loans\n4. Keep old cards active\n\nCheck free: CIBIL website or Paytm 📱',
  'fd': '🏦 *FD = Fixed Deposit*\n\nGive bank ₹10,000 for 1 year.\nBank gives back ₹10,700 (7% interest).\n\n*Pros:* Zero risk, guaranteed returns\n*Cons:* Low returns, locked money\n\n*Tip:* Use FD for emergency fund (3-6 months expenses)\nStart SIP for long-term growth 📈',
  'tax': '🧾 *Tax Saving for Beginners*\n\n*Section 80C — Save up to ₹1.5L:*\n• PPF (best for safe savings)\n• ELSS mutual funds (best returns)\n• EPF (automatic from salary)\n\n*Section 80D — Health Insurance:*\n• ₹25,000 for self\n• ₹50,000 for parents (senior citizen)\n\n*Quick hack:* ₹12,500/month in ELSS SIP = zero tax! 💰',
  'insurance': '🛡️ *Insurance = Protection, NOT Investment*\n\n*Must have:*\n1. Health insurance (₹5-10L cover)\n2. Term life insurance (10× annual salary)\n\n*Avoid:*\n❌ LIC endowment plans\n❌ ULIPs\n❌ Money-back policies\n\nThese give ~5% returns. FD gives 7%! 😅\n\n*Rule:* Buy term plan + invest the savings in SIP',
  'budget': '📋 *50-30-20 Budget Rule*\n\n*50% Needs* (rent, food, bills)\n*30% Wants* (shopping, movies, eating out)\n*20% Savings* (investments, emergency fund)\n\nExample on ₹30,000 salary:\n• Needs: ₹15,000\n• Wants: ₹9,000\n• Savings: ₹6,000\n\n*Start tracking today!* Even ₹100 saved daily = ₹36,500/year 🎯',
  'emergency fund': '🆘 *Emergency Fund = Sleep-Well Money*\n\nHow much? 3-6 months of expenses\nIf you spend ₹20,000/month → Save ₹60,000-1,20,000\n\n*Where to keep:*\n• Savings account (instant access)\n• Liquid mutual fund (slightly better returns)\n• Short FD (if you won\'t touch it)\n\n*Start:* Save ₹2,000/month → ₹24,000 in 1 year\nThat\'s 1+ month of safety! 💪',
  'ppf': '🏛️ *PPF = Public Provident Fund*\n\n*Best safe investment in India:*\n• Interest: ~7.1% (tax-free!)\n• Lock-in: 15 years\n• Min: ₹500/year, Max: ₹1.5L/year\n• Tax benefit under 80C\n\n*₹12,500/month in PPF for 15 years:*\nYou invest: ₹22.5L\nYou get back: ~₹40L (tax-free!)\n\nOpen at any bank or post office 📮',
};

const GREETINGS_RESPONSE = `👋 *Namaste! I'm Viya — your Private Wealth Manager* 💰

I can help you with:
📊 Track expenses — "spent 200 on food"
💰 Record income — "received 25000 salary"
📚 Learn finance — "what is SIP"
🎯 Set goals — "save for vacation"
📋 Budget tips — "how to save money"
🆘 Emergency help — "medical bill advice"

Try saying something! 💬`;

function processMessage(text) {
  const lower = text.toLowerCase().trim();
  
  // Greetings
  if (['hi', 'hello', 'hey', 'namaste', 'hii', 'start'].includes(lower)) {
    return GREETINGS_RESPONSE;
  }
  
  // Education — check all topics
  for (const [keyword, response] of Object.entries(EDUCATION)) {
    if (lower.includes(keyword)) return response;
  }
  
  // Expense tracking
  const expenseMatch = lower.match(/(?:spent|paid|bought|expense)\s+(?:rs\.?|₹)?\s*(\d+)\s+(?:on|for)\s+(.+)/i);
  if (expenseMatch) {
    const amount = expenseMatch[1];
    const category = expenseMatch[2];
    return `✅ *Expense Recorded!*\n\n💸 Amount: ₹${amount}\n📁 Category: ${category}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n_Keep tracking! Every rupee counts_ 💪`;
  }
  
  // Income tracking
  const incomeMatch = lower.match(/(?:received|got|earned|income|salary)\s+(?:rs\.?|₹)?\s*(\d+)/i);
  if (incomeMatch) {
    const amount = incomeMatch[1];
    return `✅ *Income Recorded!*\n\n💰 Amount: ₹${amount}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\nSuggestions:\n• Save 20% = ₹${Math.round(amount * 0.2)}\n• Emergency fund: ₹${Math.round(amount * 0.1)}\n• Invest in SIP: ₹${Math.round(amount * 0.1)}\n\n_Your future self will thank you!_ 🙏`;
  }
  
  // Help
  if (lower.includes('help') || lower.includes('menu')) {
    return GREETINGS_RESPONSE;
  }
  
  // Save/savings related
  if (lower.includes('save') || lower.includes('saving')) {
    return EDUCATION['budget'];
  }
  
  // Default
  return `🤔 I'm learning to understand that better!\n\nTry these:\n• "what is SIP" — learn about investments\n• "spent 500 on food" — track expenses\n• "received 30000 salary" — record income\n• "help" — see all options\n\n_I'll get smarter every day!_ 🧠`;
}

// ===== WHATSAPP CLOUD API =====
async function sendWhatsAppMessage(to, text) {
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  
  if (!phoneId || !token) {
    console.error('Missing WHATSAPP_PHONE_ID or WHATSAPP_ACCESS_TOKEN');
    return;
  }

  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
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
}

// ===== VERCEL HANDLER =====
export default async function handler(req, res) {
  // GET — Webhook verification (Meta sends this once during setup)
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
  
  // POST — Incoming messages
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
              const from = msg.from; // sender's phone
              const text = msg.text.body;
              
              console.log(`📩 From ${from}: ${text}`);
              
              // Process and reply
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
