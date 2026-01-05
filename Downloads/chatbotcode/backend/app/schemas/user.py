from enum import Enum
from typing import Any, Callable, List, Optional
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from pydantic.json_schema import GetJsonSchemaHandler
from pydantic_core import core_schema
from datetime import datetime
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: Callable[[Any], core_schema.CoreSchema],
    ) -> core_schema.CoreSchema:
        # With this schema, you can either pass a valid ObjectId in your code
        # or a string that can be converted to an ObjectId.
        # For example, `my_model.id = ObjectId("5f8f8f8f8f8f8f8f8f8f8f8f")`
        # or `my_model.id = "5f8f8f8f8f8f8f8f8f8f8f8f"`
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.chain_schema(
                        [
                            core_schema.str_schema(),
                            core_schema.no_info_plain_validator_function(cls.validate),
                        ]
                    ),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ):
        # Use the same JSON schema for both JSON and Python cases
        return handler(core_schema.str_schema())

class Role(str, Enum):
    admin = "admin"
    user = "user"

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    roles: List[Role] = Field(default_factory=lambda: [Role.user])
    name: Optional[str] = None
    createdDate: datetime = Field(default_factory=datetime.utcnow)
    modifiedDate: datetime = Field(default_factory=datetime.utcnow)
    createdBy: Optional[str] = None
    modifiedBy: Optional[str] = None
class UserCreate(UserBase):
    email: EmailStr

class UserUpdate(UserBase):
    pass

class UserInDBBase(UserBase):
    id: PyObjectId = Field(..., alias="_id")

    class Config:
        from_attributes = True
        populate_by_name = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    pass

class UserFromToken(BaseModel):
    id: str
    name: str
    email: EmailStr
    roles: list[str] = []