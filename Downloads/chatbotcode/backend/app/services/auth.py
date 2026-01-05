import traceback

import httpx
from app.core.config import settings
from app.schemas.user import UserFromToken
from jose import JWTError, jwk, jwt

# Configuration
JWKS_URL = f"https://login.microsoftonline.com/{settings.TENANT_ID}/discovery/v2.0/keys"
VALID_ISSUERS = [
    f"https://sts.windows.net/{settings.TENANT_ID}/",
    f"https://login.microsoftonline.com/{settings.TENANT_ID}/v2.0",
]


async def verify_token(token: str, request_client: httpx.AsyncClient) -> UserFromToken:
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
        response = await request_client.get(JWKS_URL)
        jwks = response.json()["keys"]
        key_data = next((k for k in jwks if k["kid"] == kid), None)
        if not key_data:
            raise Exception("Public key not found in JWKS")

        key_data["alg"] = key_data.get("alg", "RS256")
        key = jwk.construct(key_data)

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.AUDIENCE,
            issuer=VALID_ISSUERS,
        )
        return UserFromToken.model_validate(
            {
                "id": claims.get("oid"),
                "name": claims.get("name"),
                "email": claims.get("upn"),
                "roles": [role.lower() for role in claims.get("roles", [])],
            }
        )

    # to be catched by endpoint
    except JWTError as e:
        raise e
    except Exception as ex:
        traceback.print_exception(ex)
        raise ex
