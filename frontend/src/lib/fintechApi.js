/**
 * Viya Fintech API Client
 * ========================
 * SMS Ingest, Bank Accounts, Portfolio — frontend API layer.
 * Closes GAP 1-4 from competitive analysis.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';
const FINTECH = `${API_BASE}/api/v1/fintech`;

function getHeaders() {
  const token = localStorage.getItem('viya_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function request(method, url, body = null) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ══════════════════════════════════════════════════
// SMS INGEST (GAP 1 + GAP 2)
// ══════════════════════════════════════════════════

/** Ingest a single SMS from Capacitor plugin */
export async function ingestSMS(body, sender = '', receivedAt = null) {
  return request('POST', `${FINTECH}/sms/ingest`, {
    body, sender, received_at: receivedAt,
  });
}

/** Batch ingest historical SMS (initial sync, up to 500) */
export async function ingestSMSBatch(messages) {
  return request('POST', `${FINTECH}/sms/batch`, { messages });
}

/** Test-parse SMS without storing (debug) */
export async function testParseSMS(body, sender = '') {
  return request('POST', `${FINTECH}/sms/test-parse`, { body, sender });
}

// ══════════════════════════════════════════════════
// BANK ACCOUNTS (GAP 4)
// ══════════════════════════════════════════════════

export async function listBankAccounts() {
  return request('GET', `${FINTECH}/bank-accounts`);
}

export async function createBankAccount(data) {
  return request('POST', `${FINTECH}/bank-accounts`, data);
}

// ══════════════════════════════════════════════════
// PORTFOLIO (GAP 3)
// ══════════════════════════════════════════════════

export async function getPortfolio() {
  return request('GET', `${FINTECH}/portfolio`);
}

export async function addHolding(data) {
  return request('POST', `${FINTECH}/holdings`, data);
}

export async function getPortfolioSummary() {
  return request('GET', `${FINTECH}/portfolio/summary`);
}

// ══════════════════════════════════════════════════
// PORTFOLIO ANALYTICS (Phase 2 - US-607)
// ══════════════════════════════════════════════════

export async function getPortfolioAnalysis(holdings, benchmark = 'nifty50') {
  return request('POST', `${FINTECH}/portfolio/analysis`, { holdings, benchmark });
}

export async function getBenchmarks() {
  return request('GET', `${FINTECH}/benchmarks`);
}

// ══════════════════════════════════════════════════
// AI INSIGHTS (Phase 2 - US-603)
// ══════════════════════════════════════════════════

export async function getInsights(financialData) {
  return request('POST', `${FINTECH}/insights`, financialData);
}

// ══════════════════════════════════════════════════
// TAX (Phase 2 US-601, Phase 3 US-701)
// ══════════════════════════════════════════════════

export async function getTaxReport(income, investments = {}, capitalGains = []) {
  return request('POST', `${FINTECH}/tax/report`, { income, investments, capital_gains: capitalGains });
}

export async function optimize80C(currentInvestments, salary) {
  return request('POST', `${FINTECH}/tax/optimize-80c`, { current_investments: currentInvestments, salary });
}

export async function getAdvanceTaxPlan(estimatedIncome, tdsDeducted = 0, alreadyPaid = []) {
  return request('POST', `${FINTECH}/tax/advance-plan`, { estimated_income: estimatedIncome, tds_deducted: tdsDeducted, already_paid: alreadyPaid });
}

// ══════════════════════════════════════════════════
// BUDGET (Phase 2 - US-609)
// ══════════════════════════════════════════════════

export async function getBudgetReport(transactions, budgets) {
  return request('POST', `${FINTECH}/budget/report`, { transactions, budgets });
}

// ══════════════════════════════════════════════════
// AI FINANCIAL ADVISOR (Phase 3 - US-702)
// ══════════════════════════════════════════════════

export async function getFinancialPlan(profile) {
  return request('POST', `${FINTECH}/advisor/plan`, profile);
}

// ══════════════════════════════════════════════════
// RETIREMENT (Phase 3 - US-704)
// ══════════════════════════════════════════════════

