"""
Nova Orchestrator — LangGraph-based agent with multi-step tool routing.

Architecture:
  1. Retrieve relevant memories (RAG)
  2. Send user message + context to Claude with tool bindings
  3. If Claude requests a tool call → check if confirmation needed → execute → loop
  4. Return final assistant response

The orchestrator is model-agnostic: tool schemas use standard JSON Schema,
and the LLM provider can be swapped by changing the ChatModel initialization.
"""

import logging
import operator
import time
import uuid
from typing import Annotated, Any, Literal, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from app.config import get_settings
from app.database import async_session, log_message, log_tool_call
from app.memory import embed_and_store_message, get_context_for_query
from app.tools.memory_tools import recall, remember
from app.tools.play_media import play_media
from app.tools.run_code import run_code
from app.tools.web_scrape import web_scrape
from app.tools.web_search import web_search

logger = logging.getLogger(__name__)
settings = get_settings()


# ═══════════════════════════════════════════════════════════════
# Tool Definitions (LangChain @tool wrappers)
# ═══════════════════════════════════════════════════════════════

@tool
async def tool_web_search(query: str) -> str:
    """Search the web for current information. Use this when you need up-to-date facts, news, weather, or any real-time data."""
    return await web_search(query)


@tool
async def tool_web_scrape(url: str) -> str:
    """Scrape a specific webpage and extract its text content. Use this to read articles, documentation, or any web page in detail."""
    return await web_scrape(url)


@tool
async def tool_play_media(platform: str, query: str, action: str = "play") -> str:
    """Control media playback. Platforms: 'spotify', 'youtube'. Actions: 'play', 'pause', 'search', 'next', 'previous'."""
    return await play_media(platform, query, action)


@tool
async def tool_run_code(language: str, code: str) -> str:
    """Execute code in a secure sandbox. Currently supports 'python'. Returns stdout, stderr, and exit code. No network access inside the sandbox."""
    result = await run_code(language, code)
    parts = []
    if result.get("stdout"):
        parts.append(f"stdout:\n{result['stdout']}")
    if result.get("stderr"):
        parts.append(f"stderr:\n{result['stderr']}")
    parts.append(f"exit_code: {result.get('exit_code', 1)}")
    parts.append(f"duration: {result.get('duration_ms', 0)}ms")
    return "\n".join(parts)


@tool
async def tool_remember(fact: str, category: str = "general") -> str:
    """Store a fact, preference, or instruction for future reference. Categories: 'general', 'preference', 'fact', 'instruction'."""
    return await remember(fact, category)


@tool
async def tool_recall(query: str) -> str:
    """Search your memory for previously stored facts, preferences, or past interactions relevant to the query."""
    return await recall(query)


# All tools available to the agent
ALL_TOOLS = [
    tool_web_search,
    tool_web_scrape,
    tool_play_media,
    tool_run_code,
    tool_remember,
    tool_recall,
]

# Tools that require user confirmation before execution
CONFIRMATION_REQUIRED = {"tool_play_media", "tool_run_code"}


# ═══════════════════════════════════════════════════════════════
# Agent State
# ═══════════════════════════════════════════════════════════════

class AgentState(TypedDict):
    """State passed through the LangGraph nodes."""
    messages: Annotated[list[BaseMessage], operator.add]
    conversation_id: str
    memory_context: str
    pending_confirmation: dict | None  # Set when a tool needs user approval
    tool_logs: Annotated[list[dict], operator.add]  # Audit log entries


# ═══════════════════════════════════════════════════════════════
# System Prompt
# ═══════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are Nova, a personal AI assistant. You are helpful, concise, and action-oriented.

Your capabilities:
- Search the web for current information
- Scrape and read web pages
- Play music on Spotify or search YouTube
- Execute Python code in a secure sandbox
- Remember and recall facts, preferences, and past interactions

Guidelines:
- Be concise but thorough. Provide direct answers.
- When the user asks you to remember something, use the remember tool.
- Before answering questions about the user's preferences, check your memory with the recall tool.
- When playing media, default to Spotify for music unless the user specifies YouTube.
- For code execution, always explain what the code does before running it.
- If you're unsure about something, search the web.

