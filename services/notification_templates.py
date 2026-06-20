"""
Viya Notification Template System
===================================
PRD Section 4.4 — Multi-channel notification templates with
A/B testing, multi-language support, and rate limiting.

Channels (priority order):
  1. WhatsApp Business API (80% read rate — primary)
  2. In-app notifications (100% delivery if app open)
  3. Push (FCM) (5-10% open rate — backup)
  4. SMS (Twilio/MSG91) (high delivery, last resort)
  5. Email (Resend) (transactional only)
"""

from datetime import datetime
from typing import Dict, Optional, List
from collections import defaultdict


# ═══════════════════════════════════════════════════════════════════
# 1. NOTIFICATION CATEGORIES (PRD lines 1150-1154)
# ═══════════════════════════════════════════════════════════════════

class NotificationCategory:
    TRANSACTIONAL = "transactional"  # Bill due, SIP executed — ALWAYS send
    REMINDER = "reminder"            # User-set reminders — ALWAYS send
    PROACTIVE = "proactive"          # Viya insights — max 2/day, user can disable
    MARKETING = "marketing"          # Product announcements — opt-in, weekly max


# ═══════════════════════════════════════════════════════════════════
# 2. RATE LIMITS PER CHANNEL (PRD lines 1156-1160)
# ═══════════════════════════════════════════════════════════════════

CHANNEL_RATE_LIMITS = {
    "whatsapp": {"proactive": 3, "transactional": 999},     # 3 proactive + unlimited transactional
    "push": {"total": 5},                                     # 5 total per day
    "sms": {"total": 2},                                      # 2 per day (high cost)
    "email": {"transactional": 999, "marketing": 1},          # 1 marketing/week
    "in_app": {"total": 999},                                 # unlimited
}


# ═══════════════════════════════════════════════════════════════════
# 3. NOTIFICATION TEMPLATES (PRD lines 1162-1167)
# ═══════════════════════════════════════════════════════════════════

