from flask import g, request

from models.register_data import DEFAULT_DATA_VERSION
from function.settings import WBC_KL_2026_TOKEN, WBC_PENANG_2026_TOKEN


ACTIVE_DATA_VERSION = DEFAULT_DATA_VERSION
KL_DATA_VERSION = "WBC_KL_2026"

TOKEN_VERSION_MAP = {
    WBC_PENANG_2026_TOKEN: ACTIVE_DATA_VERSION,
    WBC_KL_2026_TOKEN: KL_DATA_VERSION,
}

VERSION_TOKEN_MAP = {version: token for token, version in TOKEN_VERSION_MAP.items()}
VALID_ROOM_TOKENS = set(TOKEN_VERSION_MAP)
VALID_VERSION_NAMES = set(VERSION_TOKEN_MAP)


def versioned_payload(payload=None, **extra):
    active_version = getattr(g, "data_version", ACTIVE_DATA_VERSION)

    if payload is None:
        payload = {}

    if isinstance(payload, dict):
        response = dict(payload)
        response.update(extra)
        response.setdefault("version", active_version)
        return response

    response = {"data": payload, "version": active_version}
    response.update(extra)
    return response


def normalize_token(token):
    if not token:
        return None

    if token.startswith("Bearer "):
        return token.replace("Bearer ", "", 1).strip()

    return token.strip()


def get_request_token():
    return normalize_token(
        request.headers.get("Authorization") or request.args.get("token")
    )


def resolve_version_from_token(token):
    return TOKEN_VERSION_MAP.get(normalize_token(token))


def resolve_room_from_version(version):
    return VERSION_TOKEN_MAP.get(normalize_version_name(version))


def normalize_version_name(version, default=ACTIVE_DATA_VERSION):
    if version in VALID_VERSION_NAMES:
        return version

    return default


def get_request_version(default=ACTIVE_DATA_VERSION):
    return getattr(g, "data_version", default)


def get_request_room(default=None):
    room = getattr(g, "room", None)
    if room:
        return room

    if default is not None:
        return default

    return resolve_room_from_version(get_request_version())
