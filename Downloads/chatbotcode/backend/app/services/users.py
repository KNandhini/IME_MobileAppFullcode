from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.user import User, UserCreate, UserInDB, UserUpdate



async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[UserInDB]:
    user = await db["userDetails"].find_one({"email": email})
    if user:
        return UserInDB(**user)
    return None


async def create_user(db: AsyncIOMotorDatabase, user: UserCreate) -> UserInDB:
    existing_user = await get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError("The user with this username already exists.")
    db_user = user.dict()
    result = await db["userDetails"].insert_one(db_user)
    created_user = await db["userDetails"].find_one({"_id": result.inserted_id})
    return UserInDB(**created_user)


async def get_users(db: AsyncIOMotorDatabase, skip: int = 0, limit: int = 100) -> List[UserInDB]:
    users = await db["userDetails"].find().skip(skip).limit(limit).to_list(length=limit)
    return [UserInDB(**user) for user in users]


async def get_user(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    user = await db["userDetails"].find_one({"_id": ObjectId(user_id)})
    if user:
        return UserInDB(**user)
    return None


async def update_user(db: AsyncIOMotorDatabase, user_id: str, user_in: UserUpdate) -> Optional[UserInDB]:
    update_data = user_in.dict(exclude_unset=True)

    if "email" in update_data:
        existing_user = await get_user_by_email(db, update_data["email"])
        if existing_user and existing_user.id != ObjectId(user_id):
            raise ValueError("Email already registered by another user.")

    result = await db["userDetails"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})

    if result.matched_count == 0:
        return None

    updated_user = await get_user(db, user_id)
    return updated_user


async def delete_user(db: AsyncIOMotorDatabase, user_id: str):
    await db["userDetails"].delete_one({"_id": ObjectId(user_id)})


async def create_user_from_token(db: AsyncIOMotorDatabase, user_data: dict) -> User:
    user = User(**user_data)
    await db["userDetails"].insert_one(user.dict(by_alias=True))
    return user
