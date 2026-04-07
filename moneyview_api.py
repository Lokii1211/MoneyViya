"""
MoneyViya API - FastAPI Endpoints
===================================
API endpoints for MoneyViya Personal Financial Agent
With Auto-Capture: SMS Parsing, Screenshot Parser, Forwarded Message Parser
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import asyncio

# Import MoneyViya Agent
from agents.moneyview_agent import moneyview_agent, process_message
from services.stock_market_service import get_market_update, get_investment_advice

# Auto-Capture Services (Layers 1, 3, 5)
try:
    from services.auto_capture_service import sms_parser, screenshot_parser, smart_cash_prompter
    AUTO_CAPTURE_AVAILABLE = True
    print("[MoneyViya API] Auto-Capture services loaded ✅")
except Exception as e:
    print(f"[MoneyViya API] Auto-Capture not available: {e}")
    sms_parser = None
    screenshot_parser = None
    smart_cash_prompter = None
    AUTO_CAPTURE_AVAILABLE = False

# Founder Edition Specialist Agents
try:
    from services.founder_agents import founder_agents
    FOUNDER_AGENTS_AVAILABLE = True
    print("[MoneyViya API] Founder Edition agents loaded ✅")
except Exception as e:
    print(f"[MoneyViya API] Founder agents not available: {e}")
    founder_agents = None
    FOUNDER_AGENTS_AVAILABLE = False

try:
    import pytz
    IST = pytz.timezone('Asia/Kolkata')
except:
    IST = None

# Create router - keep lowercase for import compatibility
moneyview_router = APIRouter(prefix="/api/moneyview", tags=["MoneyViya"])


# Request/Response Models
class MessageRequest(BaseModel):
    phone: str
    message: str
    sender_name: Optional[str] = "Friend"


class MessageResponse(BaseModel):
    success: bool
    reply: str
    phone: str


class UserSummary(BaseModel):
    phone: str
    name: str
    language: str
    message: str


class ImageParseRequest(BaseModel):
    phone: str
    image_base64: str
    caption: Optional[str] = ""
    sender_name: Optional[str] = "Friend"


class SMSParseRequest(BaseModel):
    phone: str
    sms_text: str
    sender_id: Optional[str] = ""


# ==================== MESSAGE PROCESSING ====================

@moneyview_router.post("/process", response_model=MessageResponse)
async def process_whatsapp_message(request: MessageRequest):
    """
    Process incoming WhatsApp message through MoneyViya Agent.
    Also handles [FORWARDED] tagged messages via Layer 3 parser.
    """
    try:
        message = request.message
        
        # ─── Layer 3: Forwarded Message Detection ───
        if message.startswith("[FORWARDED]") and AUTO_CAPTURE_AVAILABLE and screenshot_parser:
            forwarded_text = message.replace("[FORWARDED]", "").strip()
            parsed = screenshot_parser.parse_forwarded_text(forwarded_text)
            
            if parsed.get("is_financial") and parsed.get("amount"):
                # Auto-log the transaction
                user = moneyview_agent._get_user(request.phone)
                txn_type = "income" if parsed["type"] == "credit" else "expense"
                
                moneyview_agent._add_transaction(
                    request.phone,
                    txn_type,
                    parsed["amount"],
                    parsed.get("category", "uncategorized"),
                    f"Forwarded: {parsed.get('merchant', 'Unknown')}",
                    source="forwarded"
                )
                
                emoji = "💰" if txn_type == "income" else "✅"
                merchant = parsed.get("merchant", "Unknown")
                category = parsed.get("category", "uncategorized").replace("_", " ").title()
                today_income, today_expense = moneyview_agent._get_today_transactions(request.phone)
                budget_left = user.get("daily_budget", 1000) - today_expense
                
                reply = f"""{emoji} *Auto-logged from forwarded message!*

