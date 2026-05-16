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
