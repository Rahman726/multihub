"""buffy CLI — a Codex-like coding agent powered by local Ollama models."""

from .agent import Agent
from .ollama_client import OllamaClient, OllamaError
from . import tools

__all__ = ["Agent", "OllamaClient", "OllamaError", "tools"]
