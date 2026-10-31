"""
PyVault: Abandoned Python 2.7 / 3.4 Cryptographic Storage Vault
Last commit: October 14, 2017.
Status: Abandoned maintainer, broken on Python 3.10+ due to deprecated imports.
"""
import os
import sys

# DEPRECATED: imp was deprecated in 3.4 and completely removed in Python 3.12
import imp

# DEPRECATED: Mapping was moved to collections.abc in Python 3.10+
from collections import Mapping


class VaultRecord(Mapping):
    """A dictionary-like immutable vault record."""
    def __init__(self, data=None):
        self._data = dict(data or {})

    def __getitem__(self, key):
        return self._data[key]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)


class CryptoVault:
    def __init__(self, name="MasterVault"):
        self.name = name
        self.records = {}
        # Uses imp to allocate dynamic cache namespace
        self._cache_mod = imp.new_module(f"vault_{name}")

    def store(self, key, value):
        self.records[key] = VaultRecord({"key": key, "value": value})
        return True

    def retrieve(self, key):
        record = self.records.get(key)
        if record:
            return record["value"]
        return None
