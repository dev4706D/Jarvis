"""
Nova Database Layer — async SQLAlchemy models and helper functions.
Handles conversation logging, tool call auditing, and memory storage.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from app.config import get_settings

settings = get_settings()

# ── Engine & Session ──
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Base Model ──
class Base(DeclarativeBase):
    pass


# ── ORM Models ──
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), default="New Conversation")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    tool_calls = relationship("ToolCall", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")


class ToolCallRecord(Base):
    __tablename__ = "tool_calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"))
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    tool_name = Column(String(100), nullable=False)
    input = Column(JSONB, nullable=False)
    output = Column(JSONB, nullable=True)
    status = Column(String(20), default="pending")
    duration_ms = Column(Integer, nullable=True)
    requires_confirmation = Column(Boolean, default=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="tool_calls")


class Memory(Base):
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    # embedding stored as pgvector VECTOR(1536) — managed via raw SQL for pgvector compatibility
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Helper Functions ──

async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_conversation(session: AsyncSession, title: str = "New Conversation") -> Conversation:
    """Create a new conversation and return it."""
    conv = Conversation(title=title)
    session.add(conv)
    await session.flush()
    return conv


async def log_message(
    session: AsyncSession,
    conversation_id: uuid.UUID,
    role: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> Message:
    """Log a message to a conversation."""
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        metadata_=metadata or {},
    )
    session.add(msg)
    await session.flush()
    return msg


async def log_tool_call(
    session: AsyncSession,
    conversation_id: uuid.UUID,
    tool_name: str,
    tool_input: dict[str, Any],
    tool_output: dict[str, Any] | None = None,
    status: str = "pending",
    duration_ms: int | None = None,
    requires_confirmation: bool = False,
) -> ToolCallRecord:
    """Log a tool call for auditability."""
    record = ToolCallRecord(
        conversation_id=conversation_id,
        tool_name=tool_name,
        input=tool_input,
        output=tool_output,
        status=status,
        duration_ms=duration_ms,
        requires_confirmation=requires_confirmation,
    )
    session.add(record)
    await session.flush()
    return record


async def get_conversation_messages(
    session: AsyncSession,
    conversation_id: uuid.UUID,
    limit: int = 50,
) -> list[Message]:
    """Retrieve messages for a conversation, ordered by creation time."""
    from sqlalchemy import select

    result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_all_preferences(session: AsyncSession) -> dict[str, str]:
    """Get all user preferences as a dictionary."""
    from sqlalchemy import select

    result = await session.execute(select(Preference))
    return {p.key: p.value for p in result.scalars().all()}


async def set_preference(session: AsyncSession, key: str, value: str) -> None:
    """Upsert a user preference."""
    from sqlalchemy.dialects.postgresql import insert

    stmt = insert(Preference).values(key=key, value=value)
    stmt = stmt.on_conflict_do_update(
        index_elements=["key"],
        set_={"value": value, "updated_at": datetime.now(timezone.utc)},
    )
    await session.execute(stmt)
