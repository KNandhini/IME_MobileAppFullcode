from __future__ import annotations

from datetime import datetime, timedelta
from typing import Annotated, Any, Literal, Optional

from app.api.deps import get_analytics_db, get_current_user, get_logs_db
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/analytics", tags=["Analytics"], dependencies=[Depends(get_current_user)]
)


class GenericEvent(BaseModel):
    type: str = Field(..., description="Event type key")
    session_id: Optional[str] = None
    ticket_id: Optional[int] = None
    payload: Optional[dict] = None


class FeedbackEvent(BaseModel):
    session_id: Optional[str] = None
    ticket_id: Optional[int] = None
    rating: Literal["up", "down"]


class SessionEvent(BaseModel):
    session_id: str
    user_id: Optional[str] = None


@router.get("/summary")
async def summary(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())

    ticket_closed = await db["ticket_events"].count_documents(
        {"type": "ticket_closed", "timestamp": {"$gte": since_ts}}
    )
    rag_events = await db["rag_events"].count_documents(
        {"type": "rag_response", "timestamp": {"$gte": since_ts}}
    )
    script_success = await db["script_events"].count_documents(
        {"type": "script_execute_success", "timestamp": {"$gte": since_ts}}
    )
    script_failure = await db["script_events"].count_documents(
        {"type": "script_execute_failure", "timestamp": {"$gte": since_ts}}
    )
    auth_success = await db["auth_events"].count_documents(
        {"type": "login_success", "timestamp": {"$gte": since_ts}}
    )
    auth_failure = await db["auth_events"].count_documents(
        {"type": "login_failure", "timestamp": {"$gte": since_ts}}
    )

    # FIX: Added timestamp filter to these queries
    sop_hits = await db["rag_events"].count_documents(
        {
            "type": "rag_response",
            "top_score": {"$gte": 0.6},
            "timestamp": {"$gte": since_ts},
        }
    )
    serp_fallbacks = await db["rag_events"].count_documents(
        {"type": "rag_response", "serp_fallback": True, "timestamp": {"$gte": since_ts}}
    )

    return {
        "tickets": {"closed": ticket_closed},
        "rag": {
            "responses": rag_events,
            "sop_retrieval_accuracy": (sop_hits / rag_events) * 100
            if rag_events
            else 0,
            "serp_fallback_rate": (serp_fallbacks / rag_events) * 100
            if rag_events
            else 0,
        },
        "scripts": {"success": script_success, "failure": script_failure},
        "auth": {
            "success": auth_success,
            "failure": auth_failure,
            "success_rate": (auth_success / (auth_success + auth_failure)) * 100
            if (auth_success + auth_failure)
            else 0,
        },
    }


@router.post("/events/log")
async def log_generic_event(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], event: GenericEvent
) -> dict[str, Any]:
    doc = event.model_dump()
    doc["timestamp"] = int(datetime.utcnow().timestamp())
    await db["custom_events"].insert_one(doc)
    return {"status": "ok"}


@router.post("/session/start")
async def session_start(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], event: SessionEvent
) -> dict[str, str]:
    await db["sessions"].insert_one(
        {
            "session_id": event.session_id,
            "user_id": event.user_id,
            "start_ts": int(datetime.utcnow().timestamp()),
        }
    )
    return {"status": "ok"}


@router.post("/session/end")
async def session_end(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], event: SessionEvent
) -> dict[str, str]:
    end_ts = int(datetime.utcnow().timestamp())
    await db["sessions"].update_one(
        {"session_id": event.session_id},
        {
            "$set": {
                "end_ts": end_ts,
                "duration_sec": {"$subtract": [end_ts, "$start_ts"]},
            }
        },
        upsert=True,
    )
    return {"status": "ok"}


@router.post("/feedback")
async def post_feedback(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    feedback: FeedbackEvent,
) -> dict[str, Any]:
    await db["feedback"].insert_one(
        {
            "session_id": feedback.session_id,
            "ticket_id": feedback.ticket_id,
            "rating": feedback.rating,
            "timestamp": int(datetime.utcnow().timestamp()),
        }
    )
    return {"status": "ok"}


@router.get("/feedback")
async def get_feedback_stats(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    total = await db["feedback"].count_documents({"timestamp": {"$gte": since_ts}})
    positive = await db["feedback"].count_documents(
        {"timestamp": {"$gte": since_ts}, "rating": "up"}
    )
    return {
        "total": total,
        "positive": positive,
        "positive_rate": (positive / total) * 100 if total else 0,
    }


@router.get("/user-engagement")
async def user_engagement(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"type": "login_success", "timestamp": {"$gte": since_ts}}},
        {"$group": {"_id": "$user.id"}},
        {"$count": "unique_users"},
    ]
    agg = [a async for a in db["auth_events"].aggregate(pipeline)]
    unique_users = agg[0]["unique_users"] if agg else 0
    return {"active_users": unique_users}


@router.get("/chat-interactions")
async def chat_interactions(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"type": "rag_response", "timestamp": {"$gte": since_ts}}},
        {"$group": {"_id": "$session_id", "count": {"$sum": 1}}},
        {"$group": {"_id": None, "avg": {"$avg": "$count"}}},
    ]
    agg = [a async for a in db["rag_events"].aggregate(pipeline)]
    avg = agg[0]["avg"] if agg else 0
    return {"avg_followups_per_ticket": avg}


