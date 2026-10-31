"""Tests for PyVault"""
import pytest
from pyvault.vault import CryptoVault, VaultRecord


def test_vault_record_mapping():
    record = VaultRecord({"token": "xyz987", "user": "ghost"})
    assert record["token"] == "xyz987"
    assert record["user"] == "ghost"
    assert len(record) == 2
    assert "token" in record


def test_crypto_vault_store_and_retrieve():
    vault = CryptoVault("SecuritySector")
    vault.store("secret_pass", "Resurrection#2026")
    retrieved = vault.retrieve("secret_pass")
    assert retrieved == "Resurrection#2026"
    assert vault.retrieve("nonexistent") is None