💸 ₹{int(parsed['amount']):,} → {category} ({merchant})
📱 Source: {parsed.get('source', 'forwarded').replace('_', ' ').title()}"""

                if txn_type == "expense" and budget_left > 0:
                    reply += f"\n💰 Budget left today: ₹{int(budget_left):,}"
                elif txn_type == "expense":
                    reply += f"\n⚠️ Over budget by ₹{int(abs(budget_left)):,}"
                
                reply += "\n\n_Wrong? Just type the correct amount._"
                
                return MessageResponse(success=True, reply=reply, phone=request.phone)
        
        # ─── Founder Agent Smart Routing (before LLM) ───
        if FOUNDER_AGENTS_AVAILABLE and founder_agents:
            try:
                msg_lower = message.lower().strip()
                user_ctx = moneyview_agent._get_user(request.phone)
                founder_reply = None
                
                # Subscription triggers
                if any(kw in msg_lower for kw in ["subscription", "subscriptions", "recurring", "netflix", "spotify", "gym membership", "cancel subscription"]):
                    founder_reply = founder_agents.subscription_audit(user_ctx)
                
                # Financial education triggers
                elif any(term in msg_lower for term in ["what is sip", "what is mutual fund", "what is fd", "what is nps", 
                         "what is credit score", "explain sip", "explain mutual", "explain fd", "eli5",
                         "sip kya hai", "mutual fund kya", "credit score kya"]):
                    concept = msg_lower.replace("what is ", "").replace("explain ", "").replace("kya hai ", "")
                    founder_reply = founder_agents.explain_concept(concept)
                
                # Purchase decision triggers
                elif any(kw in msg_lower for kw in ["should i buy", "can i afford", "buy or not"]):
                    item = msg_lower.split("buy")[-1].strip() if "buy" in msg_lower else "item"
                    founder_reply = founder_agents.purchase_decision(user_ctx, item, user_ctx.get("daily_budget", 1000) * 30)
                
                # Emergency triggers
                elif any(kw in msg_lower for kw in ["emergency", "urgent money", "medical bill", "accident", "hospital bill"]):
                    founder_reply = founder_agents.emergency_response(user_ctx, "Financial emergency", 10000)
                
                # Family obligation triggers
                elif any(kw in msg_lower for kw in ["family needs money", "parents need", "dad needs", "mom needs", 
                                                      "sister wedding", "brother needs"]):
                    founder_reply = founder_agents.family_obligation(user_ctx, 20000, "family")
                
                # Social pressure triggers
                elif any(kw in msg_lower for kw in ["dinner invite", "friends asking", "party tonight", 
                                                      "should i go out", "friends plan", "outing invite"]):
                    founder_reply = founder_agents.social_pressure_defense(user_ctx, message)
                
                # Morning/Evening proactive
                elif "morning briefing" in msg_lower or "morning brief" in msg_lower:
                    founder_reply = founder_agents.morning_briefing(user_ctx)
                elif "evening checkin" in msg_lower or "evening check" in msg_lower:
                    founder_reply = founder_agents.evening_checkin(user_ctx)
                
                # Share triggers
                elif msg_lower.strip() == "share" or "share my progress" in msg_lower:
                    founder_reply = founder_agents.generate_share_message(user_ctx)
                
                if founder_reply:
                    return MessageResponse(success=True, reply=founder_reply, phone=request.phone)
            except Exception as fe:
                print(f"[Founder] Agent error: {fe}")
        
        # Normal message processing (LLM-based)
        reply = await process_message(
            phone=request.phone,
            message=message,
            sender_name=request.sender_name
        )
        
        return MessageResponse(
            success=True,
            reply=reply,
            phone=request.phone
        )
    except Exception as e:
        return MessageResponse(
            success=False,
            reply=f"⚠️ Error: {str(e)}",
            phone=request.phone
        )


# ==================== VOICE TRANSCRIPTION ====================

class TranscribeRequest(BaseModel):
    phone: str
    audio_base64: str
    sender_name: Optional[str] = "Friend"

@moneyview_router.post("/transcribe")
async def transcribe_voice(request: TranscribeRequest):
    """
    Transcribe voice note and process as text message.
    Uses OpenAI Whisper or falls back to text processing.
    """
    import base64, tempfile, os
    try:
        # Decode audio
        audio_bytes = base64.b64decode(request.audio_base64)
        
        # Save temp file
        temp_path = os.path.join(tempfile.gettempdir(), f"voice_{request.phone}_{int(datetime.now().timestamp())}.ogg")
        with open(temp_path, 'wb') as f:
            f.write(audio_bytes)
        
        transcription = None
        
        # Try OpenAI Whisper transcription
        try:
            import openai
            client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
            with open(temp_path, "rb") as audio_file:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="hi"  # Hindi primary, auto-detects
                )
                transcription = result.text
        except Exception as whisper_err:
            print(f"[Whisper] {whisper_err}")
        
        # Cleanup temp file
        try: os.unlink(temp_path)
        except: pass
        
        if transcription and transcription.strip():
            # Process transcribed text through main agent
            reply = await process_message(request.phone, transcription, request.sender_name)
            return {
                "success": True,
                "transcription": transcription,
                "reply": f"🎤 _\"{transcription}\"_\n\n{reply}"
            }
        else:
            return {
                "success": False,
                "reply": "🎤 Couldn't understand the voice note. Please try typing your message!"
            }
    except Exception as e:
        print(f"[Transcribe] Error: {e}")
        return {
            "success": False, 
            "reply": "🎤 Voice processing unavailable. Please type your message!"
        }


# ==================== FOUNDER AGENT SMART ROUTER ====================

class FounderRequest(BaseModel):
    phone: str
    message: str
    context: Optional[Dict] = None

@moneyview_router.post("/founder/smart-route")
async def founder_smart_route(request: FounderRequest):
    """
    Smart router that detects which founder agent to invoke based on message content.
    This is called by the main process flow to enhance responses.
    """
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"handled": False}
    
    msg = request.message.lower()
    user = moneyview_agent._get_user(request.phone)
    
    # Subscription audit triggers
    if any(kw in msg for kw in ["subscription", "subscriptions", "cancel", "recurring", "netflix", "spotify", "gym membership"]):
        if "cancel" in msg:
            return {"handled": True, "reply": founder_agents.subscription_audit(user)}
        return {"handled": True, "reply": founder_agents.subscription_audit(user)}
    
    # Financial education triggers
    edu_terms = ["what is sip", "what is mutual fund", "what is fd", "what is nps", "what is credit score",
                 "explain sip", "explain mutual", "explain fd", "eli5", "what does sip mean",
                 "kya hai sip", "sip kya hai", "mutual fund kya"]
    if any(term in msg for term in edu_terms):
        concept = msg.replace("what is ", "").replace("explain ", "").replace("kya hai ", "").replace("eli5 ", "")
        return {"handled": True, "reply": founder_agents.explain_concept(concept)}
    
    # Purchase decision triggers
    if any(kw in msg for kw in ["should i buy", "can i afford", "purchase decision", "buy or not"]):
        return {"handled": True, "reply": founder_agents.purchase_decision(
            user, msg.split("buy")[-1].strip() if "buy" in msg else "item", 
            user.get("daily_budget", 1000) * 30
        )}
    
    # Emergency triggers
    if any(kw in msg for kw in ["emergency", "urgent money", "medical bill", "accident", "hospital"]):
        return {"handled": True, "reply": founder_agents.emergency_response(
            user, "Financial emergency", 10000
        )}
    
    # Family obligation triggers
    if any(kw in msg for kw in ["family needs money", "parents need", "dad needs", "mom needs", 
                                 "sister wedding", "brother needs", "relative needs"]):
        return {"handled": True, "reply": founder_agents.family_obligation(
            user, 20000, "family"
        )}
    
    # Social pressure triggers
    if any(kw in msg for kw in ["dinner invite", "friends asking", "party tonight", "should i go out",
                                 "friends plan", "outing"]):
        return {"handled": True, "reply": founder_agents.social_pressure_defense(
            user, msg
        )}
    
    # Morning/Evening proactive
    if "morning briefing" in msg or "morning brief" in msg:
        return {"handled": True, "reply": founder_agents.morning_briefing(user)}
    if "evening checkin" in msg or "evening check" in msg:
        return {"handled": True, "reply": founder_agents.evening_checkin(user)}
    
    # Share/viral triggers
    if msg.strip() == "share" or "share my" in msg:
        return {"handled": True, "reply": founder_agents.generate_share_message(user)}
    
    return {"handled": False}


# ==================== COUPLE MODE ====================

class CoupleRequest(BaseModel):
    phone1: str
    phone2: str
    action: str  # "link", "unlink", "status"

@moneyview_router.post("/founder/couple")
async def couple_mode(request: CoupleRequest):
    """Couple mode — link two accounts for shared financial management."""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"success": False, "reply": "Feature not available"}
    
    import json, os
    couple_file = "data/founder/couples.json"
    os.makedirs("data/founder", exist_ok=True)
    
    couples = {}
    if os.path.exists(couple_file):
        with open(couple_file) as f:
            couples = json.load(f)
    
    if request.action == "link":
        couple_id = f"{min(request.phone1, request.phone2)}_{max(request.phone1, request.phone2)}"
        couples[couple_id] = {
            "partner1": request.phone1,
            "partner2": request.phone2,
            "linked_at": datetime.now().isoformat(),
            "shared_goals": [],
            "alert_threshold": 5000  # Alert partner for purchases above this
        }
        with open(couple_file, 'w') as f:
            json.dump(couples, f, indent=2)
        
        return {
            "success": True,
            "reply": f"💑 *Couple Mode Activated!*\n\nYou and your partner are now linked.\n\n"
                     f"*What this means:*\n"
                     f"• Shared budget tracking\n"
                     f"• Monthly couple check-in\n"
                     f"• Big purchase alerts (>₹5,000)\n"
                     f"• Individual spending stays private\n\n"
                     f"To set shared goals, say: 'couple goal save 5 lakh for house'"
        }
    
    elif request.action == "status":
        for cid, data in couples.items():
            if request.phone1 in [data["partner1"], data["partner2"]]:
                user1 = moneyview_agent._get_user(data["partner1"])
                user2 = moneyview_agent._get_user(data["partner2"])
                name1 = user1.get("name", "Partner 1")
                name2 = user2.get("name", "Partner 2")
                
                return {
                    "success": True,
                    "reply": f"💑 *Couple Finance Status*\n━━━━━━━━━━━━━━━━\n\n"
                             f"👤 {name1}: ₹{user1.get('monthly_expenses', 0):,}/mo\n"
                             f"👤 {name2}: ₹{user2.get('monthly_expenses', 0):,}/mo\n"
                             f"🏠 Combined: ₹{user1.get('monthly_expenses', 0) + user2.get('monthly_expenses', 0):,}/mo\n\n"
                             f"Everything on track! No surprises 💚"
                }
        return {"success": False, "reply": "Not in couple mode. Link with: 'couple link [partner phone]'"}
    
    return {"success": False, "reply": "Unknown action"}


# ==================== SALARY DETECTION & BILL REMINDERS ====================

@moneyview_router.post("/founder/salary-detect")
async def detect_salary(request: Request):
    """Detect salary credit and trigger auto-allocation."""
    data = await request.json()
    phone = data.get("phone", "")
    amount = data.get("amount", 0)
    
    user = moneyview_agent._get_user(phone)
    name = user.get("name", "there")
    monthly_income = user.get("monthly_income", amount)
    
    # Auto-allocation based on 50/30/20 rule
    needs = int(amount * 0.50)
    wants = int(amount * 0.30)
    savings = int(amount * 0.20)
    
    # Check for active goals
    goals = user.get("goals", [])
    goal_allocation = ""
    if goals:
        goal = goals[0] if isinstance(goals, list) else {}
        goal_name = goal.get("name", "Savings Goal")
        goal_amount = min(savings, goal.get("target", 10000) - goal.get("current", 0))
        goal_allocation = f"✅ {goal_name}: ₹{goal_amount:,}\n"
    
    reply = (
        f"💰 *Salary Credited: ₹{amount:,}!*\n━━━━━━━━━━━━━━━━\n\n"
        f"*AUTO-ALLOCATION (50/30/20 Rule):*\n\n"
        f"🏠 Needs (rent, bills, food): ₹{needs:,}\n"
        f"🎉 Wants (fun, shopping): ₹{wants:,}\n"
        f"💰 Savings & Goals: ₹{savings:,}\n"
        f"{goal_allocation}\n"
        f"[Auto-allocate now] [I'll do it manually]"
    )
    
    return {"success": True, "reply": reply}


@moneyview_router.get("/founder/reminders/{phone}")
async def get_reminders(phone: str):
    """Get upcoming bill reminders for user."""
    import json, os
    reminder_file = f"data/founder/reminders_{phone}.json"
    
    if not os.path.exists(reminder_file):
        return {
            "reminders": [],
            "reply": "📋 No reminders set yet.\n\nSet one: 'remind me to pay rent on 1st of every month'"
        }
    
    with open(reminder_file) as f:
        reminders = json.load(f)
    
    if not reminders:
        return {"reminders": [], "reply": "📋 All clear! No upcoming reminders."}
    
    msg = "🔔 *Upcoming Reminders*\n━━━━━━━━━━━━━━━━\n\n"
    for r in reminders[:5]:
        msg += f"📅 {r.get('text', '?')} — {r.get('time', '?')}\n"
    
    return {"reminders": reminders, "reply": msg}


# ==================== AUTO-CAPTURE ENDPOINTS ====================

@moneyview_router.post("/parse-image")

async def parse_image(request: ImageParseRequest):
    """
    Layer 3: Parse payment screenshot using OpenAI Vision API.
    Called by WhatsApp bot when user sends an image.
    """
    if not AUTO_CAPTURE_AVAILABLE or not screenshot_parser:
        # Fallback: process caption if available
        if request.caption:
            reply = await process_message(request.phone, request.caption, request.sender_name)
            return {"success": True, "reply": reply}
        return {"success": False, "error": "Auto-capture not available", 
                "reply": "📸 I received your image! To log a payment, type: 'spent 500 on food'"}
    
    try:
        user = moneyview_agent._get_user(request.phone)
        
        # Parse screenshot with AI Vision
        parsed = screenshot_parser.parse_screenshot_base64(request.image_base64, user)
        
        if parsed.get("is_financial") and parsed.get("amount"):
            # Check status — only log successful payments
            if parsed.get("status") == "failed":
                return {"success": True, "reply": "❌ This payment looks like it *failed*. Not logging it.\nIf it actually went through, type: 'spent [amount] on [category]'"}
            
            if parsed.get("status") == "pending":
                return {"success": True, "reply": "⏳ This payment looks *pending*. I'll wait for confirmation.\nOnce it goes through, forward the success screenshot!"}
            
            # Auto-log the transaction
            txn_type = "income" if parsed.get("type") == "credit" else "expense"
            
            moneyview_agent._add_transaction(
                request.phone,
                txn_type,
                parsed["amount"],
                parsed.get("category", "uncategorized"),
                f"Screenshot: {parsed.get('merchant', 'Unknown')} via {parsed.get('app', 'unknown')}",
                source="screenshot"
            )
            
            today_income, today_expense = moneyview_agent._get_today_transactions(request.phone)
            budget_left = user.get("daily_budget", 1000) - today_expense
            
            emoji = "💰" if txn_type == "income" else "✅"
            merchant = parsed.get("merchant", "Unknown")
            category = parsed.get("category", "uncategorized").replace("_", " ").title()
            app_name = parsed.get("app", "unknown").replace("_", " ").title()
            
            reply = f"""{emoji} *Auto-logged from screenshot!*