TEMPLATES: Dict[str, dict] = {
    # ─── Bills & Finance ───
    "bill_due_today": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "push", "sms"],
        "templates": {
            "en": "💰 {{bill_name}} of {{amount}} is due today. Tap to pay → {{deep_link}}",
            "hi": "💰 {{bill_name}} का {{amount}} आज देय है। भुगतान करें → {{deep_link}}",
            "ta": "💰 {{bill_name}} {{amount}} இன்று செலுத்த வேண்டும். செலுத்த → {{deep_link}}",
        },
        "emoji": "💰",
    },
    "bill_overdue": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "push", "sms"],
        "templates": {
            "en": "🔴 Overdue: {{bill_name}} of {{amount}} was due on {{due_date}}. Pay now → {{deep_link}}",
            "hi": "🔴 अतिदेय: {{bill_name}} का {{amount}} {{due_date}} को देय था। अभी भुगतान करें → {{deep_link}}",
        },
        "emoji": "🔴",
    },
    "salary_received": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "in_app"],
        "templates": {
            "en": "🎉 Salary received! {{amount}} credited. Here's your suggested allocation:\n50% Needs: {{needs}}\n30% Wants: {{wants}}\n20% Savings: {{savings}}",
            "hi": "🎉 वेतन प्राप्त! {{amount}} जमा हुआ।",
        },
        "emoji": "🎉",
    },
    "budget_exceeded": {
        "category": NotificationCategory.PROACTIVE,
        "channels": ["whatsapp", "in_app"],
        "templates": {
            "en": "⚠️ Heads up! You've spent {{spent}} on {{category}} this month — {{percent}}% of your {{budget}} budget.",
        },
        "emoji": "⚠️",
    },
    
    # ─── Goals ───
    "goal_milestone": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "push", "in_app"],
        "templates": {
            "en": "🏆 Milestone! You've hit {{percent}}% of your '{{goal_name}}' goal ({{current}}/{{target}}). Keep going! 🔥",
            "hi": "🏆 मील का पत्थर! '{{goal_name}}' लक्ष्य का {{percent}}% पूरा! 🔥",
        },
        "emoji": "🏆",
    },
    "goal_completed": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "push", "in_app"],
        "templates": {
            "en": "🎊 CONGRATULATIONS! You've completed your '{{goal_name}}' goal of {{target}}! You're amazing! 🥳",
        },
        "emoji": "🎊",
    },
    
    # ─── Health ───
    "medicine_due": {
        "category": NotificationCategory.REMINDER,
        "channels": ["whatsapp", "push"],
        "templates": {
            "en": "💊 Time to take {{medicine_name}} ({{dosage}}). Mark as taken → {{deep_link}}",
            "hi": "💊 {{medicine_name}} ({{dosage}}) लेने का समय। ✅ लिया → {{deep_link}}",
        },
        "emoji": "💊",
    },
    "health_daily_summary": {
        "category": NotificationCategory.PROACTIVE,
        "channels": ["whatsapp", "in_app"],
        "templates": {
            "en": "🏃 Today: {{steps}} steps | {{calories}} cal | {{water}}L water | Sleep: {{sleep}}hrs. Health score: {{score}}/100",
        },
        "emoji": "🏃",
    },
    
    # ─── Reminders ───
    "user_reminder": {
        "category": NotificationCategory.REMINDER,
        "channels": ["whatsapp", "push"],
        "templates": {
            "en": "⏰ Reminder: {{reminder_text}}\n[Done] [Remind in 1hr]",
            "hi": "⏰ अनुस्मारक: {{reminder_text}}\n[हो गया] [1 घंटे बाद याद दिलाएं]",
        },
        "emoji": "⏰",
    },
    
    # ─── Morning Brief (PRD lines 1058-1062) ───
    "morning_brief": {
        "category": NotificationCategory.PROACTIVE,
        "channels": ["whatsapp", "in_app"],
        "templates": {
            "en": "☀️ Good morning, {{name}}! Here's your day:\n\n📧 {{email_count}} emails need attention\n💰 {{bills_due}} bills due today\n🎯 {{goals_pending}} goal actions\n💊 {{medicines}} medicines today\n📅 {{events}} events scheduled\n\nOpen Viya → {{deep_link}}",
        },
        "emoji": "☀️",
    },
    
    # ─── Email Intelligence ───
    "email_urgent": {
        "category": NotificationCategory.TRANSACTIONAL,
        "channels": ["whatsapp", "push"],
        "templates": {
            "en": "📧 Urgent email from {{sender}}: {{subject}}\n{{summary}}\nReply → {{deep_link}}",
        },
        "emoji": "📧",
    },
    
    # ─── Weekly Report (PRD lines 1080-1083) ───
    "weekly_report": {
        "category": NotificationCategory.PROACTIVE,
        "channels": ["whatsapp", "email", "in_app"],
        "templates": {
            "en": "📊 Your Week in Review:\n💰 Spent: {{total_spent}}\n💵 Saved: {{total_saved}} ({{save_pct}}%)\n🎯 Goals: {{goals_progress}}\n🏃 Health: {{health_score}}/100\n\nFull report → {{deep_link}}",
        },
        "emoji": "📊",
    },
}


# ═══════════════════════════════════════════════════════════════════
# 4. TEMPLATE ENGINE
# ═══════════════════════════════════════════════════════════════════

def render_template(template_key: str, variables: dict, 
                    language: str = "en") -> Optional[str]:
    """
    Render a notification template with variables.
    Falls back to English if requested language unavailable.
    """
    template = TEMPLATES.get(template_key)
    if not template:
        return None
    
    templates = template.get("templates", {})
    text = templates.get(language, templates.get("en", ""))
    
    # Replace {{variable}} with values
    for key, value in variables.items():
        text = text.replace("{{" + key + "}}", str(value))
    
    return text


# ═══════════════════════════════════════════════════════════════════
# 5. NOTIFICATION DELIVERY MANAGER
# ═══════════════════════════════════════════════════════════════════

