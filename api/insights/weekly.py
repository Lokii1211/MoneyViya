"""
Viya V3 — Insights API
========================
GET /api/insights/weekly?phone=xxx — Weekly spending insights
GET /api/insights/predict?phone=xxx — Spending predictions
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Route to weekly or predict based on path"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            phone = params.get("phone", [None])[0]
            
            if not phone:
                self._respond(400, {"error": "phone parameter required"})
                return
            
            if "predict" in self.path:
                result = self._get_predictions(phone)
            else:
                result = self._get_weekly_insights(phone)
            
            self._respond(200, result)
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _get_weekly_insights(self, phone):
        """Generate weekly spending insights"""
        expenses = self._fetch_expenses(phone, days=7)
        
        if not expenses:
            return {"insights": [], "total": 0, "categories": {}}
        
        total = sum(e.get("amount", 0) for e in expenses)
        
        # Category breakdown
        cats = {}
        for e in expenses:
            cat = e.get("category", "other")
            cats[cat] = cats.get(cat, 0) + e.get("amount", 0)
        
        top_cat = max(cats, key=cats.get) if cats else "none"
        
        # Generate insights
        insights = []
        
        # Insight 1: Top category
        if top_cat != "none":
            pct = int((cats[top_cat] / total) * 100) if total > 0 else 0
            insights.append({
                "type": "info",
                "icon": "📊",
                "text": f"{top_cat.title()} is your top spend at ₹{cats[top_cat]:,.0f} ({pct}% of total)"
            })
        
        # Insight 2: Daily average
        daily_avg = total / 7
        insights.append({
            "type": "info",
            "icon": "📅",
            "text": f"Daily average: ₹{daily_avg:,.0f}/day this week"
        })
        
        # Insight 3: Weekend vs weekday
        weekend_total = sum(e.get("amount", 0) for e in expenses 
                          if datetime.fromisoformat(e.get("date", datetime.now().isoformat())).weekday() >= 5)
        weekday_total = total - weekend_total
        if weekend_total > weekday_total * 0.4:
            insights.append({
                "type": "warning",
                "icon": "⚠️",
                "text": f"Weekend spending (₹{weekend_total:,.0f}) is high — try budget-friendly activities"
            })
        
        return {
            "total": total,
            "daily_average": round(daily_avg, 2),
            "categories": cats,
            "top_category": top_cat,
            "insights": insights,
            "period": f"{(datetime.now() - timedelta(days=7)).strftime('%d %b')} - {datetime.now().strftime('%d %b %Y')}",
        }

    def _get_predictions(self, phone):
        """Predict month-end spending based on current pace"""
        expenses = self._fetch_expenses(phone, days=30)
        
        today = datetime.now()
        days_passed = today.day
        days_in_month = 30  # simplified
        
        if not expenses or days_passed == 0:
            return {"predicted_total": 0, "categories": {}, "insights": []}
        
        total_so_far = sum(e.get("amount", 0) for e in expenses)
        daily_rate = total_so_far / days_passed
        predicted_total = daily_rate * days_in_month
        
        # Category predictions
        cats = {}
        for e in expenses:
            cat = e.get("category", "other")
            cats[cat] = cats.get(cat, 0) + e.get("amount", 0)
        
        category_predictions = {}
        budgets = {"food": 10000, "transport": 5000, "shopping": 5000, "entertainment": 3000, "bills": 8000, "groceries": 5000}
        
        for cat, spent in cats.items():
            cat_daily = spent / days_passed
            cat_predicted = cat_daily * days_in_month
            budget = budgets.get(cat, 5000)
            category_predictions[cat] = {
                "current": spent,
                "predicted": round(cat_predicted, 2),
                "budget": budget,
                "status": "over" if cat_predicted > budget else "safe",
                "pct": round((cat_predicted / budget) * 100, 1) if budget > 0 else 0,
            }
        
        insights = []
        over_budget = [c for c, p in category_predictions.items() if p["status"] == "over"]
        if over_budget:
            insights.append({
                "type": "warning",
                "text": f"{'These categories are' if len(over_budget) > 1 else 'This category is'} trending over budget: {', '.join(c.title() for c in over_budget)}"
            })
        
        total_budget = sum(budgets.get(c, 5000) for c in cats)
        savings = total_budget - predicted_total
        insights.append({
            "type": "positive" if savings >= 0 else "warning",
            "text": f"Predicted savings: ₹{abs(savings):,.0f} {'under' if savings >= 0 else 'over'} budget"
        })
        
        return {
            "predicted_total": round(predicted_total, 2),
            "current_total": total_so_far,
            "daily_rate": round(daily_rate, 2),
            "days_passed": days_passed,
            "days_remaining": days_in_month - days_passed,
            "categories": category_predictions,
            "insights": insights,
        }

    def _fetch_expenses(self, phone, days=7):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/expenses?phone=eq.{phone}&date=gte.{start}&select=amount,category,date,type&order=date.desc",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.json() if resp.status_code == 200 else []
        except:
            return []

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