@router.get("/openai-usage")
async def openai_usage(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"type": "rag_response", "timestamp": {"$gte": since_ts}}},
        {"$group": {"_id": None, "calls": {"$sum": "$openai_calls"}}},
    ]
    agg = [a async for a in db["rag_events"].aggregate(pipeline)]
    calls = agg[0]["calls"] if agg else 0
    return {"openai_calls": calls}


@router.get("/data-access")
async def data_access(
    logs_db: Annotated[AsyncIOMotorDatabase, Depends(get_logs_db)], days: int = 7
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"timestamp": {"$gte": since_ts}}},
        {"$group": {"_id": "$resource", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    grouped = [doc async for doc in logs_db["data_access"].aggregate(pipeline)]
    return {"resources": grouped}


@router.get("/resolution-time")
async def average_resolution_time(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    starts = {
        d["ticket_id"]: d["timestamp"]
        async for d in db["ticket_events"].find(
            {"type": "ticket_start", "timestamp": {"$gte": since_ts}},
            projection={"ticket_id": 1, "timestamp": 1, "_id": 0},
        )
    }
    durations = []
    async for closed in db["ticket_events"].find(
        {"type": "ticket_closed", "timestamp": {"$gte": since_ts}},
        projection={"ticket_id": 1, "timestamp": 1, "_id": 0},
    ):
        t_id = closed.get("ticket_id")
        if t_id in starts:
            # FIX: Ensure duration is not negative
            duration = closed["timestamp"] - starts[t_id]
            if duration >= 0:
                durations.append(duration / 3600.0)

    avg_hours = sum(durations) / len(durations) if durations else 0
    return {
        "average_resolution_hours": round(avg_hours, 2),
        "closed_count": len(durations),
    }


@router.get("/first-response-time")
async def average_first_response_time(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {
            "$match": {
                "type": "rag_response",
                "timestamp": {"$gte": since_ts},
                "first_response_ms": {"$ne": None},
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_first_response_ms": {"$avg": "$first_response_ms"},
                "count": {"$sum": 1},
            }
        },
    ]
    agg = [a async for a in db["rag_events"].aggregate(pipeline)]
    avg_ms = agg[0]["avg_first_response_ms"] if agg else 0
    count = agg[0]["count"] if agg else 0
    return {"average_first_response_seconds": (avg_ms or 0) / 1000.0, "samples": count}


@router.get("/ticket-metrics")
async def ticket_metrics(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    total_processed = await db["ticket_events"].count_documents(
        {"timestamp": {"$gte": since_ts}}
    )
    closed = await db["ticket_events"].count_documents(
        {"type": "ticket_closed", "timestamp": {"$gte": since_ts}}
    )
    closure_rate = (closed / total_processed) * 100 if total_processed else 0
    return {
        "closure_rate": closure_rate,
        "processed": total_processed,
        "closed": closed,
    }


@router.get("/priority-distribution")
async def priority_distribution(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
) -> dict[str, Any]:
    latest = await db["ticket_priority_counts"].find_one(sort=[("timestamp", -1)])
    if latest:
        if "_id" in latest:
            latest["_id"] = str(latest["_id"])
    return latest or {"counts": {}}


@router.get("/ai-performance")
async def ai_performance(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"type": "rag_response", "timestamp": {"$gte": since_ts}}},
        {
            "$group": {
                "_id": None,
                "avg_latency": {"$avg": "$latency_ms"},
                "count": {"$sum": 1},
            }
        },
    ]
    agg = [a async for a in db["rag_events"].aggregate(pipeline)]
    avg_latency = agg[0]["avg_latency"] if agg else 0
    count = agg[0]["count"] if agg else 0

    pinecone_pipeline = [
        {"$match": {"type": "rag_response", "pinecone_latency_ms": {"$exists": True}}},
        {
            "$group": {
                "_id": None,
                "avg_pinecone_latency": {"$avg": "$pinecone_latency_ms"},
            }
        },
    ]
    pinecone_agg = [a async for a in db["rag_events"].aggregate(pinecone_pipeline)]
    avg_pinecone_latency = (
        pinecone_agg[0]["avg_pinecone_latency"] if pinecone_agg else None
    )

    return {
        "ai_response_time_ms": avg_latency,
        "responses": count,
        "pinecone_latency_ms": avg_pinecone_latency,
    }


@router.get("/script-stats")
async def script_stats(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    pipeline = [
        {"$match": {"type": "script_execute_success", "timestamp": {"$gte": since_ts}}},
        {"$group": {"_id": "$component_uid", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_scripts = [
        {"component_uid": doc["_id"], "count": doc["count"]}
        async for doc in db["script_events"].aggregate(pipeline)
    ]

    success = await db["script_events"].count_documents(
        {"type": "script_execute_success", "timestamp": {"$gte": since_ts}}
    )
    failure = await db["script_events"].count_documents(
        {"type": "script_execute_failure", "timestamp": {"$gte": since_ts}}
    )
    success_rate = (success / (success + failure)) * 100 if (success + failure) else 0

    return {
        "top_scripts": top_scripts,
        "success_rate": success_rate,
        "success": success,
        "failure": failure,
    }


@router.get("/auth-stats")
async def auth_stats(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)], days: int = 30
) -> dict[str, Any]:
    since_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    success = await db["auth_events"].count_documents(
        {"type": "login_success", "timestamp": {"$gte": since_ts}}
    )
    failure = await db["auth_events"].count_documents(
        {"type": "login_failure", "timestamp": {"$gte": since_ts}}
    )
    rate = (success / (success + failure)) * 100 if (success + failure) else 0
    return {"success": success, "failure": failure, "success_rate": rate}