💸 ₹{int(parsed['amount']):,} → {category} ({merchant})
📱 App: {app_name}
🔍 Confidence: {int(parsed.get('confidence', 0.8) * 100)}%"""
            
            if txn_type == "expense" and budget_left > 0:
                reply += f"\n💰 Budget left today: ₹{int(budget_left):,}"
            elif txn_type == "expense":
                reply += f"\n⚠️ Over budget by ₹{int(abs(budget_left)):,}"
            
            reply += "\n\n_Wrong category? Reply 'fix'. Wrong amount? Just type the correct one._"
            
            return {"success": True, "reply": reply, "parsed": parsed}
        
        # Not a payment screenshot
        if request.caption:
            reply = await process_message(request.phone, request.caption, request.sender_name)
            return {"success": True, "reply": reply}
        
        return {"success": True, "reply": """📸 *I couldn't find a payment in this image.*

If this is a payment screenshot, make sure it shows:
• The amount (₹...)
• Payment status (Success/Paid)

Or just type: "spent 500 on food" to log manually! 💬"""}
        
    except Exception as e:
        print(f"[parse-image] Error: {e}")
        if request.caption:
            reply = await process_message(request.phone, request.caption, request.sender_name)
            return {"success": True, "reply": reply}
        return {"success": False, "error": str(e),
                "reply": "📸 Couldn't parse this image. Type 'spent [amount] on [category]' to log manually!"}


@moneyview_router.post("/parse-sms")
async def parse_sms(request: SMSParseRequest):
    """
    Layer 1: Parse bank SMS for auto-capture.
    Called by Android companion app (future) or manual forwarding.
    """
    if not AUTO_CAPTURE_AVAILABLE or not sms_parser:
        return {"success": False, "error": "SMS parser not available"}
    
    try:
        parsed = sms_parser.parse_sms(request.sms_text)
        
        if not parsed.get("is_financial"):
            return {"success": True, "is_financial": False, "message": "Not a financial SMS"}
        
        # Auto-log the transaction
        user = moneyview_agent._get_user(request.phone)
        txn_type = "income" if parsed["type"] == "credit" else "expense"
        
        moneyview_agent._add_transaction(
            request.phone,
            txn_type,
            parsed["amount"],
            parsed.get("category", "uncategorized"),
            f"SMS Auto: {parsed.get('merchant', 'Bank')} via {parsed.get('payment_method', 'unknown')}",
            source="sms_auto"
        )
        
        # Calculate budget remaining
        today_income, today_expense = moneyview_agent._get_today_transactions(request.phone)
        budget_left = user.get("daily_budget", 1000) - today_expense
        
        # Format WhatsApp confirmation
        reply = sms_parser.format_whatsapp_message(parsed, user, budget_left)
        
        return {
            "success": True,
            "is_financial": True,
            "parsed": parsed,
            "reply": reply,
            "budget_remaining": budget_left
        }
        
    except Exception as e:
        print(f"[parse-sms] Error: {e}")
        return {"success": False, "error": str(e)}


@moneyview_router.get("/smart-prompt/{phone}")
async def get_smart_prompt(phone: str):
    """
    Layer 5: Generate smart cash expense prompt for a user.
    Called by scheduler or n8n at specific times.
    """
    if not AUTO_CAPTURE_AVAILABLE or not smart_cash_prompter:
        return {"success": False, "error": "Smart prompter not available"}
    
    try:
        user = moneyview_agent._get_user(phone)
        if not user.get("onboarding_complete"):
            return {"success": False, "message": "User not onboarded"}
        
        now = datetime.now(IST) if IST else datetime.now()
        current_hour = now.hour
        
        # Get today's transactions for context
        today_txns = moneyview_agent.transaction_store.get(phone, [])
        today_str = now.strftime("%Y-%m-%d")
        today_only = [t for t in today_txns if t.get("date", "").startswith(today_str)]
        
        # Calculate cash gap
        today_income, today_expense = moneyview_agent._get_today_transactions(phone)
        daily_budget = user.get("daily_budget", 1000)
        cash_gap = max(0, daily_budget - today_expense) if today_expense < daily_budget * 0.5 else 0
        
        prompt = smart_cash_prompter.generate_prompt(
            user=user,
            current_hour=current_hour,
            today_transactions=today_only,
            cash_gap=cash_gap,
            last_prompt_time=user.get("last_cash_prompt")
        )
        
        if prompt and prompt.get("should_prompt"):
            # Update last prompt time
            user["last_cash_prompt"] = now.isoformat()
            moneyview_agent._save_data()
            
            return {
                "success": True,
                "prompt": prompt,
                "phone": phone,
                "user_name": user.get("name", "Friend")
            }
        
        return {"success": False, "message": "No prompt needed right now"}
        
    except Exception as e:
        print(f"[smart-prompt] Error: {e}")
        return {"success": False, "error": str(e)}


@moneyview_router.get("/auto-capture-status")
async def auto_capture_status():
    """Check status of all auto-capture layers"""
    import os
    return {
        "auto_capture_available": AUTO_CAPTURE_AVAILABLE,
        "layers": {
            "layer_1_sms": {
                "status": "ready" if sms_parser else "unavailable",
                "description": "Bank SMS Parser — parses debit/credit alerts from all Indian banks"
            },
            "layer_3_screenshot": {
                "status": "ready" if screenshot_parser else "unavailable",
                "requires_openai": True,
                "openai_configured": bool(os.getenv("OPENAI_API_KEY", "")),
                "description": "Screenshot Parser — reads payment success screens via AI Vision"
            },
            "layer_3_forward": {
                "status": "ready" if screenshot_parser else "unavailable",
                "description": "Forwarded Message Parser — auto-logs forwarded payment confirmations"
            },
            "layer_5_smart_prompt": {
                "status": "ready" if smart_cash_prompter else "unavailable",
                "description": "Smart Cash Prompter — context-aware prompts for cash expenses"
            }
        }
    }


# ==================== SCHEDULED MESSAGES ====================


@moneyview_router.get("/morning-briefing")
async def get_morning_briefings():
    """
    Generate morning briefing messages for all active users
    Called by n8n at 6 AM IST
    """
    users = moneyview_agent.user_store
    results = []
    
    now = datetime.now(IST) if IST else datetime.now()
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    
    for phone, user in users.items():
        if not user.get("onboarding_complete"):
            continue
        
        lang = user.get("language", "en")
        name = user.get("name", "Friend")
        daily_budget = user.get("daily_budget", 1000)
        
        # Get yesterday's transactions
        transactions = moneyview_agent.transaction_store.get(phone, [])
        yesterday_income = sum(
            t["amount"] for t in transactions 
            if t["type"] == "income" and t["date"].startswith(yesterday)
        )
        yesterday_expense = sum(
            t["amount"] for t in transactions 
            if t["type"] == "expense" and t["date"].startswith(yesterday)
        )
        saved = yesterday_income - yesterday_expense
        
        # Get motivational quote
        quote = moneyview_agent._get_quote(lang)
        
        # Generate message
        if lang == "en":
            message = f"""☀️ *Good Morning, {name}!*

