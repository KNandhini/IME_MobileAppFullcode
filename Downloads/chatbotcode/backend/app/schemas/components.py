from typing import Literal, Optional, Union

from pydantic import BaseModel, Field


class SingleComponentOutput(BaseModel):
    uid: str = Field(..., description="UID of the relevant script")
    reason: str = Field(
        ...,
        description="A breif reason on why this script is relevant to the user's query",
    )


class ComponentsOuput(BaseModel):
    """List of relevant components for the user's query"""

    components: list[SingleComponentOutput]


class ComponentResponse(BaseModel):
    component_uid: str = Field(..., description="UID of the component")
    component_name: str = Field(..., description="Name of the component")
    component_description: str = Field(..., description="Description of the component")
    component_category: str = Field(..., description="Category of the component")
    relevancy_reason: str = Field(
        ..., description="Reason why this component is relevant to the user query."
    )


class ComponentVariable(BaseModel):
    name: str = Field(description="Name of the variable")
    description: str = Field(description="Description of the variable")
    type: Literal["boolean", "string", "map"] = Field(
        description="Type of the variable"
    )
    is_required: bool = Field(
        default=False, description="Whether or not this variable is required"
    )
    default_value: Union[None, bool, str] = Field(
        description="Default value of the variable, if provided"
    )


class ComponentVariablesResponse(BaseModel):
    variables: Optional[list[ComponentVariable]] = Field(
        default=None, description="Variables for the given component, if theres any"
    )


class ComponentVariableRequest(BaseModel):
    name: str = Field(
        ...,
        description="Name of the variable, this has to be the exact one that is retruned earlier",
    )
    value: str = Field(..., description="Value of the corresponding variable")


class ComponentExecuteRequest(BaseModel):
    uid: str = Field(..., description="UID of the component, which is to be executed")
    device_id: str = Field(
        ..., description="ID of the Device, where the component supposed to execute"
    )
    name: str = Field(..., description="Name of the component")
    variables: list[ComponentVariableRequest] = Field(
        ...,
        description="List of necessary variables of the component which is to be executed, with name and its corresponding value",
    )


class ComponentExecuteResponse(BaseModel):
    uid: str = Field(description="UID of the created job")
    status: Literal["active", "completed"] = Field(
        description="Status of the created quickjob"
    )
