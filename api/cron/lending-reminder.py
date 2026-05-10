"""
Lending Reminder Cron — Sends WhatsApp reminders for pending loans
Runs daily at 10 AM IST. Checks each entry's reminder_frequency
and sends appropriate reminders for money given/taken.
"""
import os
import json
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
import urllib.request

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
WA_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
WA_PHONE_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")


def supabase_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())


def supabase_patch(table, id_val, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{id_val}",
        data=body,
        method="PATCH",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    urllib.request.urlopen(req)


def send_whatsapp(phone, message):
    if not WA_TOKEN or not WA_PHONE_ID:
        return
    body = json.dumps({
        "messaging_product": "whatsapp",
        "to": f"91{phone}" if not phone.startswith("91") else phone,
        "type": "text",
        "text": {"body": message},
    }).encode()
    req = urllib.request.Request(
        f"https://graph.facebook.com/v18.0/{WA_PHONE_ID}/messages",
        data=body,
        headers={
            "Authorization": f"Bearer {WA_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        urllib.request.urlopen(req)
    except Exception:
        pass


def should_remind(entry, now):
    """Check if this entry needs a reminder based on frequency."""
    if not entry.get("reminder_enabled"):
        return False
    if entry.get("status") != "pending":
        return False

    last = entry.get("last_reminded_at")
    if not last:
        return True

    last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
    freq = entry.get("reminder_frequency", "weekly")

    if freq == "daily":
        return (now - last_dt).days >= 1
    elif freq == "weekly":
        return (now - last_dt).days >= 7
    elif freq == "monthly":
        return (now - last_dt).days >= 30
    return False


def calc_interest(entry, now):
    """Calculate accrued interest."""
    if not entry.get("has_interest") or not entry.get("interest_rate"):
        return 0
    created = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00"))
    months = max(1, (now - created).days // 30)
    if entry.get("interest_type") == "monthly":
        return round(entry["amount"] * (entry["interest_rate"] / 100) * months)
    return round(entry["amount"] * (entry["interest_rate"] / 100) * (months / 12))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        now = datetime.utcnow().replace(tzinfo=None)
        sent = 0

        try:
            entries = supabase_get("lending?status=eq.pending&reminder_enabled=eq.true")

            for entry in entries:
                if not should_remind(entry, now):
                    continue

                interest = calc_interest(entry, now)
                total = entry["amount"] + interest
                person = entry["person_name"]
                phone = entry["user_phone"]

                # Build message
                if entry["type"] == "given":
                    msg = f"💸 *Lending Reminder*\n\n"
                    msg += f"You gave *₹{entry['amount']:,.0f}* to *{person}*"
                else:
                    msg = f"📥 *Borrowing Reminder*\n\n"
                    msg += f"You owe *₹{entry['amount']:,.0f}* to *{person}*"

                if entry.get("reason"):
                    msg += f" for _{entry['reason']}_"

                if interest > 0:
                    msg += f"\n💰 Interest accrued: *₹{interest:,.0f}*"
                    msg += f"\n📊 Total now: *₹{total:,.0f}*"

                if entry.get("due_date"):
                    due = datetime.fromisoformat(entry["due_date"])
                    if due.date() < now.date():
                        days_overdue = (now.date() - due.date()).days
                        msg += f"\n\n⚠️ *OVERDUE by {days_overdue} days!*"
                    else:
                        days_left = (due.date() - now.date()).days
                        msg += f"\n\n📅 Due in {days_left} days"

                if entry["type"] == "given":
                    msg += f"\n\n_Reply 'settled {person}' when paid back_"
                else:
                    msg += f"\n\n_Reply 'paid {person}' when you pay_"

                send_whatsapp(phone, msg)
                supabase_patch("lending", entry["id"], {"last_reminded_at": now.isoformat()})
                sent += 1

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"sent": sent, "checked": len(entries) if 'entries' in dir() else 0}).encode())