export async function getEPFProjection(basicSalary, currentBalance, currentAge, retirementAge = 60) {
  return request('POST', `${FINTECH}/retirement/epf`, {
    basic_salary: basicSalary, current_balance: currentBalance,
    current_age: currentAge, retirement_age: retirementAge,
  });
}

export async function getNPSProjection(monthlySip, currentBalance, currentAge, risk = 'moderate', retirementAge = 60) {
  return request('POST', `${FINTECH}/retirement/nps`, {
    monthly_sip: monthlySip, current_balance: currentBalance,
    current_age: currentAge, risk, retirement_age: retirementAge,
  });
}

// ══════════════════════════════════════════════════
// INTERNATIONAL (Phase 3 - US-708)
// ══════════════════════════════════════════════════

export async function trackUSStocks(holdings) {
  return request('POST', `${FINTECH}/international/us-stocks`, { holdings });
}

export async function trackCrypto(holdings) {
  return request('POST', `${FINTECH}/international/crypto`, { holdings });
}

export async function getExchangeRates() {
  return request('GET', `${FINTECH}/international/rates`);
}

// ══════════════════════════════════════════════════
// EMAIL INTELLIGENCE (Phase 2 - US-602)
// ══════════════════════════════════════════════════

export async function parseEmail(sender, subject, body = '') {
  return request('POST', `${FINTECH}/email/parse`, { sender, subject, body });
}

export async function parseEmailBatch(emails) {
  return request('POST', `${FINTECH}/email/batch`, { emails });
}

// ══════════════════════════════════════════════════
// HOUSEHOLD (Phase 2 - US-604)
// ══════════════════════════════════════════════════

export async function createHousehold(name, headPhone) {
  return request('POST', `${FINTECH}/household/create`, { name, head_phone: headPhone });
}

export async function addHouseholdMember(familyId, memberData) {
  return request('POST', `${FINTECH}/household/add-member`, { family_id: familyId, ...memberData });
}

export async function getHouseholdSummary(familyId, members) {
  return request('POST', `${FINTECH}/household/summary`, { family_id: familyId, members });
}

// ══════════════════════════════════════════════════
// INSURANCE (Phase 3 - US-706)
// ══════════════════════════════════════════════════

export async function addInsurancePolicy(policy) {
  return request('POST', `${FINTECH}/insurance/add`, policy);
}

export async function getInsurancePortfolio() {
  return request('GET', `${FINTECH}/insurance`);
}

// ══════════════════════════════════════════════════
// CREDIT SCORE (Phase 3 - US-707)
// ══════════════════════════════════════════════════

export async function getCreditScoreReport(score, history = []) {
  return request('POST', `${FINTECH}/credit-score`, { score, history });
}

// ══════════════════════════════════════════════════
// GST (Phase 3 - US-705)
// ══════════════════════════════════════════════════

export async function calculateGST(amount, category, inclusive = true) {
  return request('POST', `${FINTECH}/gst/calculate`, { amount, category, inclusive });
}

export async function getGSTSummary() {
  return request('GET', `${FINTECH}/gst/summary`);
}

// ══════════════════════════════════════════════════
// API KEYS (Phase 3 - US-709)
// ══════════════════════════════════════════════════

export async function createAPIKey(name, scopes = []) {
  return request('POST', `${FINTECH}/api-keys/create`, { name, scopes });
}

export async function listAPIKeys() {
  return request('GET', `${FINTECH}/api-keys`);
}

export async function revokeAPIKey(prefix) {
  return request('POST', `${FINTECH}/api-keys/revoke`, { prefix });
}

// ══════════════════════════════════════════════════
// ENTERPRISE (Phase 3 - US-710)
// ══════════════════════════════════════════════════

export async function createOrg(name, gstin = '') {
  return request('POST', `${FINTECH}/org/create`, { name, gstin });
}

export async function addOrgMember(orgId, phone, name, role = 'viewer') {
  return request('POST', `${FINTECH}/org/add-member`, { org_id: orgId, phone, name, role });
}

export async function listOrgs() {
  return request('GET', `${FINTECH}/org/list`);
}
