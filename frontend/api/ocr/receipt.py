"""
Viya V3 — Receipt OCR API
============================
POST /api/ocr/receipt — Upload receipt image → extract amount + items
Uses OpenAI Vision API for OCR
"""

import os
import json
import base64
from http.server import BaseHTTPRequestHandler
from datetime import datetime

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Process receipt image via OCR"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            phone = data.get("phone", "")
            image_base64 = data.get("image", "")
            image_url = data.get("image_url", "")
            
            if not phone:
                self._respond(400, {"error": "phone required"})
                return
            
            if not image_base64 and not image_url:
                self._respond(400, {"error": "image or image_url required"})
                return
            
            if not OPENAI_KEY:
                self._respond(503, {"error": "OCR not configured — missing OpenAI key"})
                return
            
            # Process with OpenAI Vision
            result = self._ocr_receipt(image_base64, image_url)
            
            if result:
                # Auto-save expense
                if result.get("amount") and result["amount"] > 0:
                    self._save_expense(phone, result)
                
                self._respond(200, {
                    "status": "ok",
                    "receipt": result,
                    "saved": bool(result.get("amount")),
                })
            else:
                self._respond(200, {
                    "status": "failed",
                    "error": "Could not extract data from receipt",
                })
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _ocr_receipt(self, image_b64, image_url):
        """Extract receipt data using OpenAI Vision"""
        try:
            import httpx
            
            # Build image content
            if image_b64:
                image_content = {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
            else:
                image_content = {"type": "image_url", "image_url": {"url": image_url}}
            
            with httpx.Client(timeout=30) as client:
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{
                            "role": "user",
                            "content": [
                                {"type": "text", "text": (
                                    "Extract the following from this receipt image. "
                                    "Return ONLY valid JSON with these fields:\n"
                                    "- amount: total amount as number (in INR)\n"
                                    "- merchant: store/restaurant name\n"
                                    "- category: one of [food, groceries, shopping, entertainment, health, transport, bills, other]\n"
                                    "- items: array of item names\n"
                                    "- date: date on receipt in YYYY-MM-DD format (or null)\n"
                                    "If you cannot read the receipt, return {\"error\": \"unreadable\"}"
                                )},
                                image_content,
                            ]
                        }],
                        "max_tokens": 300,
                    },
                    headers={"Authorization": f"Bearer {OPENAI_KEY}"}
                )
                
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"]
                    # Parse JSON from response
                    text = text.strip()
                    if text.startswith("```"):
                        text = text.split("```")[1]
                        if text.startswith("json"):
                            text = text[4:]
                    return json.loads(text)
        except Exception as e:
            print(f"[OCR] Error: {e}")
        return None

    def _save_expense(self, phone, receipt):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                client.post(
                    f"{SUPABASE_URL}/rest/v1/expenses",
                    json={
                        "phone": phone,
                        "amount": receipt["amount"],
                        "category": receipt.get("category", "other"),
                        "note": f"Receipt: {receipt.get('merchant', 'Unknown')}",
                        "type": "expense",
                        "source": "ocr",
                        "date": receipt.get("date") or datetime.now().strftime("%Y-%m-%d"),
                    },
                    headers={
                        "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json", "Prefer": "return=minimal"
                    }
                )
        except:
            pass

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
