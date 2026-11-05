"""Built-in tools the agent can use: reading, writing, shell, git."""

from __future__ import annotations

import fnmatch
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Callable

# Tools that touch the world outside the sandbox and need user approval.
APPROVAL_REQUIRED = {"run_command", "write_file", "edit_file", "apply_patch"}
MAX_FILE_BYTES = 256 * 1024  # refuse to dump huge files into context
MAX_LINES = 400

IGNORED_DIRS = {
    ".git", "__pycache__", "node_modules", ".venv", "venv",
    ".mypy_cache", ".pytest_cache", "dist", "build", ".idea", ".vscode",
}

# Matches .gitignore-style lines loosely; enough for context listing.
GITIGNORE_CACHE: dict[Path, list[str]] = {}


class ToolResult:
    def __init__(self, output: str, is_error: bool = False, needs_approval: bool = False):
        self.output = output
        self.is_error = is_error
        self.needs_approval = needs_approval


def _load_gitignore(dir_path: Path) -> list[str]:
    if dir_path in GITIGNORE_CACHE:
        return GITIGNORE_CACHE[dir_path]
    patterns: list[str] = []
    gi = dir_path / ".gitignore"
    if gi.is_file():
        try:
            for line in gi.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line)
        except OSError:
            pass
    GITIGNORE_CACHE[dir_path] = patterns
    return patterns


