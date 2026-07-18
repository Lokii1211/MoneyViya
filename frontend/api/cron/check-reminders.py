"""
MoneyViya — Reminder Cron
=========================
Triggered every 15 min by .github/workflows/reminders.yml (GitHub Actions
free tier — Vercel Hobby can't run native cron more than once/day). For
true per-minute precision, point an external scheduler like cron-job.org
(free, no GitHub Actions minutes used) at this same endpoint instead.

Because the caller only runs every ~15 min (and GitHub Actions scheduled
runs are best-effort and can slip further under load), reminders are
matched against a trailing WINDOW_MINUTES window rather than an exact
HH:MM string — a slightly-late run still catches anything that became due
since the last one. Dedup is by calendar day (last_sent_at etc. prefix-
matched against today's date), so a wide window can't cause double-sends.
"""

import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler

WINDOW_MINUTES = 20


def ordinal(n):
    if 11 <= (n % 100) <= 13:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def times_in_window(center_dt, minutes=WINDOW_MINUTES, forward=False):
    """HH:MM strings for every minute trailing (or, if forward, following) center_dt."""
    step = 1 if forward else -1
    return [(center_dt + timedelta(minutes=i * step)).strftime("%H:%M") for i in range(minutes)]


def pg_in_list(values):
    return "(" + ",".join(values) + ")"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Check and fire due reminders."""
        try:
            import httpx

            auth = self.headers.get("Authorization", "")
            cron_secret = os.getenv("CRON_SECRET", "")
            if cron_secret and auth != f"Bearer {cron_secret}":
                self._respond(401, {"error": "Unauthorized"})
                return

            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()

            if not SUPABASE_URL or not SUPABASE_KEY:
                self._respond(500, {"error": "Supabase not configured"})
                return

            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }

            now = datetime.utcnow()
            # IST is UTC+5:30
            ist_now = now + timedelta(hours=5, minutes=30)
            current_time = ist_now.strftime("%H:%M")
            current_weekday = ist_now.strftime("%A")
            current_date = ist_now.day
            current_date_str = ist_now.strftime("%Y-%m-%d")
            # Last day of the current month (handles 28/29/30/31-day months)
            next_month = ist_now.replace(day=28) + timedelta(days=4)
            last_day_of_month = (next_month - timedelta(days=next_month.day)).day

            results = {
                "time_ist": ist_now.isoformat(),
                "current_time": current_time,
                "checked": 0,
                "sent": 0,
                "errors": []
            }

            with httpx.Client(timeout=15.0) as client:
                # Get all enabled reminders whose time fell in the trailing window
                window = times_in_window(ist_now)
                url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&time=in.{pg_in_list(window)}&select=*"
                resp = client.get(url, headers=headers)

                if resp.status_code != 200:
                    results["errors"].append(f"Fetch error: {resp.status_code} {resp.text}")
                    self._respond(200, results)
                    return

                reminders = resp.json()
                results["checked"] = len(reminders)

                for rem in reminders:
                    try:
                        freq = rem.get("freq", "daily")
                        should_fire = False

                        if freq == "daily":
                            should_fire = True
                        elif freq == "weekly":
                            if rem.get("weekday", "") == current_weekday:
                                should_fire = True
                        elif freq == "monthly":
                            target_day = rem.get("month_date", 1) or 1
                            effective_day = min(target_day, last_day_of_month)
                            if effective_day == current_date:
                                should_fire = True
                        elif freq == "once":
                            if rem.get("fire_date", "") == current_date_str:
                                should_fire = True

                        # Already sent today?
                        last_sent = rem.get("last_sent_at", "")
                        if last_sent and last_sent.startswith(current_date_str):
                            should_fire = False

                        if not should_fire:
                            continue

                        phone = rem.get("phone", "")
                        title = rem.get("title", "Reminder")
                        desc = rem.get("description", "")
                        icon = rem.get("icon", "⏰")

                        msg = f"{icon} *{title}*"
                        if desc:
                            msg += f"\n{desc}"

                        wa_sent = self._send_whatsapp(phone, msg)

                        if wa_sent:
                            results["sent"] += 1

                            update_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                            update_data = {"last_sent_at": ist_now.isoformat()}

                            if freq == "once":
                                update_data["enabled"] = False

                            client.patch(update_url, json=update_data, headers={**headers, "Prefer": "return=minimal"})
                        else:
                            results["errors"].append(f"WhatsApp send failed for {phone}")

                    except Exception as e:
                        results["errors"].append(f"Reminder {rem.get('id')}: {str(e)}")

                # ── Advance nudge — reminders coming up in the next window ──
                # Dedups off last_advance_sent_at so it can't clash with the
                # real fire's last_sent_at dedup.
                advance_window = times_in_window(ist_now, forward=True)
                results["advance_checked"] = 0
                results["advance_sent"] = 0
                try:
                    adv_url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&time=in.{pg_in_list(advance_window)}&select=*"
                    adv_resp = client.get(adv_url, headers=headers)
                    if adv_resp.status_code == 200:
                        adv_reminders = adv_resp.json()
                        results["advance_checked"] = len(adv_reminders)
                        for rem in adv_reminders:
                            try:
                                freq = rem.get("freq", "daily")
                                due = False
                                if freq == "daily":
                                    due = True
                                elif freq == "weekly" and rem.get("weekday", "") == current_weekday:
                                    due = True
                                elif freq == "monthly":
                                    target_day = min(rem.get("month_date", 1) or 1, last_day_of_month)
                                    due = target_day == current_date
                                elif freq == "once" and rem.get("fire_date", "") == current_date_str:
                                    due = True

                                last_adv = rem.get("last_advance_sent_at", "") or ""
                                if last_adv.startswith(current_date_str):
                                    due = False  # already nudged today

                                if not due:
                                    continue

                                title = rem.get("title", "Reminder")
                                icon = rem.get("icon", "⏰")
                                msg = f"⏳ *Coming up soon* — {icon} {title} ({rem.get('time','')})"
                                if self._send_whatsapp(rem.get("phone", ""), msg):
                                    results["advance_sent"] += 1
                                    upd_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                                    client.patch(upd_url, json={"last_advance_sent_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                            except Exception as e:
                                results["errors"].append(f"Advance {rem.get('id')}: {str(e)}")
                except Exception as e:
                    results["errors"].append(f"Advance fetch: {str(e)}")

                # ── Monthly reminders: 3-day advance heads-up ──
                # Fires once, around the reminder's own set time, 3 days
                # before the target day-of-month — so a bill reminder on
                # the 5th gives you a nudge on the 2nd.
                results["monthly_advance_sent"] = 0
                try:
                    monthly_url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&freq=eq.monthly&time=in.{pg_in_list(window)}&select=*"
                    monthly_resp = client.get(monthly_url, headers=headers)
                    if monthly_resp.status_code == 200:
                        for rem in monthly_resp.json():
                            try:
                                target_day = min(rem.get("month_date", 1) or 1, last_day_of_month)
                                days_until = target_day - current_date
                                if days_until != 3:
                                    continue
                                last_madv = rem.get("last_monthly_advance_at", "") or ""
                                if last_madv.startswith(current_date_str):
                                    continue
                                title = rem.get("title", "Reminder")
                                icon = rem.get("icon", "⏰")
                                msg = f"📅 *In 3 days* — {icon} {title} (due {ordinal(target_day)})"
                                if self._send_whatsapp(rem.get("phone", ""), msg):
                                    results["monthly_advance_sent"] += 1
                                    upd_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                                    client.patch(upd_url, json={"last_monthly_advance_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                            except Exception as e:
                                results["errors"].append(f"Monthly advance {rem.get('id')}: {str(e)}")
                except Exception as e:
                    results["errors"].append(f"Monthly advance fetch: {str(e)}")

                # ── Lending collection reminders ──
                # Checks `lending` for pending entries whose reminder is due
                # today, per reminder_frequency: daily fires every day, weekly
                # every 7 days from due_date, monthly matches due_date's
                # day-of-month (clamped). Gated to a once/day check window
                # instead of an exact "09:00" string so the new 15-min cron
                # cadence still reliably lands in it.
                results["lending_reminded"] = 0
                if "09:00" in window:
                    try:
                        lending_url = f"{SUPABASE_URL}/rest/v1/lending?status=eq.pending&reminder_enabled=eq.true&select=*"
                        lending_resp = client.get(lending_url, headers=headers)
                        if lending_resp.status_code == 200:
                            for entry in lending_resp.json():
                                try:
                                    due_date_str = entry.get("due_date")
                                    if not due_date_str:
                                        continue
                                    due_dt = datetime.strptime(due_date_str[:10], "%Y-%m-%d")
                                    freq = entry.get("reminder_frequency", "weekly")
                                    should_fire = False
                                    if freq == "daily":
                                        should_fire = True
                                    elif freq == "weekly":
                                        days_since = (ist_now.date() - due_dt.date()).days
                                        should_fire = days_since >= 0 and days_since % 7 == 0
                                    elif freq == "monthly":
                                        target_day = min(due_dt.day, last_day_of_month)
                                        should_fire = target_day == current_date

                                    last_reminded = entry.get("last_reminded_at", "") or ""
                                    if last_reminded.startswith(current_date_str):
                                        should_fire = False
                                    if not should_fire:
                                        continue

                                    verb = "lent" if entry.get("type") == "given" else "borrowed"
                                    interest_note = f" ({entry.get('interest_rate')}%/{entry.get('interest_type','monthly')})" if entry.get("has_interest") else ""
                                    amount = entry.get("amount", 0) or 0
                                    msg = f"💰 *Lending reminder*\nTime to check in with {entry.get('person_name','them')} about the ₹{amount:,.0f} you {verb}{interest_note}. Reply here to log a payment, or update it in the app."

                                    if self._send_whatsapp(entry.get("user_phone", ""), msg):
                                        results["lending_reminded"] += 1
                                        upd_url = f"{SUPABASE_URL}/rest/v1/lending?id=eq.{entry['id']}"
                                        client.patch(upd_url, json={"last_reminded_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                                except Exception as e:
                                    results["errors"].append(f"Lending {entry.get('id')}: {str(e)}")
                    except Exception as e:
                        results["errors"].append(f"Lending fetch: {str(e)}")

                # ── Bills/EMI due-date reminders ──
                # bills_and_dues has reminder_days ("remind X days before
                # due"). Fires once/day (same 09:00 window as lending) once
                # we're within that many days of the due date — including
                # the due day itself and every day it stays unpaid/overdue
                # after that, until marked paid. This is the block that was
                # completely missing before: EMI/bill due dates never
                # reached WhatsApp or an exact-time nudge at all.
                results["bills_reminded"] = 0
                if "09:00" in window:
                    try:
                        bills_url = f"{SUPABASE_URL}/rest/v1/bills_and_dues?status=eq.pending&due_date=not.is.null&select=*"
                        bills_resp = client.get(bills_url, headers=headers)
                        if bills_resp.status_code == 200:
                            for bill in bills_resp.json():
                                try:
                                    due_dt = datetime.strptime(bill["due_date"][:10], "%Y-%m-%d")
                                    days_until = (due_dt.date() - ist_now.date()).days
                                    reminder_days = bill.get("reminder_days", 3) or 3

                                    last_reminded = bill.get("last_reminded_at", "") or ""
                                    if last_reminded.startswith(current_date_str):
                                        continue
                                    if days_until > reminder_days:
                                        continue  # not due soon enough yet

                                    is_emi = (bill.get("bill_type") or "").lower() == "emi"
                                    label = "EMI" if is_emi else "Bill"
                                    icon = "🏦" if is_emi else "🧾"
                                    amount = bill.get("amount", 0) or 0
                                    name = bill.get("name", label)

                                    if days_until < 0:
                                        when = f"OVERDUE by {abs(days_until)} day{'s' if abs(days_until) != 1 else ''}"
                                    elif days_until == 0:
                                        when = "due TODAY"
                                    else:
                                        when = f"due in {days_until} day{'s' if days_until != 1 else ''} ({ordinal(due_dt.day)})"

                                    msg = f"{icon} *{label} reminder*\n{name} — ₹{amount:,.0f} {when}."

                                    if self._send_whatsapp(bill.get("phone", ""), msg):
                                        results["bills_reminded"] += 1
                                        upd_url = f"{SUPABASE_URL}/rest/v1/bills_and_dues?id=eq.{bill['id']}"
                                        client.patch(upd_url, json={"last_reminded_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                                except Exception as e:
                                    results["errors"].append(f"Bill {bill.get('id')}: {str(e)}")
                    except Exception as e:
                        results["errors"].append(f"Bills fetch: {str(e)}")

            # Evening log reminder — the morning brief is handled by the
            # separate cron/morning-brief.py Vercel-native cron.
            if "21:00" in window:
                results["briefing"] = "evening"
                self._send_briefings("evening")

            self._respond(200, results)

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _send_whatsapp(self, phone, message):
        """Send WhatsApp message via Cloud API"""
        try:
            import httpx

            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

            if not token or not phone_id:
                print("[Reminders] WhatsApp not sent — WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured")
                return False

            clean_phone = phone.replace("+", "").replace(" ", "")
            if not clean_phone.startswith("91"):
                clean_phone = "91" + clean_phone

            url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"

            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json={
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message}
                }, headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                })

                if resp.status_code != 200:
                    print(f"[Reminders] WhatsApp send failed for {clean_phone}: {resp.status_code} {resp.text[:300]}")
                return resp.status_code == 200
        except Exception as e:
            print(f"[Reminders] WhatsApp send error for {phone}: {e}")
            return False

    def _send_briefings(self, briefing_type):
        """Send morning/evening briefings to all active users"""
        try:
            import httpx

            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()

            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }

            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{SUPABASE_URL}/rest/v1/users?select=phone,name,gender,monthly_income", headers=headers)
                if resp.status_code != 200:
                    print(f"[Briefing] Users fetch failed: {resp.status_code}")
                    return

                users = resp.json()
                for user in users:
                    phone = user.get("phone", "")
                    name = user.get("name", "Friend")
                    gender = user.get("gender", "")
                    if not phone:
                        continue

                    tag = ""
                    if gender == "male":
                        tag = " bro"
                    elif gender == "female":
                        tag = " sis"

                    if briefing_type == "morning":
                        msg = f"☀️ Morning{tag}! Ready to track today?\nJust text: \"200 chai\" 🔥"
                    else:
                        msg = f"🌙 Hey {name}! Log any remaining expenses.\nGood night{tag}! 💤"

                    self._send_whatsapp(phone, msg)
        except Exception as e:
            print(f"[Briefing] Error: {e}")

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
