import time
from typing import Annotated

import httpx
from app.api.deps import (
    get_analytics_db,
    get_current_user,
    get_httpx_client,
    get_logs_db,
)
from app.core.config import settings
from app.schemas.tickets import (
    TicketCompleteRequest,
    TicketDetails,
    TicketsFetch,
)
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(
    prefix="/ticket", tags=["Tickets"], dependencies=[Depends(get_current_user)]
)


@router.post("/start_work")
async def start_work(
    ticket_id: int,
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
) -> dict:
    now_ts = int(time.time())
    await db_analytics["ticket_events"].insert_one(
        {"type": "ticket_start", "ticket_id": ticket_id, "timestamp": now_ts}
    )
    return {"status": "ok", "ticket_id": ticket_id, "started_at": now_ts}


@router.get("/fetch", response_model=list[TicketsFetch])
async def fetch_tickets(
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    db_logs: Annotated[AsyncIOMotorDatabase, Depends(get_logs_db)],
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    resource_id: int = 29682973,  # Annotated[int, Depends(get_resource_id)] coz this DI is not working for some account, that is, its failing to get the autotask resource id of the current user, based on user email
) -> list[TicketsFetch]:
    """
    Returns all tickets assigned to the provided resource ID.
    """

    url = settings.AUTOTASK_BASE_URL + "Tickets/query"
    payload = {
        "IncludeFields": [
            "id",
            "TicketNumber",
            "Title",
            "Status",
            "Priority",
            "createDate",
            "creatorResourceID",
        ],
        "Filter": [
            {"field": "assignedResourceID", "op": "eq", "value": resource_id},
            {
                "field": "status",
                "op": "eq",
                "value": 8,
            },  # filter out the tickets only which is in-progress
        ],  # need to be changed later
    }

    start = time.perf_counter()
    response = await httpx_client.post(url, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    tickets = response.json().get("items", [])
    for ticket in tickets:
        ticket["link"] = (
            f"{settings.AUTOTASK_WEB_URL}/Autotask/AutotaskExtend/ExecuteCommand.aspx?Code=OpenTicketDetail&TicketID={ticket['id']}"
        )

    await db_logs["data_access"].insert_one(
        {
            "resource": "fetch_tickets",
            "resource_id": resource_id,
            "count": len(tickets),
            "latency_ms": (time.perf_counter() - start) * 1000,
            "timestamp": int(time.time()),
        }
    )

    # store priority distribution to analytics
    pr_counts: dict[str, int] = {}
    for t in tickets:
        priority = str(t.get("priority"))
        pr_counts[priority] = pr_counts.get(priority, 0) + 1
    await db_analytics["ticket_priority_counts"].insert_one(
        {
            "resource_id": resource_id,
            "counts": pr_counts,
            "timestamp": int(time.time()),
        }
    )

    return tickets


@router.get("/details", response_model=TicketDetails)
async def ticket_details(
    ticket_id: int,
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    db_logs: Annotated[AsyncIOMotorDatabase, Depends(get_logs_db)],
) -> TicketDetails | dict:
    """
    Returns details of the ticket with corresponding id
    """

    url = settings.AUTOTASK_BASE_URL + f"Tickets/{ticket_id}"
    start = time.perf_counter()
    response = await httpx_client.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    result = response.json().get("item", {})

    await db_logs["data_access"].insert_one(
        {
            "resource": "ticket_details",
            "ticket_id": ticket_id,
            "latency_ms": (time.perf_counter() - start) * 1000,
            "timestamp": int(time.time()),
        }
    )

    return result


@router.put("/mark_as_completed")
async def mark_as_completed(
    request: TicketCompleteRequest,
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
) -> None:
    """
    Mark a ticket as completed
    """

    url = settings.AUTOTASK_BASE_URL + "Tickets"
    payload = {
        "id": request.ticket_id,
        "status": 5,
        "resolution": request.chat,
    }  # status 5 indicates completed

    start = time.perf_counter()
    response = await httpx_client.patch(url=url, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    _ = response.json()

    await db_analytics["ticket_events"].insert_one(
        {
            "type": "ticket_closed",
            "ticket_id": request.ticket_id,
            "latency_ms": (time.perf_counter() - start) * 1000,
            "timestamp": int(time.time()),
        }
    )


@router.put("/mark_as_onhold")
async def mark_as_onhold(
    ticket_id: int,
    httpx_client: Annotated[httpx.AsyncClient, Depends(get_httpx_client)],
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
) -> None:
    """
    Mark a ticket as on-hold
    """

    url = settings.AUTOTASK_BASE_URL + "Tickets"
    payload = {
        "id": ticket_id,
        "status": 17,
    }  # status 17 indicates on-hold

    start = time.perf_counter()
    response = await httpx_client.patch(url=url, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    _ = response.json()

    await db_analytics["ticket_events"].insert_one(
        {
            "type": "ticket_onhold",
            "ticket_id": ticket_id,
            "latency_ms": (time.perf_counter() - start) * 1000,
            "timestamp": int(time.time()),
        }
    )