def _is_ignored(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    parts = rel.parts
    if any(p in IGNORED_DIRS for p in parts):
        return True
    for parent in (root, *rel.parents):
        for pattern in _load_gitignore(parent):
            base = pattern.rstrip("/")
            if fnmatch.fnmatch(parts[-1], base) or fnmatch.fnmatch(str(rel), base):
                return True
            if any(fnmatch.fnmatch(p, base) for p in parts):
                return True
    return False


# ---------- tool implementations ----------

def list_dir(path: str = ".") -> ToolResult:
    """List a directory, respecting .gitignore-ish rules."""
    p = Path(path).resolve()
    root = Path.cwd()
    if not p.exists():
        return ToolResult(f"error: {p} does not exist", is_error=True)
    if p.is_file():
        return ToolResult(str(p))
    try:
        entries = sorted(p.iterdir(), key=lambda e: (e.is_file(), e.name.lower()))
    except OSError as exc:
        return ToolResult(f"error: {exc}", is_error=True)

    lines = []
    for entry in entries[:500]:
        if _is_ignored(entry, root):
            continue
        marker = "/" if entry.is_dir() else ""
        size = f" ({entry.stat().st_size} B)" if entry.is_file() else ""
        lines.append(f"{entry.name}{marker}{size}")
    return ToolResult("\n".join(lines) or "(empty directory)")


def read_file(path: str, offset: int = 1, limit: int = MAX_LINES) -> ToolResult:
    """Read a text file, optionally a window of lines."""
    p = Path(path)
    if not p.is_absolute():
        p = Path.cwd() / p
    p = p.resolve()
    if not p.exists() or not p.is_file():
        return ToolResult(f"error: file not found: {path}", is_error=True)
    try:
        if p.stat().st_size > MAX_FILE_BYTES:
            return ToolResult(
                f"error: file too large ({p.stat().st_size} bytes). "
                "Read a line range instead.",
                is_error=True,
            )
        text = p.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return ToolResult(f"error: {exc}", is_error=True)
    lines = text.splitlines()
    start = max(1, offset)
    window = lines[start - 1 : start - 1 + max(1, limit)]
    numbered = "\n".join(f"{start + i:6}\t{line}" for i, line in enumerate(window))
    header = f"# {p.name} ({len(lines)} lines total)"
    if len(lines) > len(window):
        header += f" — showing {start}–{start + len(window) - 1}"
    return ToolResult(f"{header}\n{numbered}")


def write_file(path: str, content: str) -> ToolResult:
    """Create or overwrite a file (approval handled by the agent loop)."""
    p = Path(path)
    if not p.is_absolute():
        p = Path.cwd() / p
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    except OSError as exc:
        return ToolResult(f"error: {exc}", is_error=True)
    n = len(content.splitlines())
    return ToolResult(f"wrote {path} ({n} lines)")


def edit_file(path: str, old_string: str, new_string: str) -> ToolResult:
    """Replace an exact string in a file. old_string must be unique."""
    p = Path(path)
    if not p.is_absolute():
        p = Path.cwd() / p
    if not p.exists():
        return ToolResult(f"error: file not found: {path}", is_error=True)
    try:
        text = p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        return ToolResult(f"error: {exc}", is_error=True)
    count = text.count(old_string)
    if count == 0:
        return ToolResult(
            f"error: old_string not found in {path}. Read the file again "
            "and copy the exact text including whitespace.",
            is_error=True,
        )
    if count > 1:
        return ToolResult(
            f"error: old_string appears {count} times in {path}; "
            "make it unique or use write_file.",
            is_error=True,
        )
    p.write_text(text.replace(old_string, new_string, 1), encoding="utf-8")
    return ToolResult(f"edited {path}")


def run_command(command: str, timeout: int = 120) -> ToolResult:
    """Run a shell command and return combined output."""
    try:
        proc = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return ToolResult(f"error: command timed out after {timeout}s", is_error=True)
    out = (proc.stdout or "") + (proc.stderr or "")
    out = out.strip() or "(no output)"
    if len(out) > 10_000:
        out = out[:10_000] + "\n... (truncated)"
    prefix = "" if proc.returncode == 0 else f"[exit {proc.returncode}] "
    return ToolResult(prefix + out, is_error=proc.returncode != 0)


def git_status() -> ToolResult:
    return run_command("git status --short --branch", timeout=15)


def git_diff() -> ToolResult:
    return run_command("git diff", timeout=15)


def search_code(pattern: str, path: str = ".") -> ToolResult:
    """Regex search across text files in a directory tree."""
    import re

    root = Path(path).resolve()
    if not root.exists():
        return ToolResult(f"error: {path} does not exist", is_error=True)
    try:
        rx = re.compile(pattern)
    except re.error as exc:
        return ToolResult(f"error: bad regex: {exc}", is_error=True)

    matches: list[str] = []
    try:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if _is_ignored(fpath, Path.cwd()):
                    continue
                try:
                    if fpath.stat().st_size > MAX_FILE_BYTES:
                        continue
                    text = fpath.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    continue
                for i, line in enumerate(text.splitlines(), 1):
                    if rx.search(line):
                        matches.append(f"{fpath.relative_to(root)}:{i}: {line.strip()[:200]}")
                        if len(matches) >= 80:
                            break
                if len(matches) >= 80:
                    break
            if len(matches) >= 80:
                break
    except OSError as exc:
        return ToolResult(f"error: {exc}", is_error=True)
    if not matches:
        return ToolResult(f"no matches for /{pattern}/")
    return ToolResult("\n".join(matches) + ("\n... (more truncated)" if len(matches) >= 80 else ""))


# ---------- tool registry exposed to the model ----------

TOOL_IMPLS: dict[str, Callable[..., ToolResult]] = {
    "list_dir": list_dir,
    "read_file": read_file,
    "write_file": write_file,
    "edit_file": edit_file,
    "search_code": search_code,
    "run_command": run_command,
    "git_status": git_status,
    "git_diff": git_diff,
}

TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "List files and folders in a directory of the user's project.",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Directory path, default '.'"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a text file with line numbers, optionally a window of lines.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "offset": {"type": "integer", "description": "1-indexed start line"},
                    "limit": {"type": "integer", "description": "How many lines (default 400)"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Create or completely overwrite a file with new content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Replace one exact, unique occurrence of old_string with new_string in a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "old_string": {"type": "string"},
                    "new_string": {"type": "string"},
                },
                "required": ["path", "old_string", "new_string"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_code",
            "description": "Regex search for a pattern across the project's text files.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string"},
                    "path": {"type": "string", "description": "Directory to search, default '.'"},
                },
                "required": ["pattern"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Run a shell command in the project directory and return its output.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "timeout": {"type": "integer", "description": "Seconds before timeout (max 300)"},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "git_status",
            "description": "Show git status of the current project.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "git_diff",
            "description": "Show uncommitted changes as a diff.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def execute_tool(name: str, arguments: dict[str, Any]) -> ToolResult:
    """Dispatch a tool call. Unknown tools return an error result."""
    impl = TOOL_IMPLS.get(name)
    if impl is None:
        return ToolResult(f"error: unknown tool '{name}'", is_error=True)
    try:
        return impl(**arguments)
    except TypeError as exc:
        return ToolResult(f"error: bad arguments for {name}: {exc}", is_error=True)