📊 *Yesterday's Summary:*
━━━━━━━━━━━━━━━━━━━━━
💵 Income: ₹{int(yesterday_income):,}
💸 Expenses: ₹{int(yesterday_expense):,}
💰 Saved: ₹{int(saved):,}

🎯 *Today's Targets:*
• Daily Budget: ₹{int(daily_budget):,}
• Savings Goal: ₹{int(daily_budget * 0.2):,}

💪 *Motivation:*
_{quote}_

Let's make today count! 🚀"""
        
        elif lang == "hi":
            message = f"""☀️ *सुप्रभात, {name}!*

📊 *कल का सारांश:*
━━━━━━━━━━━━━━━━━━━━━
💵 आय: ₹{int(yesterday_income):,}
💸 खर्च: ₹{int(yesterday_expense):,}
💰 बचत: ₹{int(saved):,}

🎯 *आज के लक्ष्य:*
• दैनिक बजट: ₹{int(daily_budget):,}

💪 {quote}

आज को बेहतर बनाएं! 🚀"""
        
        elif lang == "ta":
            message = f"""☀️ *காலை வணக்கம், {name}!*

📊 *நேற்றைய சுருக்கம்:*
━━━━━━━━━━━━━━━━━━━━━
💵 வருமானம்: ₹{int(yesterday_income):,}
💸 செலவு: ₹{int(yesterday_expense):,}
💰 சேமிப்பு: ₹{int(saved):,}

🎯 *இன்றைய இலக்கு:*
• தினசரி பட்ஜெட்: ₹{int(daily_budget):,}

💪 இன்று சிறப்பாக இருக்கும்! 🚀"""
        
        else:
            message = f"""☀️ *Good Morning, {name}!*

📊 Yesterday: ₹{int(yesterday_income):,} earned, ₹{int(yesterday_expense):,} spent
🎯 Today's Budget: ₹{int(daily_budget):,}

{quote}

Have a great day! 🚀"""
        
        results.append({
            "phone": phone,
            "message": message
        })
    
    return results


