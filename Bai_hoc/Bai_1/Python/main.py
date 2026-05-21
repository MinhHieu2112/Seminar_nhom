from __future__ import annotations

import datetime
import logging
from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


logger = logging.getLogger("uvicorn")
logging.basicConfig(level=logging.INFO)


# Application start time for uptime calculations
_START_TIME = datetime.datetime.utcnow()


class RootResponse(BaseModel):
	app: str = Field(..., example="LuxDecor API")
	version: str = Field("0.1.0", example="0.1.0")
	message: str = Field("Welcome to LuxDecor API", example="Welcome to LuxDecor API")


class HealthCheckDetail(BaseModel):
	name: str = Field(..., example="database")
	status: str = Field(..., example="ok")
	details: Optional[str] = Field(None, example="reachable")


class HealthResponse(BaseModel):
	status: str = Field(..., example="ok")
	uptime_seconds: float = Field(..., example=12.34)
	timestamp: datetime.datetime
	checks: List[HealthCheckDetail] = Field(default_factory=list)


class ItemCreate(BaseModel):
	name: str = Field(..., example="Decorative Vase")
	description: Optional[str] = Field(None, example="Handmade ceramic vase")
	price: Optional[float] = Field(None, example=29.99)


class Item(ItemCreate):
	id: int = Field(..., example=1)
	created_at: datetime.datetime


app = FastAPI(
	title="LuxDecor Example API",
	version="0.1.0",
	description="Minimal FastAPI app with root and health endpoints",
)

# Configure CORS
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
	logger.info("Starting LuxDecor Example API")


@app.on_event("shutdown")
async def _shutdown() -> None:
	logger.info("Shutting down LuxDecor Example API")


@app.get("/", response_model=RootResponse, summary="Root endpoint")
async def root() -> RootResponse:
	"""Root endpoint that returns basic app info."""
	return RootResponse(app="LuxDecor API", version=app.version, message="Welcome to LuxDecor API")


def _perform_health_checks() -> List[HealthCheckDetail]:
	# Placeholders for real checks (DB, cache, external services).
	# Replace or extend these checks in a real application.
	checks: List[HealthCheckDetail] = [
		HealthCheckDetail(name="application", status="ok", details="running"),
	]
	return checks


@app.get("/health", response_model=HealthResponse, summary="Health check")
async def health() -> HealthResponse:
	"""Simple health check endpoint returning overall status and per-check details."""
	now = datetime.datetime.utcnow()
	uptime = (now - _START_TIME).total_seconds()
	checks = _perform_health_checks()
	overall = "ok"
	for c in checks:
		if c.status.lower() != "ok":
			overall = "degraded"
			break

	return HealthResponse(status=overall, uptime_seconds=uptime, timestamp=now, checks=checks)


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=False)


# In-memory items store (simple, not persistent)
_items_db: Dict[int, Item] = {}
_next_item_id = 1


@app.post("/items", response_model=Item, status_code=status.HTTP_201_CREATED, summary="Create item")
async def create_item(payload: ItemCreate) -> Item:
	"""Create an item in the in-memory store."""
	global _next_item_id
	now = datetime.datetime.utcnow()
	item = Item(id=_next_item_id, created_at=now, **payload.dict())
	_items_db[_next_item_id] = item
	_next_item_id += 1
	return item


@app.get("/items", response_model=List[Item], summary="List items")
async def list_items() -> List[Item]:
	"""Return all items in the in-memory store."""
	return list(_items_db.values())


@app.get("/items/{item_id}", response_model=Item, summary="Get item")
async def get_item(item_id: int) -> Item:
	item = _items_db.get(item_id)
	if not item:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
	return item


@app.put("/items/{item_id}", response_model=Item, summary="Update item")
async def update_item(item_id: int, payload: ItemCreate) -> Item:
	item = _items_db.get(item_id)
	if not item:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
	updated = item.copy(update={**payload.dict()})
	_items_db[item_id] = updated
	return updated


@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete item")
async def delete_item(item_id: int) -> None:
	if item_id not in _items_db:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
	del _items_db[item_id]
	return None

