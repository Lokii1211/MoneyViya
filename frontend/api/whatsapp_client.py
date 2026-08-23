"""Centralised WhatsApp Cloud API client.

The original code duplicated environment look‑ups, token handling and phone‑
number cleaning in each cron script.  This module provides a single function
``send_message`` that:

* Reads ``WHATSAPP_ACCESS_TOKEN`` and ``WHATSAPP_PHONE_NUMBER_ID`` once.
* Uses :func:`whatsapp_utils.format_phone` to normalise the recipient number.
* Sends a plain‑text message via the Graph API.
* Returns ``True`` on success, ``False`` otherwise and logs concise error
  information (without leaking the full response body).

All cron jobs now import and call this function, making it trivial to switch
to a newly purchased WhatsApp Business number – no code changes are required;
only the ``WHATSAPP_PHONE_NUMBER_ID`` environment variable needs to be updated.
"""

import os
import json
import logging
from typing import Optional
import urllib.request
import urllib.error

# Robust import supporting both package and standalone execution
try:
    from .whatsapp_utils import format_phone
except (ImportError, ValueError):
    try:
        from whatsapp_utils import format_phone
    except ImportError:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from whatsapp_utils import format_phone

logger = logging.getLogger(__name__)


def _get_credentials() -> Optional[tuple[str, str]]:
    """Fetch token and phone‑id from environment.

    Returns ``None`` if either variable is missing, allowing the caller to
    decide whether to silently skip sending or raise an error.
    """
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    if not token or not phone_id:
        return None
    return token, phone_id


def send_message(to: str, body: str) -> bool:
    """Send a plain‑text WhatsApp message.

    Parameters
    ----------
    to: str
        Raw phone number (e.g. ``"+1 1234567890"`` or ``"1234567890"``).
    body: str
        Message text.

    Returns
    -------
    bool
        ``True`` if the Graph API responded with HTTP 200, ``False`` otherwise.
    """
    creds = _get_credentials()
    if creds is None:
        logger.warning("WhatsApp credentials not configured – message not sent")
        return False

    token, phone_id = creds
    clean_phone = format_phone(to)
    if not clean_phone:
        logger.error("Invalid phone number supplied to WhatsApp client")
        return False

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "text",
        "text": {"body": body},
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "MoneyViya/1.0",
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="replace")[:200]
        logger.error("WhatsApp send failed for %s: %s %s", clean_phone, err.code, err_body)
        return False
    except Exception as exc:
        logger.exception("WhatsApp send exception for %s: %s", clean_phone, exc)
        return False