@moneyview_router.get("/market-analysis")
async def get_market_analysis():
    """
    Generate market analysis for users interested in investments
    Called by n8n at 9 AM IST
    """
    users = moneyview_agent.user_store
    results = []
    
    for phone, user in users.items():
        if not user.get("onboarding_complete"):
            continue
        
        # Send market analysis to users with investments or high risk appetite
        if user.get("current_investments", 0) > 0 or user.get("risk_appetite") in ["Medium", "High"]:
            lang = user.get("language", "en")
            
            try:
                market_msg = await get_market_update(lang)
                results.append({
                    "phone": phone,
                    "message": market_msg
                })
            except Exception as e:
                print(f"Error generating market update for {phone}: {e}")
    
    return results


@moneyview_router.get("/evening-checkin")
async def get_evening_checkins():
    """
    Generate evening check-in messages
    Called by n8n at 8 PM IST
    """
    users = moneyview_agent.user_store
    results = []
    
    now = datetime.now(IST) if IST else datetime.now()
    today = now.strftime("%Y-%m-%d")
    
    for phone, user in users.items():
        if not user.get("onboarding_complete"):
            continue
        
        lang = user.get("language", "en")
        name = user.get("name", "Friend")
        daily_budget = user.get("daily_budget", 1000)
        
        # Get today's transactions
        transactions = moneyview_agent.transaction_store.get(phone, [])
        today_income = sum(
            t["amount"] for t in transactions 
            if t["type"] == "income" and t["date"].startswith(today)
        )
        today_expense = sum(
            t["amount"] for t in transactions 
            if t["type"] == "expense" and t["date"].startswith(today)
        )
        net = today_income - today_expense
        remaining = max(0, daily_budget - today_expense)
        
        # Status message
        if net > 0:
            status = "🎉 Great day! You earned more than you spent!"
        elif today_expense < daily_budget:
            status = "👏 Good job staying within budget!"
        else:
            status = "💪 Tomorrow is a new opportunity!"
        
        if lang == "en":
            message = f"""🌙 *Evening Check-in, {name}!*

📊 *Today So Far:*
━━━━━━━━━━━━━━━━━━━━━
💵 Income: ₹{int(today_income):,}
💸 Expenses: ₹{int(today_expense):,}
💰 Net: ₹{int(net):,}
📋 Budget Left: ₹{int(remaining):,}

{status}

*Any more transactions to add?*
_(Type: "Spent 200 on dinner" or "that's all")_"""
        
        elif lang == "hi":
            message = f"""🌙 *शाम की जांच, {name}!*

📊 *आज अब तक:*
💵 आय: ₹{int(today_income):,}
💸 खर्च: ₹{int(today_expense):,}
💰 शुद्ध: ₹{int(net):,}

{status}

*और कोई लेनदेन?*"""
        
        elif lang == "ta":
            message = f"""🌙 *மாலை சரிபார்ப்பு, {name}!*

📊 *இன்று வரை:*
💵 வருமானம்: ₹{int(today_income):,}
💸 செலவு: ₹{int(today_expense):,}
💰 நிகரம்: ₹{int(net):,}

{status}

*வேறு பரிவர்த்தனைகள் உள்ளதா?*"""
        
        else:
            message = f"""🌙 *Evening Check-in, {name}!*

Today: ₹{int(today_income):,} in, ₹{int(today_expense):,} out
{status}

Any more to add?"""
        
        results.append({
            "phone": phone,
            "message": message
        })
    
    return results


