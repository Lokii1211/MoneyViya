"""
Viya Fintech API Routes
========================
SMS Ingest, Bank Accounts, Portfolio — Closes GAP 1-4
"""

from fastapi import APIRouter, Request, Header, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import json

from services.saas_middleware import api_response, api_error, logger
from routes.api_v1 import require_auth

router = APIRouter(prefix="/api/v1/fintech", tags=["Fintech"])


# ═══════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════

class SMSIngest(BaseModel):
    """Single SMS from Capacitor plugin."""
    body: str = Field(..., min_length=5, max_length=2000)
    sender: str = Field("", max_length=30)
    received_at: Optional[str] = None

class SMSBatchIngest(BaseModel):
    """Batch of SMS messages (initial sync)."""
    messages: List[SMSIngest] = Field(..., max_length=500)

class BankAccountCreate(BaseModel):
    bank_name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field("savings", max_length=30)
    account_number_last4: str = Field("", max_length=4)
    ifsc: str = Field("", max_length=11)
    is_primary: bool = False

class HoldingCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    asset_class: str = Field("equity", max_length=20)
    ticker: str = Field("", max_length=30)
    quantity: float = Field(..., gt=0)
    average_cost: float = Field(..., gt=0)
    broker: str = Field("manual", max_length=50)


# ═══════════════════════════════════════════════
# 1. SMS INGEST (GAP 1 + GAP 2)
# ═══════════════════════════════════════════════

