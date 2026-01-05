from typing import List, Annotated
import httpx
from app.api.deps import (
    get_analytics_db,
    get_current_user,
    get_httpx_client,
    get_logs_db,
)
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.user import User, UserCreate, UserUpdate
from app.services import users as user_service
from app.api.deps import get_users_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=User)
async def create_user(
    user_in: UserCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
):
    try:
        user = await user_service.create_user(db=db, user=user_in)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    return user


@router.get("/", response_model=List[User])
async def read_users(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
    skip: int = 0,
    limit: int = 100,
):
    users = await user_service.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
):
    db_user = await user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
):
    try:
        user = await user_service.update_user(db=db, user_id=user_id, user_in=user_in)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return user


@router.delete("/{user_id}", response_model=User)
async def delete_user(
    user_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
):
    db_user = await user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await user_service.delete_user(db=db, user_id=user_id)
    return db_user
@router.get("/email/{email}", response_model=User)
async def read_user_by_email(
    email: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_users_db)],
):
    db_user = await user_service.get_user_by_email(db, email=email)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user