@moneyview_router.post("/weekly-reports")
async def generate_weekly_reports():
    """
    Generate weekly reports with comparison
    Called by n8n on Sunday 10 AM
    """
    users = moneyview_agent.user_store
    results = []
    
    now = datetime.now(IST) if IST else datetime.now()
    week_end = now.strftime("%Y-%m-%d")
    week_start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    last_week_end = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    last_week_start = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    
    for phone, user in users.items():
        if not user.get("onboarding_complete"):
            continue
        
        lang = user.get("language", "en")
        name = user.get("name", "Friend")
        
        # Get this week's transactions
        transactions = moneyview_agent.transaction_store.get(phone, [])
        
        def get_week_totals(start, end):
            income = sum(
                t["amount"] for t in transactions 
                if t["type"] == "income" and start <= t["date"][:10] <= end
            )
            expense = sum(
                t["amount"] for t in transactions 
                if t["type"] == "expense" and start <= t["date"][:10] <= end
            )
            return income, expense
        
        this_income, this_expense = get_week_totals(week_start, week_end)
        last_income, last_expense = get_week_totals(last_week_start, last_week_end)
        
        this_savings = this_income - this_expense
        last_savings = last_income - last_expense
        
        # Calculate % changes
        def calc_change(current, previous):
            if previous == 0:
                return "+100%" if current > 0 else "0%"
            change = ((current - previous) / previous) * 100
            return f"+{change:.1f}%" if change > 0 else f"{change:.1f}%"
        
        income_change = calc_change(this_income, last_income)
        expense_change = calc_change(this_expense, last_expense)
        savings_change = calc_change(this_savings, last_savings)
        
        # Goal progress
        goals = user.get("goals", [])
        goals_text = ""
        for goal in goals:
            if goal.get("status") != "achieved":
                target = goal.get("amount", 0)
                progress = min(100, (this_savings / target * 100)) if target > 0 else 0
                goals_text += f"🎯 {goal.get('name', 'Goal')}: {progress:.1f}%\n"
        
        # Generate insights
        if this_savings > last_savings:
            insight = "📈 Your savings improved this week! Keep it up!"
        elif this_expense < last_expense:
            insight = "💪 You spent less this week. Great control!"
        else:
            insight = "📊 Focus on reducing expenses next week."
        
        report = f"""📊 *Weekly Report - {name}*
Week: {week_start} to {week_end}
━━━━━━━━━━━━━━━━━━━━━

💵 *Income:*
This Week: ₹{int(this_income):,}
Last Week: ₹{int(last_income):,}
Change: {income_change}

💸 *Expenses:*
This Week: ₹{int(this_expense):,}
Last Week: ₹{int(last_expense):,}
Change: {expense_change}

💰 *Savings:*
This Week: ₹{int(this_savings):,}
Last Week: ₹{int(last_savings):,}
Change: {savings_change}

{goals_text}

💡 *Insight:*
{insight}

Type "PDF report" for detailed analysis."""
        
        results.append({
            "phone": phone,
            "report": report
        })
    
    return results


@moneyview_router.post("/monthly-reports")
async def generate_monthly_reports():
    """
    Generate monthly reports
    Called by n8n on 1st of every month
    """
    users = moneyview_agent.user_store
    results = []
    
    now = datetime.now(IST) if IST else datetime.now()
    
    # Get last month's dates
    first_of_this_month = now.replace(day=1)
    last_month_end = first_of_this_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    
    month_start = last_month_start.strftime("%Y-%m-%d")
    month_end = last_month_end.strftime("%Y-%m-%d")
    month_name = last_month_start.strftime("%B %Y")
    
    for phone, user in users.items():
        if not user.get("onboarding_complete"):
            continue
        
        name = user.get("name", "Friend")
        
        # Get month's transactions
        transactions = moneyview_agent.transaction_store.get(phone, [])
        
        month_income = sum(
            t["amount"] for t in transactions 
            if t["type"] == "income" and month_start <= t["date"][:10] <= month_end
        )
        month_expense = sum(
            t["amount"] for t in transactions 
            if t["type"] == "expense" and month_start <= t["date"][:10] <= month_end
        )
        month_savings = month_income - month_expense
        
        # Category breakdown
        categories = {}
        for t in transactions:
            if t["type"] == "expense" and month_start <= t["date"][:10] <= month_end:
                cat = t.get("category", "Other")
                categories[cat] = categories.get(cat, 0) + t["amount"]
        
        cat_breakdown = ""
        for cat, amount in sorted(categories.items(), key=lambda x: -x[1])[:5]:
            cat_breakdown += f"• {cat}: ₹{int(amount):,}\n"
        
        # Determine message based on savings
        if month_savings > 0:
            savings_msg = "🎉 Great month! Your savings are growing!"
        else:
            savings_msg = "💪 Let's improve next month!"
        
        report = f"""📊 *Monthly Report - {name}*
Month: {month_name}
━━━━━━━━━━━━━━━━━━━━━

💵 *Total Income:* ₹{int(month_income):,}
💸 *Total Expenses:* ₹{int(month_expense):,}
💰 *Net Savings:* ₹{int(month_savings):,}

📈 *Top Spending Categories:*
{cat_breakdown}

📊 *Savings Rate:* {(month_savings/month_income*100) if month_income > 0 else 0:.1f}%

{savings_msg}

_MoneyViya - Your Financial Partner_ 💰"""
        
        results.append({
            "phone": phone,
            "report": report
        })
    
    return results


# ==================== USER MANAGEMENT ====================

@moneyview_router.get("/users/active")
async def get_active_users():
    """Get all active (onboarded) users"""
    users = moneyview_agent.user_store
    active_users = []
    
    for phone, user in users.items():
        if user.get("onboarding_complete"):
            active_users.append({
                "phone": phone,
                "name": user.get("name", "Friend"),
                "language": user.get("language", "en"),
                "daily_budget": user.get("daily_budget", 1000),
                "risk_appetite": user.get("risk_appetite", "Medium")
            })
    
    return active_users


@moneyview_router.get("/user/{phone}")
async def get_user_profile(phone: str):
    """Get user profile and summary for dashboard"""
    
    # Try to find user with various formats
    user = None
    actual_phone = phone
    
    # Try different phone formats
    phone_variants = [
        phone, 
        "91" + phone, 
        phone.replace("91", ""),
        phone[-10:] if len(phone) > 10 else phone  # Last 10 digits
    ]
    
    for p in phone_variants:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    # If still not found, search through all users for matching linked_phone
    if not user:
        for uid, u in moneyview_agent.user_store.items():
            if u.get("linked_phone") == phone or u.get("phone") == phone:
                user = u
                actual_phone = uid
                break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Complete onboarding via WhatsApp first.")
    
    # Get today's transactions
    today = datetime.now(IST).strftime("%Y-%m-%d") if IST else datetime.now().strftime("%Y-%m-%d")
    transactions = moneyview_agent.transaction_store.get(phone, [])
    
    today_income = sum(
        t["amount"] for t in transactions 
        if t["type"] == "income" and t["date"].startswith(today)
    )
    today_expense = sum(
        t["amount"] for t in transactions 
        if t["type"] == "expense" and t["date"].startswith(today)
    )
    
    # Calculate totals (all time)
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    
    # Get ALL transactions sorted by date (recent first)
    all_transactions = sorted(
        transactions, 
        key=lambda x: x.get("date", ""), 
        reverse=True
    )
    
    # Recent for dashboard display
    recent_transactions = all_transactions[:20]
    
    # Calculate remaining budget (based on daily allowance minus expenses only)
    daily_budget = user.get("daily_budget", 0)
    remaining_budget = daily_budget - today_expense  # Don't add income to budget
    
    return {
        "phone": phone,
        "name": user.get("name"),
        "language": user.get("language"),
        "occupation": user.get("occupation"),
        "monthly_income": user.get("monthly_income", 0),
        "monthly_expenses": user.get("monthly_expenses", 0),
        "daily_budget": daily_budget,
        "remaining_budget": remaining_budget,
        "current_savings": user.get("current_savings", 0),
        "goals": user.get("goals", []),
        "risk_appetite": user.get("risk_appetite"),
        "onboarding_complete": user.get("onboarding_complete"),
        "today_income": today_income,
        "today_expense": today_expense,
        "today_net": today_income - today_expense,
        "total_income": total_income,
        "total_expense": total_expense,
        "total_net": total_income - total_expense,
        "transaction_count": len(all_transactions),
        "recent_transactions": recent_transactions,
        "all_transactions": all_transactions,
        "last_updated": user.get("last_active")
    }


