"""Command-line interface: interactive REPL plus one-shot mode."""

from __future__ import annotations

import sys
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

from ..agent import Agent
from ..ollama_client import OllamaClient, OllamaError
from .. import tools as T

console = Console()
BANNER = r"""
  ____  _   _ ____  _____ ____
 |  _ \| | | | __ )|  ___/ ___|
 | |_) | | | |  _ \| |_ | |
 |  _ <| |_| | |_) |  _|| |___
 |_| \_\\___/|____/|_|   \____|
  local coding agent (Ollama)
"""

# Slash commands shown in help.
HELP_TEXT = """\
[bold]Commands[/bold]
  /help          Show this help
  /model         Pick a different Ollama model
  /clear         Reset conversation history
  /history       Show message count in context
  /auto <tool>   Pre-approve a tool for this session (e.g. /auto run_command)
  /tools         List available agent tools
  /exit          Quit (or Ctrl+D / Ctrl+C)
"""


def pick_model(client: OllamaClient) -> str:
    models = client.list_models()
    if not models:
        console.print("[red]No models installed. Try: ollama pull qwen2.5-coder:7b[/red]")
        sys.exit(1)
    console.print("[bold]Installed models:[/bold]")
    for i, m in enumerate(models, 1):
        console.print(f"  {i}. {m}")
    choice = console.input("Select model [1]: ").strip()
    try:
        return models[max(0, int(choice) - 1)]
    except ValueError:
        return models[0]


def run_turn(agent: Agent, user_input: str) -> None:
    """Run one agent turn with live output rendering."""
    from rich.live import Live
    from rich.text import Text

    buf: list[str] = []
    live = Live(console=console, refresh_per_second=12, transient=True)
    live.start()
    try:
        agent.events.on_text = lambda t: buf.append(t)
        agent.events.on_tool_start = lambda name, args: (
            live.update(Text(f"-> {name} {args}", style="cyan"))
        )
        agent.events.on_tool_result = lambda name, r: (
            live.update(Text(f"<- {name}: {r.output[:200]}", style="dim"))
        )
        reply = agent.run(user_input)
    finally:
        agent.events.on_text = None
        live.stop()
    if buf:
        console.print(Markdown("".join(buf)))
    if reply and reply not in ("(no response)",):
        console.print()
    if reply.startswith("(") or reply.startswith("["):
        console.print(f"[yellow]{reply}[/yellow]")


def start_repl(agent: Agent) -> None:
    console.print(HELP_TEXT)
    while True:
        try:
            user_input = console.input("[bold green]you> [/bold green]").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]bye![/dim]")
            break
        if not user_input:
            continue
        if user_input.startswith("/"):
            cmd, _, arg = user_input.partition(" ")
            if cmd == "/exit":
                console.print("[dim]bye![/dim]")
                break
            elif cmd == "/help":
                console.print(HELP_TEXT)
            elif cmd == "/model":
                agent.client.model = pick_model(agent.client)
                console.print(f"[green]model = {agent.client.model}[/green]")
            elif cmd == "/clear":
                agent.messages = agent.messages[:1]
                console.print("[green]context cleared[/green]")
            REPL_IMPLS.get(cmd, lambda a, x: None)(agent, arg)
            continue
        run_turn(agent, user_input)


REPL_IMPLS = {
    "/history": lambda a, _: console.print(
        f"{len(a.messages)} messages in context"
    ),
    "/tools": lambda a, _: console.print(
        "\n".join(f"  • {n}" for n in T.TOOL_IMPLS)
    ),
    "/auto": lambda a, tool: (
        a.auto_approve.add(tool.strip()),
        console.print(f"[green]auto-approved '{tool.strip()}' for this session[/green]"),
    ),
}


@click.group()
def app() -> None:
    """Buffy — a Codex-like local coding agent."""


@app.command()
@click.argument("prompt", required=False)
@click.option("--model", "-m", default=None, help="Ollama model to use")
@click.option("--auto", is_flag=True, help="Auto-approve all tool calls (careful!)")
def chat(prompt: str | None, model: str | None, auto: bool) -> None:
    """Interactive chat; or run PROMPT once and exit."""
    console.print(f"[bold cyan]{BANNER}[/bold cyan]")
    client = OllamaClient(model=model or "qwen2.5:7b")

    if not client.is_running():
        console.print(
            "[red]Ollama is not running.[/red] Start it with `ollama serve` "
            "and install a model, e.g. `ollama pull qwen2.5-coder:7b`."
        )
        sys.exit(1)

    if model is None and prompt is None:
        client.model = pick_model(client)

    auto_approve = set(T.TOOL_IMPLS) if auto else set()
    agent = Agent(client, console, auto_approve=auto_approve)
    agent.events.on_tool_start = lambda name, args: console.print(
        f"  [cyan]→ {name}[/cyan] {json_dump_args(args)}"
    )

    if prompt:
        run_turn(agent, prompt)
    else:
        start_repl(agent)


def json_dump_args(args: dict) -> str:
    import json

    return json.dumps(args, ensure_ascii=False)[:160]


@app.command()
@click.argument("path", default=".")
def explore(path: str) -> None:
    """List a project directory tree (what the agent can see)."""
    result = T.list_dir(path)
    console.print(result.output)


if __name__ == "__main__":
    app()