{memory_context}"""


# ═══════════════════════════════════════════════════════════════
# LLM Initialization
# ═══════════════════════════════════════════════════════════════

def _create_llm() -> ChatAnthropic:
    """Create the LLM instance with tools bound."""
    llm = ChatAnthropic(
        model=settings.llm_model,
        api_key=settings.anthropic_api_key,
        max_tokens=4096,
        temperature=0.7,
    )
    return llm.bind_tools(ALL_TOOLS)


# ═══════════════════════════════════════════════════════════════
# Graph Nodes
# ═══════════════════════════════════════════════════════════════

async def retrieve_memories(state: AgentState) -> dict:
    """Node: Retrieve relevant memories before calling the LLM."""
    messages = state["messages"]

    # Get the last user message
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break

    if not user_message:
        return {"memory_context": ""}

    try:
        async with async_session() as session:
            context = await get_context_for_query(session, user_message)
            return {"memory_context": context}
    except Exception as e:
        logger.warning(f"Failed to retrieve memories: {e}")
        return {"memory_context": ""}


async def agent_node(state: AgentState) -> dict:
    """Node: Call the LLM with messages + memory context."""
    llm = _create_llm()

    # Build system message with memory context
    memory_context = state.get("memory_context", "")
    if memory_context:
        memory_section = f"\n\nRelevant context from your memory:\n{memory_context}"
    else:
        memory_section = ""

    system_msg = SystemMessage(
        content=SYSTEM_PROMPT.format(memory_context=memory_section)
    )

    # Prepend system message to conversation
    messages = [system_msg] + state["messages"]

    # Call the LLM
    response = await llm.ainvoke(messages)

    return {"messages": [response]}


async def check_confirmation(state: AgentState) -> dict:
    """Node: Check if the latest tool call requires user confirmation."""
    messages = state["messages"]
    last_message = messages[-1] if messages else None

    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return {"pending_confirmation": None}

    # Check each tool call for confirmation requirements
    for tc in last_message.tool_calls:
        tool_name = tc["name"]
        if tool_name in CONFIRMATION_REQUIRED:
            return {
                "pending_confirmation": {
                    "tool_call_id": tc["id"],
                    "tool_name": tool_name,
                    "tool_input": tc["args"],
                }
            }

    return {"pending_confirmation": None}


async def execute_tools(state: AgentState) -> dict:
    """Node: Execute tool calls and log results."""
    messages = state["messages"]
    last_message = messages[-1]

    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return {"messages": [], "tool_logs": []}

    tool_node = ToolNode(ALL_TOOLS)
    result = await tool_node.ainvoke({"messages": messages})

    tool_messages = result.get("messages", [])
    tool_logs = []

    # Log each tool execution
    for tc, result_msg in zip(last_message.tool_calls, tool_messages):
        start_time = time.time()
        log_entry = {
            "tool_name": tc["name"],
            "input": tc["args"],
            "output": result_msg.content if isinstance(result_msg, ToolMessage) else str(result_msg),
            "status": "success",
            "duration_ms": int((time.time() - start_time) * 1000),
        }
        tool_logs.append(log_entry)

    return {"messages": tool_messages, "tool_logs": tool_logs}


# ═══════════════════════════════════════════════════════════════
# Routing Logic
# ═══════════════════════════════════════════════════════════════

def should_continue(state: AgentState) -> Literal["check_confirmation", "end"]:
    """Route: Does the LLM want to call a tool, or is it done?"""
    messages = state["messages"]
    last_message = messages[-1] if messages else None

    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "check_confirmation"
    return "end"


def needs_confirmation(state: AgentState) -> Literal["execute_tools", "wait_for_confirmation"]:
    """Route: Does the tool call need user approval?"""
    pending = state.get("pending_confirmation")
    if pending:
        return "wait_for_confirmation"
    return "execute_tools"


# ═══════════════════════════════════════════════════════════════
# Graph Construction
# ═══════════════════════════════════════════════════════════════

def build_graph() -> StateGraph:
    """Build the LangGraph agent graph."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("retrieve_memories", retrieve_memories)
    graph.add_node("agent", agent_node)
    graph.add_node("check_confirmation", check_confirmation)
    graph.add_node("execute_tools", execute_tools)

    # Add edges
    graph.add_edge(START, "retrieve_memories")
    graph.add_edge("retrieve_memories", "agent")
    graph.add_conditional_edges("agent", should_continue, {
        "check_confirmation": "check_confirmation",
        "end": END,
    })
    graph.add_conditional_edges("check_confirmation", needs_confirmation, {
        "execute_tools": "execute_tools",
        "wait_for_confirmation": END,  # Pause and wait for user confirmation
    })
    graph.add_edge("execute_tools", "agent")  # Loop back for multi-step

    return graph