# User update model
class UserUpdate(BaseModel):
    name: Optional[str] = None
    occupation: Optional[str] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    current_savings: Optional[float] = None
    risk_appetite: Optional[str] = None


@moneyview_router.post("/user/{phone}/update")
async def update_user_profile(phone: str, updates: UserUpdate):
    """Update user profile from dashboard"""
    
    # Try to find user with various formats
    user = None
    actual_phone = phone
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    if not user:
        # Create new user if not exists
        user = {
            "phone": phone,
            "language": "en",
            "onboarding_complete": False
        }
        moneyview_agent.user_store[phone] = user
        actual_phone = phone
    
    # Update fields
    if updates.name is not None:
        user["name"] = updates.name
    if updates.occupation is not None:
        user["occupation"] = updates.occupation
    if updates.monthly_income is not None:
        user["monthly_income"] = updates.monthly_income
        # Recalculate daily budget
        expenses = user.get("monthly_expenses", 0)
        surplus = updates.monthly_income - expenses
        user["daily_budget"] = int(updates.monthly_income / 30)
        user["monthly_surplus"] = surplus
    if updates.monthly_expenses is not None:
        user["monthly_expenses"] = updates.monthly_expenses
        income = user.get("monthly_income", 0)
        user["monthly_surplus"] = income - updates.monthly_expenses
    if updates.current_savings is not None:
        user["current_savings"] = updates.current_savings
    if updates.risk_appetite is not None:
        user["risk_appetite"] = updates.risk_appetite
    
    # Save
    moneyview_agent.user_store[actual_phone] = user
    
    return {
        "success": True,
        "message": "Profile updated",
        "user": {
            "name": user.get("name"),
            "occupation": user.get("occupation"),
            "monthly_income": user.get("monthly_income"),
            "monthly_expenses": user.get("monthly_expenses"),
            "current_savings": user.get("current_savings"),
            "daily_budget": user.get("daily_budget"),
            "risk_appetite": user.get("risk_appetite")
        }
    }


# ==================== USER MANAGEMENT ====================

@moneyview_router.get("/users")
async def list_all_users():
    """List all registered users (for dashboard discovery)"""
    users = []
    for phone, user in moneyview_agent.user_store.items():
        users.append({
            "id": phone,
            "name": user.get("name", "Unknown"),
            "phone": user.get("phone", phone),
            "language": user.get("language", "en"),
            "onboarding_complete": user.get("onboarding_complete", False),
            "occupation": user.get("occupation"),
            "monthly_income": user.get("monthly_income", 0)
        })
    return {"users": users, "count": len(users)}


