"""The agent loop: system prompt, tool-calling rounds, user approvals."""

from __future__ import annotations

import difflib
import json
import subprocess
from dataclasses import dataclass, field
from typing import Any, Callable

from .ollama_client import ChatResponse, OllamaClient, OllamaError, ToolCall
from . import tools as T

SYSTEM_PROMPT = """\
You are Buffy, an expert coding agent running in the user's terminal.
You help with software engineering tasks: fixing bugs, adding features,
refactoring, and explaining code.

Rules:
1. Explore before acting. Use list_dir / search_code / read_file to understand
   the project before editing anything.
2. Prefer edit_file for small changes; use write_file only for new files or
   full rewrites.
3. After changing code, verify your work when possible (run tests, typecheck
   or the program itself) using run_command.
4. Keep shell commands safe and non-destructive. Never delete data, force-push,
   or touch anything outside this project unless the user asked.
5. When you finish a task, reply with a SHORT summary of what changed and why.
   Do not paste whole files back into chat.
6. If the user's request is ambiguous, ask a brief clarifying question instead
   of guessing.

Current working directory: {cwd}
"""


@dataclass
class AgentEvent:
    """Hook points so the CLI can render the agent's progress."""

    on_text: Callable[[str], None] | None = None
    on_tool_start: Callable[[str, dict], None] | None = None
    on_tool_result: Callable[[str, T.ToolResult], None] | None = None


class ApprovalDenied(Exception):
    pass


def _preview_diff(path: str, old: str, new: str) -> str:
    diff = difflib.unified_diff(
        old.splitlines(), new.splitlines(),
        fromfile=f"{path} (current)", tofile=f"{path} (proposed)", lineterm="",
    )
    lines = list(diff)
    if len(lines) > 120:
        lines = lines[:120] + ["... (diff truncated)"]
    return "\n".join(lines) or "(no changes)"


def _current_text(path: str) -> str:
    from pathlib import Path

    p = Path(path)
    if not p.is_absolute():
        p = Path.cwd() / p
    try:
        return p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def ask_approval(console: Any, description: str, detail: str = "") -> bool:
    """Show what the agent wants to do; return True if the user approves."""
    console.print()
    console.print(f"[bold yellow]? Approval needed[/bold yellow] {description}")
    if detail:
        console.print(detail)
    answer = console.input("[bold yellow]Allow? [y]es / [n]o / [a]lways: [/bold yellow]")
    return answer.strip().lower() in {"y", "yes", "a"}


class Agent:
    def __init__(
        self,
        client: OllamaClient,
        console: Any,
        auto_approve: set[str] | None = None,
    ):
        self.client = client
        self.console = console
        self.messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT.format(cwd=T.Path.cwd())}
        ]
        # Tools the user has pre-approved for the whole session.
        self.auto_approve: set[str] = auto_approve or set()
        self.events = AgentEvent()

    # ---------- approval flow ----------

    def _needs_approval(self, name: str, args: dict[str, Any]) -> tuple[bool, str, str]:
        """Return (needs?, description, detail)."""
        if name == "run_command":
            cmd = args.get("command", "?")
            return True, f"run shell command: [cyan]{cmd}[/cyan]", ""
        if name == "write_file":
            path = args.get("path", "?")
            old = _current_text(path)
            detail = _preview_diff(path, old, args.get("content", ""))
            return True, f"write file [cyan]{path}[/cyan]", detail
        if name == "edit_file":
            path = args.get("path", "?")
            old = _current_text(path)
            old_s = args.get("old_string", "")
            new_s = args.get("new_string", "")
            proposed = old.replace(old_s, new_s, 1) if old_s in old else old + "\n" + new_s
            detail = _preview_diff(path, old, proposed)
            return True, f"edit file [cyan]{path}[/cyan]", detail
        if name == "apply_patch":
            return True, "apply multi-file patch", ""
        return False, "", ""

    def _maybe_approve(self, name: str, args: dict[str, Any]) -> bool:
        if name in self.auto_approve:
            return True
        needs, desc, detail = self._needs_approval(name, args)
        if not needs:
            return True
        if name == "run_command":
            cmd = args.get("command", "?")
            # Read-only git commands are safe.
            if cmd.strip().startswith(("git status", "git diff", "git log")):
                return True
        ok = ask_approval(self.console, desc, detail)
        if ok and self.console.answer_was_always:
            self.auto_approve.add(name)
        return ok

    # ---------- tool execution ----------

    def _run_tool(self, call: ToolCall) -> T.ToolResult:
        name, args = call.name, call.arguments
        if self.events.on_tool_start:
            self.events.on_tool_start(name, args)
        if not self._maybe_approve(name, args):
            raise ApprovalDenied()
        result = T.execute_tool(name, args)
        if self.events.on_tool_result:
            self.events.on_tool_result(name, result)
        return result

    # ---------- main loop ----------

    def run(self, user_input: str, max_rounds: int = 25) -> str:
        """Process one user request through any number of tool rounds."""
        self.messages.append({"role": "user", "content": user_input})
        final_text = ""

        for _ in range(max_rounds):
            try:
                response: ChatResponse = self.client.chat(
                    messages=self.messages,
                    tools=T.TOOL_SCHEMAS,
                    on_text=self.events.on_text,
                )
            except OllamaError as exc:
                return f"[Ollama error] {exc}"

            assistant_msg: dict[str, Any] = {"role": "assistant", "content": response.content}
            if response.tool_calls:
                assistant_msg["tool_calls"] = [
                    {
                        "function": {
                            "name": tc.name,
                            "arguments": tc.arguments,
                        }
                    }
                    for tc in response.tool_calls
                ]
            self.messages.append(assistant_msg)
            final_text = response.content

            if not response.tool_calls:
                return final_text.strip() or "(no response)"

            for tc in response.tool_calls:
                try:
                    result = self._run_tool(tc)
                    content = result.output
                except ApprovalDenied:
                    content = "User DENIED this action. Ask what to do differently."
                self.messages.append(
                    {
                        "role": "tool",
                        "content": content[:8000],
                        "name": tc.name,
                    }
                )

        return "(stopped: too many tool rounds)"