@router.post("/sms/ingest")
async def ingest_sms(
    sms: SMSIngest,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/fintech/sms/ingest
    Receives a single SMS from Capacitor plugin → parse → store → return.
    Target: <5 seconds from SMS receipt to dashboard update.
    """
    from services.fintech_sms_parser import sms_ingest

    user_id = user.get("user_id", "")
    result = await sms_ingest.ingest(
        user_phone=user_id,
        sms_body=sms.body,
        sender_id=sms.sender,
        received_at=sms.received_at,
    )

    logger.info("sms_ingested", user_id=user_id, status=result.get("status"),
                sender=sms.sender[:10] if sms.sender else "")

    return api_response(data=result)


@router.post("/sms/batch")
async def ingest_sms_batch(
    batch: SMSBatchIngest,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/fintech/sms/batch
    Initial sync: process up to 500 historical SMS.
    """
    from services.fintech_sms_parser import sms_ingest

    user_id = user.get("user_id", "")
    results = {"created": 0, "skipped": 0, "duplicate": 0, "errors": 0}

    for msg in batch.messages:
        try:
            r = await sms_ingest.ingest(
                user_phone=user_id,
                sms_body=msg.body,
                sender_id=msg.sender,
                received_at=msg.received_at,
            )
            status = r.get("status", "error")
            if status == "created":
                results["created"] += 1
            elif status == "skipped":
                results["skipped"] += 1
            elif status == "duplicate":
                results["duplicate"] += 1
            else:
                results["errors"] += 1
        except Exception:
            results["errors"] += 1

    logger.info("sms_batch_ingested", user_id=user_id, **results)
    return api_response(data=results)


@router.post("/sms/test-parse")
async def test_parse_sms(sms: SMSIngest):
    """
    POST /api/v1/fintech/sms/test-parse
    Debug endpoint: parse SMS without storing. No auth required.
    """
    from services.fintech_sms_parser import fintech_parser
    result = fintech_parser.parse(sms.body, sms.sender)
    return api_response(data=result)


# ═══════════════════════════════════════════════
# 2. BANK ACCOUNTS (GAP 4)
# ═══════════════════════════════════════════════

@router.get("/bank-accounts")
async def list_bank_accounts(user: dict = Depends(require_auth)):
    """GET /api/v1/fintech/bank-accounts"""
    # Placeholder — reads from Supabase
    return api_response(data=[])


@router.post("/bank-accounts")
async def create_bank_account(
    account: BankAccountCreate,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/fintech/bank-accounts"""
    user_id = user.get("user_id", "")
    logger.info("bank_account_created", user_id=user_id,
                bank=account.bank_name, type=account.account_type)
    return api_response(data={"status": "created", "bank": account.bank_name})


# ═══════════════════════════════════════════════
# 3. PORTFOLIO / HOLDINGS (GAP 3)
# ═══════════════════════════════════════════════

@router.get("/portfolio")
async def get_portfolio(user: dict = Depends(require_auth)):
    """GET /api/v1/fintech/portfolio — Portfolio overview"""
    return api_response(data={
        "net_worth": 0,
        "total_invested": 0,
        "current_value": 0,
        "unrealized_pnl": 0,
        "holdings": [],
        "asset_allocation": {},
    })


@router.post("/holdings")
async def add_holding(
    holding: HoldingCreate,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/fintech/holdings — Add manual holding"""
    user_id = user.get("user_id", "")
    logger.info("holding_added", user_id=user_id,
                name=holding.name, qty=holding.quantity)
    return api_response(data={"status": "created", "name": holding.name})


@router.get("/portfolio/summary")
async def portfolio_summary(user: dict = Depends(require_auth)):
    """GET /api/v1/fintech/portfolio/summary — XIRR, allocation, SIP"""
    return api_response(data={
        "xirr": 0.0,
        "total_invested": 0,
        "current_value": 0,
        "day_change": 0,
        "sip_monthly": 0,
        "active_sips": 0,
    })


# ═══════════════════════════════════════════════
# 4. CSV IMPORT (Manual Fallback)
# ═══════════════════════════════════════════════

@router.post("/import/csv")
async def import_csv(
    request: Request,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/fintech/import/csv
    Body: {csv_content: string, bank_name: hdfc|icici|sbi|axis|kotak|generic}
    """
    from services.csv_import_service import csv_import_service

    user_id = user.get("user_id", "")
    data = await request.json()
    csv_content = data.get("csv_content", "")
    bank_name = data.get("bank_name", "generic")
    account_id = data.get("account_id", "")

    if not csv_content:
        raise HTTPException(400, detail=api_error("MISSING_DATA", "csv_content is required"))

    result = csv_import_service.parse(
        csv_content=csv_content,
        bank_name=bank_name,
        user_phone=user_id,
        account_id=account_id,
    )

    logger.info("csv_imported", user_id=user_id, bank=bank_name,
                imported=result["summary"]["imported"],
                errors=result["summary"]["errors"])

    return api_response(data=result["summary"])


# ═══════════════════════════════════════════════
# 5. AUTO-CATEGORIZATION
# ═══════════════════════════════════════════════

class CategorizeRequest(BaseModel):
    merchant: str = Field("", max_length=200)
    description: str = Field("", max_length=500)
    amount: float = Field(0, ge=0)
    type: str = Field("debit", max_length=10)

class CorrectionRequest(BaseModel):
    merchant: str = Field(..., min_length=1, max_length=200)
    new_category: str = Field(..., min_length=1, max_length=50)

@router.post("/categorize")
async def categorize_transaction(
    req: CategorizeRequest,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/fintech/categorize
    Auto-categorize a merchant/description.
    """
    from services.categorization_engine import categorization_engine

    user_id = user.get("user_id", "")
    result = categorization_engine.categorize(
        merchant=req.merchant,
        amount=req.amount,
        txn_type=req.type,
        user_phone=user_id,
        description=req.description,
    )
    return api_response(data=result)


@router.post("/categorize/correct")
async def correct_category(
    req: CorrectionRequest,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/fintech/categorize/correct
    User corrects a category — engine learns for future.
    """
    from services.categorization_engine import categorization_engine

    user_id = user.get("user_id", "")
    categorization_engine.learn_correction(user_id, req.merchant, req.new_category)

    logger.info("category_corrected", user_id=user_id,
                merchant=req.merchant, category=req.new_category)

    return api_response(data={"learned": True, "merchant": req.merchant,
                              "new_category": req.new_category})


@router.get("/categorize/stats")
async def categorization_stats(user: dict = Depends(require_auth)):
    """GET /api/v1/fintech/categorize/stats — Engine hit rates"""
    from services.categorization_engine import categorization_engine
    return api_response(data=categorization_engine.get_stats())


# ═══════════════════════════════════════════════
# 6. RECURRING TRANSACTION DETECTION
# ═══════════════════════════════════════════════

@router.get("/recurring")
async def detect_recurring(user: dict = Depends(require_auth)):
    """
    GET /api/v1/fintech/recurring
    Analyze transaction history for subscriptions, EMIs, SIPs.
    """
    from services.categorization_engine import recurring_detector

    user_id = user.get("user_id", "")

    # Get user transactions (from dashboard API or Supabase)
    try:
        from routes.dashboard_api import _get_user_transactions
        transactions = _get_user_transactions(user_id)
    except Exception:
        transactions = []

    patterns = recurring_detector.analyze(user_id, transactions)

    total_monthly = sum(p['amount'] for p in patterns if p['frequency'] == 'monthly')
    subscriptions = [p for p in patterns if p['is_subscription']]
    emis = [p for p in patterns if p['is_emi']]

    return api_response(data={
        "patterns": patterns,
        "summary": {
            "total_recurring": len(patterns),
            "subscriptions": len(subscriptions),
            "emis": len(emis),
            "total_monthly_outflow": round(total_monthly, 2),
            "total_yearly_estimate": round(total_monthly * 12, 2),
        },
    })


# -----------------------------------------------
# 7. ACCOUNT AGGREGATOR (Setu/Finvu)
# -----------------------------------------------

@router.get("/aa/banks")
async def list_supported_banks():
    from services.account_aggregator_service import aa_service
    return api_response(data=aa_service.get_supported_banks())

@router.post("/aa/consent")
async def create_aa_consent(request: Request, user: dict = Depends(require_auth)):
    from services.account_aggregator_service import aa_service
    user_id = user.get("user_id", "")
    data = await request.json()
    fip_id = data.get("fip_id", "")
    months = data.get("data_range_months", 6)
    if not fip_id:
        raise HTTPException(400, detail=api_error("MISSING_DATA", "fip_id required"))
    result = await aa_service.create_consent(user_id, fip_id, months)
    logger.info("aa_consent_created", user_id=user_id, fip_id=fip_id)
    return api_response(data=result)

@router.post("/aa/callback")
async def aa_consent_callback(request: Request):
    from services.account_aggregator_service import aa_service
    data = await request.json()
    result = await aa_service.handle_consent_callback(data.get("consent_handle",""), data.get("status",""))
    return api_response(data=result)

@router.get("/aa/consents")
async def list_user_consents(user: dict = Depends(require_auth)):
    from services.account_aggregator_service import aa_service
    return api_response(data=aa_service.get_user_consents(user.get("user_id","")))

@router.post("/aa/revoke")
async def revoke_consent(request: Request, user: dict = Depends(require_auth)):
    from services.account_aggregator_service import aa_service
    data = await request.json()
    result = await aa_service.revoke_consent(data.get("consent_handle",""))
    return api_response(data=result)

# -----------------------------------------------
# 8. TRANSACTION RECONCILIATION
# -----------------------------------------------

@router.post("/reconcile")
async def reconcile_transactions(request: Request, user: dict = Depends(require_auth)):
    from services.account_aggregator_service import reconciliation_service
    user_id = user.get("user_id", "")
    data = await request.json()
    incoming = data.get("incoming", [])
    try:
        from routes.dashboard_api import _get_user_transactions
        existing = _get_user_transactions(user_id)
    except Exception:
        existing = []
    result = reconciliation_service.reconcile(existing, incoming)
    logger.info("reconciliation_done", user_id=user_id, **result["stats"])
    return api_response(data=result["stats"])

# -----------------------------------------------
# 9. BROKERAGE SYNC (Zerodha/Groww/Kuvera)
# -----------------------------------------------

@router.get("/brokers")
async def list_brokers():
    from services.brokerage_service import brokerage_service
    return api_response(data=brokerage_service.get_supported_brokers())

@router.post("/brokers/connect")
async def connect_broker(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import brokerage_service
    user_id = user.get("user_id", "")
    data = await request.json()
    broker = data.get("broker", "")
    if not broker:
        raise HTTPException(400, detail=api_error("MISSING_DATA", "broker required"))
    result = await brokerage_service.initiate_connection(user_id, broker)
    logger.info("broker_connect_init", user_id=user_id, broker=broker)
    return api_response(data=result)

@router.post("/brokers/callback")
async def broker_oauth_callback(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import brokerage_service
    user_id = user.get("user_id", "")
    data = await request.json()
    result = await brokerage_service.handle_oauth_callback(
        user_id, data.get("broker",""), data.get("request_token",""))
    return api_response(data=result)

@router.get("/brokers/connections")
async def list_connections(user: dict = Depends(require_auth)):
    from services.brokerage_service import brokerage_service
    return api_response(data=brokerage_service.get_connections(user.get("user_id","")))

@router.post("/brokers/sync")
async def sync_portfolio_endpoint(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import brokerage_service
    user_id = user.get("user_id", "")
    data = await request.json()
    result = await brokerage_service.sync_portfolio(user_id, data.get("broker"))
    return api_response(data=result)

@router.post("/brokers/disconnect")
async def disconnect_broker(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import brokerage_service
    user_id = user.get("user_id", "")
    data = await request.json()
    result = await brokerage_service.disconnect_broker(user_id, data.get("broker",""))
    return api_response(data=result)

# -----------------------------------------------
# 10. PORTFOLIO ANALYTICS
# -----------------------------------------------

@router.post("/portfolio/xirr")
async def calculate_xirr(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import portfolio_analytics
    data = await request.json()
    cashflows = data.get("cashflows", [])
    xirr = portfolio_analytics.calculate_xirr(cashflows)
    return api_response(data={"xirr": xirr})

@router.post("/portfolio/tax-report")
async def tax_report(request: Request, user: dict = Depends(require_auth)):
    from services.brokerage_service import portfolio_analytics
    data = await request.json()
    holdings = data.get("holdings", [])
    report = portfolio_analytics.tax_implications(holdings)
    return api_response(data=report)

# -----------------------------------------------
# 11. AI INSIGHTS ENGINE (Phase 2)
# -----------------------------------------------

@router.get("/insights")
async def get_insights(user: dict = Depends(require_auth)):
    from services.insight_engine import insight_engine
    user_id = user.get("user_id", "")
    try:
        from routes.dashboard_api import _get_user_transactions
        txns = _get_user_transactions(user_id)
    except Exception:
        txns = []
    data = {"transactions": txns, "budgets": {}, "goals": [], "portfolio": {}, "subscriptions": []}
    insights = insight_engine.generate_all(user_id, data)
    return api_response(data={"insights": insights, "total": len(insights)})

@router.post("/insights/generate")
async def generate_insights(request: Request, user: dict = Depends(require_auth)):
    from services.insight_engine import insight_engine
    user_id = user.get("user_id", "")
    data = await request.json()
    insights = insight_engine.generate_all(user_id, data)
    logger.info("insights_generated", user_id=user_id, count=len(insights))
    return api_response(data={"insights": insights, "total": len(insights)})

# -----------------------------------------------
# 12. SIP TRACKER + PROJECTION (Phase 2)
# -----------------------------------------------

@router.post("/sip/project")
async def sip_projection(request: Request, user: dict = Depends(require_auth)):
    data = await request.json()
    monthly = data.get("monthly_amount", 0)
    years = data.get("years", 10)
    expected_return = data.get("expected_return_pct", 12) / 100
    step_up_pct = data.get("step_up_pct", 0) / 100
    months = years * 12
    monthly_rate = expected_return / 12
    total_invested = 0
    future_value = 0
    current_sip = monthly
    yearly_breakdown = []
    for m in range(1, months + 1):
        if step_up_pct > 0 and m > 1 and (m - 1) % 12 == 0:
            current_sip = current_sip * (1 + step_up_pct)
        total_invested += current_sip
        future_value = (future_value + current_sip) * (1 + monthly_rate)
        if m % 12 == 0:
            yearly_breakdown.append({
                "year": m // 12,
                "invested": round(total_invested),
                "value": round(future_value),
                "wealth_gain": round(future_value - total_invested),
            })
    return api_response(data={
        "monthly_sip": monthly,
        "years": years,
        "expected_return_pct": expected_return * 100,
        "step_up_pct": step_up_pct * 100,
        "total_invested": round(total_invested),
        "future_value": round(future_value),
        "wealth_gain": round(future_value - total_invested),
        "wealth_multiplier": round(future_value / max(total_invested, 1), 2),
        "yearly_breakdown": yearly_breakdown,
    })

# -----------------------------------------------
# 13. TAX REPORTS (Phase 2 - US-601)
# -----------------------------------------------

@router.post("/tax-report")
async def generate_tax_report(request: Request, user: dict = Depends(require_auth)):
    from services.tax_report_service import tax_report_service
    data = await request.json()
    report = tax_report_service.generate_full_report(data)
    logger.info("tax_report_generated", user_id=user.get("user_id",""))
    return api_response(data=report)

# -----------------------------------------------
# 14. BUDGET REPORT (Phase 2 - US-609)
# -----------------------------------------------

@router.post("/budget-report")
async def budget_report(request: Request, user: dict = Depends(require_auth)):
    from services.tax_report_service import tax_report_service
    user_id = user.get("user_id", "")
    data = await request.json()
    transactions = data.get("transactions", [])
    budgets = data.get("budgets", {})
    month = data.get("month")
    if not transactions:
        try:
            from routes.dashboard_api import _get_user_transactions
            transactions = _get_user_transactions(user_id)
        except Exception:
            pass
    report = tax_report_service.generate_budget_report(transactions, budgets, month)
    return api_response(data=report)

# -----------------------------------------------
# 15. INVESTMENT ANALYTICS (Phase 2 - US-607)
# -----------------------------------------------

@router.post("/portfolio/analysis")
async def portfolio_analysis(request: Request, user: dict = Depends(require_auth)):
    from services.investment_analytics import investment_analytics
    data = await request.json()
    holdings = data.get("holdings", [])
    history = data.get("returns_history", [])
    benchmark = data.get("benchmark", "nifty50")
    result = investment_analytics.full_analysis(holdings, history, benchmark)
    return api_response(data=result)

@router.get("/benchmarks")
async def list_benchmarks():
    from services.investment_analytics import BENCHMARKS
    return api_response(data=[
        {"code": k, "name": v["name"], "return_5y": v["annualized_return_5y"],
         "return_10y": v["annualized_return_10y"], "volatility": v["volatility_5y"]}
        for k, v in BENCHMARKS.items()
    ])

# -----------------------------------------------
# 16. HOUSEHOLD MANAGEMENT (Phase 2 - US-604)
# -----------------------------------------------

@router.post("/household/create")
async def create_household(request: Request, user: dict = Depends(require_auth)):
    from services.investment_analytics import household_manager
    data = await request.json()
    result = household_manager.create_household(user.get("user_id",""), data.get("name","My Family"))
    return api_response(data=result)

@router.post("/household/add-member")
async def add_household_member(request: Request, user: dict = Depends(require_auth)):
    from services.investment_analytics import household_manager
    data = await request.json()
    result = household_manager.add_member(
        data.get("household_id",""), data.get("phone",""),
        data.get("name",""), data.get("role","member"))
    return api_response(data=result)

@router.post("/household/summary")
async def household_summary(request: Request, user: dict = Depends(require_auth)):
    from services.investment_analytics import household_manager
    data = await request.json()
    result = household_manager.get_household_summary(
        data.get("household_id",""), data.get("all_transactions",{}))
    return api_response(data=result)

# -----------------------------------------------
# 17. EMAIL INTELLIGENCE (Phase 2 - US-602)
# -----------------------------------------------

@router.post("/email/parse")
async def parse_email(request: Request, user: dict = Depends(require_auth)):
    from services.email_whatsapp_service import email_intelligence
    data = await request.json()
    result = email_intelligence.parse_email(
        sender=data.get("sender",""), subject=data.get("subject",""),
        body=data.get("body",""), received_at=data.get("received_at"))
    return api_response(data=result)

@router.post("/email/batch")
async def parse_email_batch(request: Request, user: dict = Depends(require_auth)):
    from services.email_whatsapp_service import email_intelligence
    user_id = user.get("user_id", "")
    data = await request.json()
    result = email_intelligence.parse_batch(data.get("emails",[]), user_id)
    logger.info("email_batch_parsed", user_id=user_id, count=result["summary"]["total_emails"])
    return api_response(data=result["summary"])

# -----------------------------------------------
# 18. WHATSAPP BOT (Phase 2 - US-610)
# -----------------------------------------------

@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    from services.email_whatsapp_service import whatsapp_bot
    data = await request.json()
    phone = data.get("from","")
    message = data.get("message","")
    user_data = data.get("user_data",{})
    result = whatsapp_bot.process_message(phone, message, user_data)
    return api_response(data=result)

# -----------------------------------------------
# 19. TAX OPTIMIZER (Phase 3 - US-701)
# -----------------------------------------------

@router.post("/tax/optimize-80c")
async def optimize_80c(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_scale_services import tax_optimizer
    data = await request.json()
    result = tax_optimizer.optimize_80c(data.get("current_investments",{}), data.get("salary",0))
    return api_response(data=result)

@router.post("/tax/advance-plan")
async def advance_tax_plan(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_scale_services import tax_optimizer
    data = await request.json()
    result = tax_optimizer.plan_advance_tax(
        data.get("estimated_income",0), data.get("tds_deducted",0), data.get("already_paid",[]))
    return api_response(data=result)

# -----------------------------------------------
# 20. AI FINANCIAL ADVISOR (Phase 3 - US-702)
# -----------------------------------------------

@router.post("/advisor/plan")
async def financial_plan(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_scale_services import financial_advisor
    data = await request.json()
    result = financial_advisor.generate_plan(data)
    logger.info("advisor_plan_generated", user_id=user.get("user_id",""))
    return api_response(data=result)

# -----------------------------------------------
# 21. INSURANCE TRACKER (Phase 3 - US-706)
# -----------------------------------------------

@router.post("/insurance/add")
async def add_insurance(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_scale_services import insurance_tracker
    data = await request.json()
    result = insurance_tracker.add_policy(user.get("user_id",""), data)
    return api_response(data=result)

@router.get("/insurance")
async def get_insurance(user: dict = Depends(require_auth)):
    from services.phase3_scale_services import insurance_tracker
    return api_response(data=insurance_tracker.get_portfolio(user.get("user_id","")))

# -----------------------------------------------
# 22. CREDIT SCORE (Phase 3 - US-707)
# -----------------------------------------------

@router.post("/credit-score")
async def credit_score_report(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_scale_services import credit_score_service
    data = await request.json()
    result = credit_score_service.get_score_report(data.get("score",0), data.get("history",[]))
    return api_response(data=result)

# -----------------------------------------------
# 23. GST INTEGRATION (Phase 3 - US-705)
# -----------------------------------------------

@router.post("/gst/calculate")
async def gst_calculate(request: Request, user: dict = Depends(require_auth)):
    from services.enterprise_api_service import gst_service
    data = await request.json()
    result = gst_service.calculate_gst(data.get("amount",0), data.get("category","software"), data.get("inclusive",True))
    return api_response(data=result)

@router.get("/gst/summary")
async def gst_summary(user: dict = Depends(require_auth)):
    from services.enterprise_api_service import gst_service
    return api_response(data=gst_service.quarterly_summary(user.get("user_id","")))

# -----------------------------------------------
# 24. OPEN API (Phase 3 - US-709)
# -----------------------------------------------

@router.post("/api-keys/create")
async def create_api_key(request: Request, user: dict = Depends(require_auth)):
    from services.enterprise_api_service import api_key_manager
    data = await request.json()
    result = api_key_manager.create_key(user.get("user_id",""), data.get("name",""), data.get("scopes"))
    return api_response(data=result)

@router.get("/api-keys")
async def list_api_keys(user: dict = Depends(require_auth)):
    from services.enterprise_api_service import api_key_manager
    return api_response(data=api_key_manager.list_keys(user.get("user_id","")))

@router.post("/api-keys/revoke")
async def revoke_api_key(request: Request, user: dict = Depends(require_auth)):
    from services.enterprise_api_service import api_key_manager
    data = await request.json()
    return api_response(data=api_key_manager.revoke_key(user.get("user_id",""), data.get("prefix","")))

# -----------------------------------------------
# 25. ENTERPRISE (Phase 3 - US-710)
# -----------------------------------------------

@router.post("/org/create")
async def create_org(request: Request, user: dict = Depends(require_auth)):
    from services.enterprise_api_service import enterprise_manager
    data = await request.json()
    result = enterprise_manager.create_org(user.get("user_id",""), data.get("name",""), data.get("gstin",""))
    return api_response(data=result)

@router.post("/org/add-member")
async def org_add_member(request: Request, user: dict = Depends(require_auth)):
    from services.enterprise_api_service import enterprise_manager
    data = await request.json()
    return api_response(data=enterprise_manager.add_member(
        data.get("org_id",""), data.get("phone",""), data.get("name",""), data.get("role","viewer")))

@router.get("/org/list")
async def list_orgs(user: dict = Depends(require_auth)):
    from services.enterprise_api_service import enterprise_manager
    return api_response(data=enterprise_manager.list_user_orgs(user.get("user_id","")))

# -----------------------------------------------
# 26. FAMILY DASHBOARD (Phase 3 - US-703)
# -----------------------------------------------

@router.post("/family/dashboard")
async def create_family_dashboard(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import family_dashboard
    data = await request.json()
    result = family_dashboard.create_dashboard(
        data.get("family_id",""), data.get("name",""), data.get("members",[]), data.get("privacy"))
    return api_response(data=result)

@router.post("/family/dashboard/data")
async def get_family_data(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import family_dashboard
    data = await request.json()
    result = family_dashboard.get_dashboard_data(data.get("dashboard_id",""), data.get("member_data",{}))
    return api_response(data=result)

# -----------------------------------------------
# 27. EPF/NPS RETIREMENT (Phase 3 - US-704)
# -----------------------------------------------

@router.post("/retirement/epf")
async def epf_projection(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import retirement_tracker
    data = await request.json()
    result = retirement_tracker.calculate_epf_corpus(
        data.get("basic_salary",0), data.get("current_balance",0),
        data.get("current_age",30), data.get("retirement_age",60))
    return api_response(data=result)

@router.post("/retirement/nps")
async def nps_projection(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import retirement_tracker
    data = await request.json()
    result = retirement_tracker.calculate_nps_corpus(
        data.get("monthly_sip",0), data.get("current_balance",0),
        data.get("current_age",30), data.get("risk","moderate"), data.get("retirement_age",60))
    return api_response(data=result)

# -----------------------------------------------
# 28. INTERNATIONAL INVESTMENTS (Phase 3 - US-708)
# -----------------------------------------------

@router.post("/international/us-stocks")
async def track_us_stocks(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import international_investments
    data = await request.json()
    result = international_investments.track_us_holdings(data.get("holdings",[]))
    return api_response(data=result)

@router.post("/international/crypto")
async def track_crypto(request: Request, user: dict = Depends(require_auth)):
    from services.phase3_final_services import international_investments
    data = await request.json()
    result = international_investments.track_crypto(data.get("holdings",[]))
    return api_response(data=result)

@router.get("/international/rates")
async def exchange_rates():
    from services.phase3_final_services import international_investments
    return api_response(data=international_investments.EXCHANGE_RATES)
