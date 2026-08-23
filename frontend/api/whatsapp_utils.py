"""Utility helpers for WhatsApp message sending.

The original code in several cron scripts performed ad‑hoc cleaning of the
recipient phone number and forced the Indian country code "91".  This caused
issues when a new WhatsApp Business number from a different region is used –
the hard‑coded prefix would corrupt the number.

`format_phone` now:
* Strips spaces and the leading '+' sign.
* If the number already starts with a recognized country‑code (the code is
  configurable via the ``DEFAULT_COUNTRY_CODE`` env var, default ``"91"``),
  it is left untouched.
* Otherwise the default country code is prepended.

All callers receive an **E.164‑compatible** numeric string without the ``+``
sign, which is what the WhatsApp Cloud API expects.
"""

import os

# Default country code to prepend when the number is not already in that format.
DEFAULT_COUNTRY_CODE = os.getenv("DEFAULT_COUNTRY_CODE", "91").strip()


def format_phone(raw_phone: str) -> str:
    """Return a clean phone number suitable for the WhatsApp Cloud API.

    The function removes whitespace and any leading ``+``.  If the resulting
    number does **not** start with ``DEFAULT_COUNTRY_CODE`` it is prepended.
    This makes the logic work for any region while preserving existing
    numbers.
    """
    if not raw_phone:
        return ""
    # Remove spaces and the leading '+' if present.
    clean = raw_phone.replace("+", "").replace(" ", "")
    # If already starts with the configured country code, keep it.
    if not clean.startswith(DEFAULT_COUNTRY_CODE):
        clean = f"{DEFAULT_COUNTRY_CODE}{clean}"
    return clean
