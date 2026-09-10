"""Shared rate limiter instance - imported by main.py and each route module
(kept separate from both to avoid a circular import between them)."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
