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
        
        # Normal message processing
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


# ==================== HEALTH CHECK ====================


@moneyview_router.get("/health")
async def health_check():
    """MoneyViya API health check"""
    user_count = len(moneyview_agent.user_store)
    return {
        "status": "healthy",
        "service": "MoneyViya API",
        "version": "2.1.0",
        "user_count": user_count,
        "features": [
            "onboarding",
            "expense_tracking",
            "income_tracking",
            "goal_management",
            "market_analysis",
            "scheduled_messages",
            "multilingual",
            "profile_editing",
            "dashboard_sync"
        ]
    }