# Compiled graph — reusable across requests
_compiled_graph = None


def get_graph():
    """Get the compiled LangGraph agent."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph().compile()
    return _compiled_graph


# ═══════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════

async def process_message(
    user_message: str,
    conversation_id: str,
    history: list[BaseMessage] | None = None,
) -> dict[str, Any]:
    """
    Process a user message through the Nova orchestrator.

    Args:
        user_message: The user's text input
        conversation_id: UUID of the conversation
        history: Optional list of previous messages for context

    Returns:
        dict with keys: response, tool_calls, pending_confirmation
    """
    graph = get_graph()

    # Build message history
    messages = list(history or [])
    messages.append(HumanMessage(content=user_message))

    # Run the graph
    initial_state: AgentState = {
        "messages": messages,
        "conversation_id": conversation_id,
        "memory_context": "",
        "pending_confirmation": None,
        "tool_logs": [],
    }

    final_state = await graph.ainvoke(initial_state)

    # Extract results
    response_messages = final_state["messages"]
    pending = final_state.get("pending_confirmation")
    tool_logs = final_state.get("tool_logs", [])

    # Get the final assistant message
    assistant_response = ""
    for msg in reversed(response_messages):
        if isinstance(msg, AIMessage) and msg.content and not msg.tool_calls:
            assistant_response = msg.content
            break
        elif isinstance(msg, AIMessage) and msg.content and msg.tool_calls and pending:
            # If we stopped for confirmation, the last AI message has the tool call
            assistant_response = msg.content or "I need your confirmation to proceed."
            break

    # Log to database
    try:
        async with async_session() as session:
            # Log user message
            await log_message(session, uuid.UUID(conversation_id), "user", user_message)

            # Log tool calls
            for tl in tool_logs:
                await log_tool_call(
                    session,
                    uuid.UUID(conversation_id),
                    tool_name=tl["tool_name"],
                    tool_input=tl["input"],
                    tool_output={"result": tl["output"]},
                    status=tl["status"],
                    duration_ms=tl.get("duration_ms"),
                )

            # Log assistant response
            if assistant_response:
                await log_message(
                    session, uuid.UUID(conversation_id), "assistant", assistant_response
                )

            # Embed the user message for future RAG retrieval
            await embed_and_store_message(session, user_message, "user")

            await session.commit()

    except Exception as e:
        logger.error(f"Failed to log conversation: {e}")

    return {
        "response": assistant_response,
        "tool_calls": tool_logs,
        "pending_confirmation": pending,
        "messages": response_messages,  # Full message list for continuing conversation
    }


async def process_confirmation(
    conversation_id: str,
    tool_call_id: str,
    approved: bool,
    history: list[BaseMessage],
) -> dict[str, Any]:
    """
    Process a user's confirmation/denial of a pending tool call.

    If approved, execute the tool and continue the conversation.
    If denied, inform the LLM that the user denied the action.
    """
    if approved:
        # Re-run the graph from the point of tool execution
        graph = get_graph()

        # The last message should be an AIMessage with tool_calls
        # We need to execute those tools and continue
        final_state = await graph.ainvoke({
            "messages": history,
            "conversation_id": conversation_id,
            "memory_context": "",
            "pending_confirmation": None,  # Clear confirmation — allow execution
            "tool_logs": [],
        })

        response_messages = final_state["messages"]
        tool_logs = final_state.get("tool_logs", [])

        assistant_response = ""
        for msg in reversed(response_messages):
            if isinstance(msg, AIMessage) and msg.content and not msg.tool_calls:
                assistant_response = msg.content
                break

        return {
            "response": assistant_response,
            "tool_calls": tool_logs,
            "pending_confirmation": None,
            "messages": response_messages,
        }

    else:
        # User denied — add a tool message indicating denial
        denial_message = ToolMessage(
            content="The user denied this action. Do not retry it. Acknowledge the denial and offer alternatives.",
            tool_call_id=tool_call_id,
        )

        history_with_denial = list(history) + [denial_message]

        return await process_message(
            user_message="",
            conversation_id=conversation_id,
            history=history_with_denial,
        )
