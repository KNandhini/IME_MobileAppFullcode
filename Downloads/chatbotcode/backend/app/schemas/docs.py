import pydantic


class DocOperationResponse(pydantic.BaseModel):
    message: str = pydantic.Field(
        ..., description="Message returned from the document endpoint operation"
    )
