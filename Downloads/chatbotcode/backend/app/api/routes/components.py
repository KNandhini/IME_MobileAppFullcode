import time
from typing import Annotated

import httpx
from app.api.deps import get_analytics_db, get_current_user, get_httpx_client
from app.core.config import settings
from app.schemas.components import (
    ComponentExecuteRequest,
    ComponentExecuteResponse,
    ComponentResponse,
    ComponentsOuput,
    ComponentVariable,
    ComponentVariablesResponse,
    SingleComponentOutput,
)
from app.services.components import (
    get_datto_access_token,
    load_json_file,
    retrieve_components,
)
from fastapi import APIRouter, Depends, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from motor.motor_asyncio import AsyncIOMotorDatabase

oai_llm = ChatOpenAI(
    api_key=settings.OPENAI_API_KEY,
    model=settings.OPENAI_CHAT_MODEL,
    temperature=settings.OPENAI_CHAT_MODEL_TEMPERATURE,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
structured_llm = oai_llm.with_structured_output(ComponentsOuput)

component_index = load_json_file("assets/components/components_index.json")

router = APIRouter(
    prefix="/component", tags=["Components"], dependencies=[Depends(get_current_user)]
)

# TODO: Implement "/fetch" and "variables" functionalities in services


@router.get("/fetch", response_model=list[ComponentResponse])
async def get_relevant_components(query: str) -> list[ComponentResponse]:
    """
    Fetch all the most relevant components for the user's query

    Retrive top 10 from vectordb and pass it to LM for filtering only relevant ones, an effective hybrid retrieval :)
    """

    relevant_scripts = []
    prompt_template = ChatPromptTemplate(
        [
            (
                "system",
                """
You are an intelligent ticket resolution assistant, who helps the support engineer to resolve tickets. Your task is to pick the Datto RMM components that are most relevant to user's query.

Here are the available Datto RMM components:
{components}
""",
            ),
            ("human", "User query: {user_input}"),
        ]
    )

    # retrieve components from vectordb for the given query
    # TODO: implement this as async (https://www.pinecone.io/learn/pinecone-async-fastapi/)
    retrieved_components = retrieve_components(query=query)

    # format the components to inject in the prompt
    formatted_components = "\n\n".join(
        [
            f"Component UID: {component['uid']}\nName: {component['name']}\nDescription: {component['description']}"
            for component in retrieved_components
        ]
    )
    prompt = prompt_template.invoke(
        {"user_input": query, "components": formatted_components}
    )
    response: list[SingleComponentOutput] = await structured_llm.ainvoke(prompt)
    components = response.components

    for output_component in components:
        component = component_index.get(output_component.uid, None)
        if component:
            relevant_scripts.append(
                ComponentResponse(
                    component_uid=component["uid"],
                    component_name=component["name"],
                    component_description=component["description"],
                    component_category=component["categoryCode"],
                    relevancy_reason=output_component.reason,
                )
            )

    return relevant_scripts


@router.get("/variables", response_model=ComponentVariablesResponse)
async def get_component_variables(component_uid: str) -> ComponentVariablesResponse:
    """
    Get the necessary variables for the component with given uid, if any. Like components may or may not have variables that are needed to create a quickjob
    """
    variables = []
    component = component_index.get(component_uid, None)
    if component:
        component_variables = component["variables"]
        if component_variables:
            for variable in component_variables:
                variable_name = variable["name"]
                variable_desc = variable["description"]
                variable_type = variable["type"]
                is_required = False

                if variable_type == "boolean":
                    variable_default_value = (
                        True if variable["defaultVal"] == "true" else False
                    )
                elif variable_type == "string" or variable_type == "map":
                    if variable["defaultVal"]:
                        variable_default_value = variable["defaultVal"]
                    else:
                        # this variables is string and is required, coz the default value is empty, that means, it is supposed to fill up by user
                        is_required = True
                        variable_default_value = None

                variables.append(
                    ComponentVariable(
                        name=variable_name,
                        description=variable_desc,
                        type=variable_type,
                        is_required=is_required,
                        default_value=variable_default_value,
                    )
                )
            return ComponentVariablesResponse(variables=variables)
        else:
            # no varibales for this component
            return ComponentVariablesResponse(variables=None)

    else:
        raise HTTPException(
            status_code=404, detail=f"Component with uid '{component_uid}' is not found"
        )


@router.post("/execute", response_model=ComponentExecuteResponse)
async def execute_component(
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    payload: ComponentExecuteRequest,
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
) -> ComponentExecuteResponse:
    """
    Create a quickjob in datto rmm for the provided component details
    """

    access_token = await get_datto_access_token(httpx_client)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload_json = {
        "jobName": f"ChatBot Triggered Job: {payload.name}",
        "jobComponent": {
            "componentUid": payload.uid,
            "variables": [variable.model_dump() for variable in payload.variables],
        },
    }

    DATTO_QUICKJOB_URL = f"{settings.DATTO_API_URL}/device/{payload.device_id}/quickjob"
    start = time.perf_counter()
    response = await httpx_client.put(
        DATTO_QUICKJOB_URL, headers=headers, json=payload_json
    )

    try:
        # parse job uid, if successfully parsed, then that means the job was createpd
        job = response.json().get("job")
        await db_analytics["script_events"].insert_one(
            {
                "type": "script_execute_success",
                "component_uid": payload.uid,
                "job_uid": job.get("uid") if isinstance(job, dict) else None,
                "latency_ms": (time.perf_counter() - start) * 1000,
                "timestamp": int(time.time()),
            }
        )
        return job
    except Exception as e:
        await db_analytics["script_events"].insert_one(
            {
                "type": "script_execute_failure",
                "component_uid": payload.uid,
                "error": str(e),
                "status_code": response.status_code,
                "latency_ms": (time.perf_counter() - start) * 1000,
                "timestamp": int(time.time()),
            }
        )
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Error Occured during job creation: {str(e)}\n\n{response.text}",
        )
