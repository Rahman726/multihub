"""Client for talking to a local Ollama server (http://localhost:11434)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Iterator

DEFAULT_HOST = "http://localhost:11434"


class OllamaError(Exception):
    """Raised when the Ollama server cannot be reached or errors out."""


@dataclass
class ToolCall:
    """A tool invocation requested by the model."""

    name: str
    arguments: dict[str, Any]


@dataclass
class ChatResponse:
    """One streamed chunk of the assistant's reply."""

    content: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    done: bool = False


class OllamaClient:
    def __init__(self, host: str = DEFAULT_HOST, model: str = "qwen2.5:7b"):
        self.host = host.rstrip("/")
        self.model = model

    # ---------- server helpers ----------

    def is_running(self) -> bool:
        try:
            urllib.request.urlopen(f"{self.host}/api/version", timeout=2)
            return True
        except (urllib.error.URLError, OSError):
            return False

    def list_models(self) -> list[str]:
        """Return installed model names (e.g. 'qwen2.5-coder:7b')."""
        try:
            with urllib.request.urlopen(f"{self.host}/api/tags", timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
            raise OllamaError(f"Could not fetch models from {self.host}: {exc}") from exc
        return [m["name"] for m in data.get("models", [])]

    # ---------- chat ----------

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        on_text: Callable[[str], None] | None = None,
    ) -> ChatResponse:
        """Stream a chat completion. Returns the full final response."""
        payload: dict[str, Any] = {"model": self.model, "messages": messages, "stream": True}
        if tools:
            payload["tools"] = tools

        final = ChatResponse()
        try:
            req = urllib.request.Request(
                f"{self.host}/api/chat",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                for line in resp:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line.decode("utf-8"))
                    except json.JSONDecodeError:
                        continue
                    message = chunk.get("message", {})
                    text = message.get("content", "")
                    if text:
                        if on_text:
                            on_text(text)
                        final.content += text
                    for tc in message.get("tool_calls", []) or []:
                        fn = tc.get("function", {})
                        args = fn.get("arguments", {})
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except json.JSONDecodeError:
                                args = {"_raw": args}
                        final.tool_calls.append(
                            ToolCall(name=fn.get("name", ""), arguments=args)
                        )
                    if chunk.get("done"):
                        final.done = True
        except urllib.error.URLError as exc:
            raise OllamaError(
                f"Lost connection to Ollama at {self.host} ({exc}). Is `ollama serve` running?"
            ) from exc

        return final
