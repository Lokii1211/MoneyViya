"""
Viya V3 — SMS Processor
=========================
Vercel Serverless: api/sms/process.py → /api/sms/process
Parses bank SMS messages → auto-logs expenses
"""

import os
import json
import re
from http.server import BaseHTTPRequestHandler
from datetime import datetime

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

# Bank SMS patterns (Indian banks)
SMS_PATTERNS = [
    # Debit patterns
    r"(?:debited|spent|paid|purchase|txn|transaction)\D*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
    r"(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|deducted|withdrawn)",
    r"(?:debit)\D*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
    # Credit patterns
    r"(?:credited|received|refund)\D*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
    r"(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*(?:credited|received|deposited)",
    # UPI patterns
    r"(?:upi|imps|neft)\D*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
]

MERCHANT_CATEGORIES = {
    "zomato": "food", "swiggy": "food", "uber eats": "food", "dominos": "food",
    "uber": "transport", "ola": "transport", "rapido": "transport",
    "amazon": "shopping", "flipkart": "shopping", "myntra": "shopping", "ajio": "shopping",
    "netflix": "entertainment", "spotify": "entertainment", "hotstar": "entertainment",
    "bigbasket": "groceries", "blinkit": "groceries", "zepto": "groceries", "dmart": "groceries",
    "pharmeasy": "health", "1mg": "health", "apollo": "health",
    "electricity": "bills", "airtel": "bills", "jio": "bills", "vi ": "bills",
    "paytm": "other", "phonepe": "other", "gpay": "other",
}


def parse_sms(sms_text):
    """Parse a bank SMS to extract transaction details"""
    text = sms_text.lower()
    amount = None
    tx_type = "expense"
    category = "other"
    merchant = ""

    # Check if credit or debit
    if any(w in text for w in ["credited", "received", "refund", "deposited"]):
        tx_type = "income"
    
    # Extract amount
    for pattern in SMS_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(",", ""))
            break
    
    if not amount:
        return None

    # Extract merchant/category
    for merchant_key, cat in MERCHANT_CATEGORIES.items():
        if merchant_key in text:
            category = cat
            merchant = merchant_key.title()
            break
    
    # Try to extract merchant from "at" or "to" patterns
    if not merchant:
        at_match = re.search(r'(?:at|to|@)\s+([A-Za-z\s]+?)(?:\s+on|\s+ref|\s+\d)', sms_text)
        if at_match:
            merchant = at_match.group(1).strip()

    return {
        "amount": amount,
        "type": tx_type,
        "category": category,
        "merchant": merchant,
        "original_sms": sms_text[:200],
        "source": "sms",
        "date": datetime.now().strftime("%Y-%m-%d"),
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Process batch SMS messages"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            phone = data.get("phone", "")
            messages = data.get("messages", [])
            
            if not phone or not messages:
                self._respond(400, {"error": "phone and messages required"})
                return
            
            results = []
            saved = 0
            
            for sms in messages:
                sms_text = sms.get("body", "") if isinstance(sms, dict) else str(sms)
                parsed = parse_sms(sms_text)
                
                if parsed:
                    parsed["phone"] = phone
                    # Save to Supabase
                    if self._save_expense(parsed):
                        saved += 1
                    results.append(parsed)
            
            self._respond(200, {
                "status": "ok",
                "processed": len(messages),
                "detected": len(results),
                "saved": saved,
                "transactions": results,
            })
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _save_expense(self, tx):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return False
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                resp = client.post(
                    f"{SUPABASE_URL}/rest/v1/expenses",
                    json={
                        "phone": tx["phone"], "amount": tx["amount"], "category": tx["category"],
                        "note": tx.get("merchant", "SMS Auto-detected"),
                        "type": tx["type"], "source": "sms", "date": tx["date"],
                    },
                    headers={
                        "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json", "Prefer": "return=minimal"
                    }
                )
                return resp.status_code in (200, 201)
        except:
            return False

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
