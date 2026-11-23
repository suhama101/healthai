"""Explicit origin and host allowlists for the research service."""

from os import environ
import re
from urllib.parse import urlsplit

DEV_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")
DEV_HOSTS = ("localhost", "127.0.0.1")


def allowlists(env=environ) -> tuple[tuple[str, ...], tuple[str, ...]]:
    origins = tuple(part.strip() for part in env.get("MEDILENS_ALLOWED_ORIGINS", ",".join(DEV_ORIGINS)).split(","))
    hosts = tuple(part.strip() for part in env.get("MEDILENS_ALLOWED_HOSTS", ",".join(DEV_HOSTS)).split(","))
    for origin in origins:
        parsed = urlsplit(origin)
        if origin in DEV_ORIGINS:
            continue
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or origin != f"https://{parsed.netloc}"
                or "*" in parsed.netloc or parsed.port == 0):
            raise ValueError("Allowed browser origins must be exact HTTPS origins or approved development origins.")
    for host in hosts:
        if not re.fullmatch(r"[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*", host):
            raise ValueError("Allowed hosts must be exact hostnames without ports or wildcards.")
    return origins, hosts