class NotificationManager:
    """
    PRD Section 4.4 — Delivery guarantee pattern:
    1. Insert notification (status: pending)
    2. Attempt primary channel
    3. If delivered → status: delivered
    4. If failed → try next channel after 5 min
    5. After all fail → status: failed, alert ops
    """
    
    def __init__(self):
        # In-memory tracking (upgrade to PostgreSQL in production)
        self._sent_today: Dict[str, Dict[str, int]] = defaultdict(
            lambda: defaultdict(int)
        )
        self._notifications: List[dict] = []
    
    def can_send(self, user_id: str, channel: str, 
                 category: str) -> bool:
        """Check rate limits for this user/channel/category"""
        limits = CHANNEL_RATE_LIMITS.get(channel, {})
        key = f"{user_id}:{channel}"
        
        # Check category-specific limit
        if category in limits:
            if self._sent_today[key][category] >= limits[category]:
                return False
        
        # Check total limit
        if "total" in limits:
            total = sum(self._sent_today[key].values())
            if total >= limits["total"]:
                return False
        
        return True
    
    def queue_notification(self, user_id: str, template_key: str,
                          variables: dict, language: str = "en",
                          priority: str = "normal") -> dict:
        """
        Queue a notification for delivery.
        Returns notification record with status.
        """
        template = TEMPLATES.get(template_key)
        if not template:
            return {"success": False, "error": "Template not found"}
        
        # Render message
        message = render_template(template_key, variables, language)
        if not message:
            return {"success": False, "error": "Template render failed"}
        
        # Create notification record
        notification = {
            "id": f"notif_{len(self._notifications) + 1}",
            "user_id": user_id,
            "template_key": template_key,
            "category": template["category"],
            "channels": template["channels"],
            "message": message,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "delivery_attempts": [],
        }
        
        # Attempt delivery via channels in priority order
        for channel in template["channels"]:
            if self.can_send(user_id, channel, template["category"]):
                notification["delivery_attempts"].append({
                    "channel": channel,
                    "status": "sent",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                })
                notification["status"] = "delivered"
                notification["delivered_via"] = channel
                
                # Track rate limit
                key = f"{user_id}:{channel}"
                self._sent_today[key][template["category"]] += 1
                break
            else:
                notification["delivery_attempts"].append({
                    "channel": channel,
                    "status": "rate_limited",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                })
        
        if notification["status"] == "pending":
            notification["status"] = "failed"
        
        self._notifications.append(notification)
        return {"success": True, "notification": notification}
    
    def get_delivery_stats(self) -> dict:
        """Get notification delivery funnel stats"""
        total = len(self._notifications)
        delivered = sum(1 for n in self._notifications if n["status"] == "delivered")
        failed = sum(1 for n in self._notifications if n["status"] == "failed")
        
        channel_stats = defaultdict(lambda: {"sent": 0, "delivered": 0})
        for n in self._notifications:
            for attempt in n.get("delivery_attempts", []):
                ch = attempt["channel"]
                channel_stats[ch]["sent"] += 1
                if attempt["status"] == "sent":
                    channel_stats[ch]["delivered"] += 1
        
        return {
            "total": total,
            "delivered": delivered,
            "failed": failed,
            "delivery_rate": round(delivered / max(total, 1) * 100, 1),
            "by_channel": dict(channel_stats),
        }
    
    def reset_daily_limits(self):
        """Reset daily rate limit counters (call at midnight)"""
        self._sent_today.clear()


# ═══════════════════════════════════════════════════════════════════
# 6. USER NOTIFICATION PREFERENCES (PRD lines 1169-1173)
# ═══════════════════════════════════════════════════════════════════

DEFAULT_PREFERENCES = {
    "channels": {
        "whatsapp": True,
        "push": True,
        "sms": True,
        "email": True,
    },
    "categories": {
        "reminders": True,
        "bills": True,
        "goals": True,
        "health": True,
        "proactive": True,
    },
    "quiet_hours": {
        "enabled": True,
        "start": "23:00",  # 11 PM
        "end": "07:00",    # 7 AM
    },
    "digest_mode": False,  # Batch into daily digest
}


# Singleton
notification_manager = NotificationManager()

__all__ = [
    'NotificationCategory', 'CHANNEL_RATE_LIMITS', 'TEMPLATES',
    'render_template', 'NotificationManager', 'notification_manager',
    'DEFAULT_PREFERENCES',
]
