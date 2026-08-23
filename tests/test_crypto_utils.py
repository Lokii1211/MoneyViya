"""
Test AES-CTR + HMAC token encryption and decryption
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "api"))
from crypto_utils import encrypt_token, decrypt_token


def test_encryption_roundtrip():
    test_tokens = [
        "ya29.a0AXooCguSAMPLE_GMAIL_ACCESS_TOKEN_123456789",
        "1//04SAMPLE_GMAIL_REFRESH_TOKEN_987654321",
        "simple_secret_token",
        "",
    ]
    for token in test_tokens:
        if not token:
            assert encrypt_token(token) == ""
            assert decrypt_token("") == ""
            continue
        encrypted = encrypt_token(token)
        assert encrypted != token
        assert encrypted.startswith("djE6") or "v1:" in str(encrypted) or len(encrypted) > len(token)
        decrypted = decrypt_token(encrypted)
        assert decrypted == token, f"Expected {token}, got {decrypted}"

    # Test plaintext backward compatibility
    plain = "legacy_unencrypted_token_123"
    assert decrypt_token(plain) == plain
    print("PASS: Token encryption & decryption roundtrip verified!")


if __name__ == "__main__":
    test_encryption_roundtrip()