@moneyview_router.post("/link-phone")
async def link_phone_to_user(phone: str, user_id: str):
    """Link a phone number to an existing user ID (for LID to phone mapping)"""
    
    # Find user by user_id (could be LID)
    user = moneyview_agent.user_store.get(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also store the user under the phone number for easier lookup
    user["linked_phone"] = phone
    moneyview_agent.user_store[phone] = user
    
    return {"success": True, "message": f"Phone {phone} linked to user {user_id}"}


@moneyview_router.get("/user/search/{query}")
async def search_user(query: str):
    """Search for user by name or partial phone"""
    query_lower = query.lower()
    
    results = []
    for phone, user in moneyview_agent.user_store.items():
        name = user.get("name", "").lower()
        if query_lower in name or query_lower in phone:
            results.append({
                "id": phone,
                "name": user.get("name"),
                "phone": phone,
                "onboarding_complete": user.get("onboarding_complete", False)
            })
    
    return {"results": results, "count": len(results)}


# ==================== GOAL MANAGEMENT ====================

class GoalCreate(BaseModel):
    name: str
    amount: float
    timeline: Optional[str] = "1 year"

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    timeline: Optional[str] = None
    current: Optional[float] = None
    status: Optional[str] = None


@moneyview_router.post("/user/{phone}/goals")
async def add_goal(phone: str, goal: GoalCreate):
    """Add a new goal from dashboard"""
    user = None
    actual_phone = phone
    
    # Find user
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add goal
    if "goals" not in user:
        user["goals"] = []
    
    new_goal = {
        "name": goal.name,
        "amount": goal.amount,
        "timeline": goal.timeline,
        "current": 0,
        "status": "active",
        "created": datetime.now(IST).isoformat() if IST else datetime.now().isoformat()
    }
    
    user["goals"].append(new_goal)
    moneyview_agent._save_user(actual_phone, user)
    
    return {"success": True, "goal": new_goal, "total_goals": len(user["goals"])}


@moneyview_router.put("/user/{phone}/goals/{goal_index}")
async def update_goal(phone: str, goal_index: int, updates: GoalUpdate):
    """Update a goal from dashboard"""
    user = None
    actual_phone = phone
    
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    goals = user.get("goals", [])
    if goal_index >= len(goals):
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal = goals[goal_index]
    if updates.name is not None:
        goal["name"] = updates.name
    if updates.amount is not None:
        goal["amount"] = updates.amount
    if updates.timeline is not None:
        goal["timeline"] = updates.timeline
    if updates.current is not None:
        goal["current"] = updates.current
    if updates.status is not None:
        goal["status"] = updates.status
    
    user["goals"][goal_index] = goal
    moneyview_agent._save_user(actual_phone, user)
    
    return {"success": True, "goal": goal}


@moneyview_router.delete("/user/{phone}/goals/{goal_index}")
async def delete_goal(phone: str, goal_index: int):
    """Delete a goal from dashboard"""
    user = None
    actual_phone = phone
    
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    goals = user.get("goals", [])
    if goal_index >= len(goals):
        raise HTTPException(status_code=404, detail="Goal not found")
    
    deleted = goals.pop(goal_index)
    user["goals"] = goals
    moneyview_agent._save_user(actual_phone, user)
    
    return {"success": True, "deleted": deleted}


# ==================== TRANSACTION MANAGEMENT ====================

class TransactionCreate(BaseModel):
    type: str  # "expense" or "income"
    amount: float
    category: str
    description: Optional[str] = ""


@moneyview_router.post("/user/{phone}/transactions")
async def add_transaction(phone: str, txn: TransactionCreate):
    """Add a transaction from dashboard"""
    user = None
    actual_phone = phone
    
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        user = moneyview_agent.user_store.get(p)
        if user:
            actual_phone = p
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    moneyview_agent._add_transaction(
        actual_phone,
        txn.type,
        txn.amount,
        txn.category,
        txn.description
    )
    
    return {"success": True, "message": f"{txn.type.title()} of ₹{txn.amount} added"}


@moneyview_router.get("/user/{phone}/transactions")
async def get_transactions(phone: str, limit: int = 50):
    """Get user transactions"""
    actual_phone = phone
    
    for p in [phone, "91" + phone, phone.replace("91", "")]:
        if p in moneyview_agent.transaction_store:
            actual_phone = p
            break
    
    transactions = moneyview_agent.transaction_store.get(actual_phone, [])
    
    # Sort by date, newest first
    sorted_txns = sorted(
        transactions,
        key=lambda x: x.get("date", ""),
        reverse=True
    )[:limit]
    
    return {"transactions": sorted_txns, "count": len(sorted_txns)}


# ==================== LIFE INTELLIGENCE ENDPOINTS ====================

# Import life agents
try:
    from services.life_agents import (
        habit_agent, pain_detector, daily_engine,
        weekly_reflection, goal_synthesizer
    )
    LIFE_AGENTS_API = True
except:
    LIFE_AGENTS_API = False


@moneyview_router.get("/life/morning-briefing/{phone}")
async def life_morning_briefing(phone: str):
    """Get personalized morning briefing for a user"""
    if not LIFE_AGENTS_API:
        return {"success": False, "error": "Life agents not available"}
    
    user = moneyview_agent.user_store.get(phone)
    if not user:
        return {"success": False, "error": "User not found"}
    
    briefing = daily_engine.morning_briefing(user)
    return {"success": True, "briefing": briefing}


@moneyview_router.get("/life/evening-checkin/{phone}")
async def life_evening_checkin(phone: str):
    """Get evening check-in for a user"""
    if not LIFE_AGENTS_API:
        return {"success": False, "error": "Life agents not available"}
    
    user = moneyview_agent.user_store.get(phone)
    if not user:
        return {"success": False, "error": "User not found"}
    
    checkin = daily_engine.evening_checkin(user)
    return {"success": True, "checkin": checkin}


@moneyview_router.get("/life/weekly-review/{phone}")
async def life_weekly_review(phone: str):
    """Get weekly review for a user"""
    if not LIFE_AGENTS_API:
        return {"success": False, "error": "Life agents not available"}
    
    user = moneyview_agent.user_store.get(phone)
    if not user:
        return {"success": False, "error": "User not found"}
    
    review = weekly_reflection.generate_review(user)
    return {"success": True, "review": review}


@moneyview_router.get("/life/habits/{phone}")
async def life_habits(phone: str):
    """Get habit status for a user"""
    if not LIFE_AGENTS_API:
        return {"success": False, "error": "Life agents not available"}
    
    user = moneyview_agent.user_store.get(phone)
    if not user:
        return {"success": False, "error": "User not found"}
    
    habits = user.get("habits", [])
    return {
        "success": True,
        "habits": habits,
        "total_streak_points": sum(h.get("streak", 0) for h in habits)
    }


@moneyview_router.get("/life/goals/{phone}")
async def life_goals(phone: str):
    """Get goal status for a user"""
    if not LIFE_AGENTS_API:
        return {"success": False, "error": "Life agents not available"}
    
    user = moneyview_agent.user_store.get(phone)
    if not user:
        return {"success": False, "error": "User not found"}
    
    goals = user.get("goals", [])
    return {"success": True, "goals": goals}


# ==================== HEALTH CHECK ====================


@moneyview_router.get("/health")
async def health_check():
    """MoneyViya API health check"""
    user_count = len(moneyview_agent.user_store)
    return {
        "status": "healthy",
        "service": "MoneyViya API",
        "version": "6.0.0-founder",
        "user_count": user_count,
        "life_agents": LIFE_AGENTS_API,
        "founder_agents": FOUNDER_AGENTS_AVAILABLE,
        "features": [
            "onboarding",
            "expense_tracking",
            "income_tracking",
            "goal_management",
            "market_analysis",
            "scheduled_messages",
            "multilingual",
            "profile_editing",
            "dashboard_sync",
            "habit_tracking",
            "daily_briefings",
            "weekly_reviews",
            "goal_synthesis",
            "pain_detection",
            "founder_social_pressure_defense",
            "founder_emotional_spending_detector",
            "founder_subscription_detective",
            "founder_micro_spending_alert",
            "founder_emergency_response",
            "founder_family_obligation_manager",
            "founder_purchase_decision_assistant",
            "founder_financial_educator",
            "founder_proactive_messaging",
            "founder_viral_moments"
        ]
    }


# ==================== FOUNDER EDITION ENDPOINTS ====================


@moneyview_router.get("/founder/subscriptions/{phone}")
async def subscription_audit(phone: str):
    """Run subscription audit for user"""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"reply": "Founder agents not available"}
    user = moneyview_agent._get_user(phone)
    return {"reply": founder_agents.subscription_audit(user)}


@moneyview_router.post("/founder/explain")
async def explain_concept(request: Request):
    """ELI5 financial concept"""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"reply": "Founder agents not available"}
    data = await request.json()
    concept = data.get("concept", "")
    return {"reply": founder_agents.explain_concept(concept)}


@moneyview_router.post("/founder/purchase-decision")
async def purchase_decision(request: Request):
    """Help with big purchase decisions"""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"reply": "Founder agents not available"}
    data = await request.json()
    phone = data.get("phone", "")
    item = data.get("item", "")
    price = data.get("price", 0)
    user = moneyview_agent._get_user(phone)
    return {"reply": founder_agents.purchase_decision(user, item, price)}


@moneyview_router.get("/founder/morning/{phone}")
async def morning_brief(phone: str):
    """Generate morning briefing"""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"reply": "Founder agents not available"}
    user = moneyview_agent._get_user(phone)
    return {"reply": founder_agents.morning_briefing(user)}


@moneyview_router.get("/founder/evening/{phone}")
async def evening_checkin_endpoint(phone: str):
    """Generate evening check-in"""
    if not FOUNDER_AGENTS_AVAILABLE:
        return {"reply": "Founder agents not available"}
    user = moneyview_agent._get_user(phone)
    return {"reply": founder_agents.evening_checkin(user)}

