import re
import time
from typing import Annotated

import httpx
from app.core.config import settings
from app.schemas.user import User, UserCreate, UserFromToken
from app.services.auth import verify_token
from app.services.users import create_user, get_user_by_email
from fastapi import Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase


def get_httpx_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


def get_analytics_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db_analytics


def get_logs_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db_logs


def get_chat_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db_chats

def get_users_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db_users

async def get_current_user(
    request: Request,
    http_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    analytics_db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    users_db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],

) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        await analytics_db["auth_events"].insert_one(
            {
                "type": "login_failure",
                "reason": "missing_auth_header/token",
                "timestamp": int(time.time()),
            }
        )
        raise HTTPException(status_code=401, detail="Missing or invalid auth header")

    token = auth_header.removeprefix("Bearer ")
    try:
        user_from_token = await verify_token(token, request_client=http_client)
        user = await get_user_by_email(users_db, email=user_from_token.email)
        if user:
            return user

        # Create user if not exists
        user_in = UserCreate(
            email=user_from_token.email,
            name=user_from_token.name,
            roles=user_from_token.roles,
        )
        return await create_user(db=users_db, user=user_in)
    except Exception as e:
        await analytics_db["auth_events"].insert_one(
            {
                "type": "login_failure",
                "reason": str(e),
                "timestamp": int(time.time()),
            }
        )
        raise HTTPException(status_code=401, detail=str(e))


zone_cache: dict[str, int] = {}


# https://autotask.net/help/developerhelp/content/apis/rest/api_calls/REST_ZoneInformation.htm
async def get_zone_number(
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    user: Annotated[User, Depends(get_current_user)],
) -> str:
    if zone_number := zone_cache.get(user.email):
        return zone_number

    # call global zoneinfo endpoint to get per-user zone
    resp = await httpx_client.get(
        "https://webservices.autotask.net/ATServicesRest/V1.0/ZoneInformation",
        params={"user": user.email},
    )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502, detail=f"ZoneInformation failed: {resp.status_code}"
        )
    data = resp.json()

    # extracting the zone no. from autotask weburl, its simple than "url"
    api_url = data.get("webUrl")
    match = re.search(r"ww(\d+)\.autotask\.net", api_url)  # it'll most probably match
    zone_number = int(match.group(1))

    zone_cache[user.email] = zone_number
    return zone_number


async def get_resource_id(
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    user: Annotated[User, Depends(get_current_user)],
) -> int:
    # dependency to get the resource id of the current user. to fetch the tickets that are assigned to the CURRENT user.
    url = settings.AUTOTASK_BASE_URL + "Resources/query"

    payload = {
        "filter": [
            {
                "op": "eq",
                "field": "email",
                "value": user.email,
            }
        ]
    }
    response = await httpx_client.post(url, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    response_items = response.json().get("items", [])
    if not response_items:
        raise HTTPException(
            status_code=404,
            detail="Couldn't fetch the autotask resource id of the current user",
        )

    return response_items[0]["id"]
