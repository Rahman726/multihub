import json

from buffy.agent import Agent
from buffy.ollama_client import ChatResponse, ToolCall
from buffy import tools as T


class FakeClient:
    """Stands in for OllamaClient: scripted responses per round."""

    def __init__(self, script):
        self.script = list(script)
        self.model = "fake"
        self.calls = 0

    def chat(self, messages, tools=None, on_text=None):
        resp = self.script[min(self.calls, len(self.script) - 1)]
        self.calls += 1
        if on_text and resp.content:
            on_text(resp.content)
        return resp


def make_agent(tmp_path, monkeypatch, script):
    monkeypatch.chdir(tmp_path)
    console = type("C", (), {
        "print": staticmethod(lambda *a, **k: None),
        "input": staticmethod(lambda *a, **k: "y"),
        "answer_was_always": False,
    })
    agent = Agent(FakeClient(script), console)
    return agent


def test_agent_runs_tool_and_answers(tmp_path, monkeypatch):
    (tmp_path / "note.txt").write_text("agent-was-here")
    script = [
        ChatResponse(
            content="",
            tool_calls=[ToolCall(name="read_file", arguments={"path": "note.txt"})],
        ),
        ChatResponse(content="The note says agent-was-here"),
    ]
    agent = make_agent(tmp_path, monkeypatch, script)
    reply = agent.run("what does note.txt say?")
    assert "agent-was-here" in reply

    roles = [m["role"] for m in agent.messages]
    assert roles == ["system", "user", "assistant", "tool", "assistant"]


def test_agent_denied_tool(tmp_path, monkeypatch):
    script = [
        ChatResponse(
            content="",
            tool_calls=[ToolCall(name="run_command", arguments={"command": "echo hi"})],
        ),
        ChatResponse(content="Okay, I will not run it."),
    ]

    class DenyConsole:
        def print(self, *a, **k):
            pass

        def input(self, *a, **k):
            return "n"

    monkeypatch.chdir(tmp_path)
    agent = Agent(FakeClient(script), DenyConsole())
    reply = agent.run("run echo hi")
    assert "will not run" in reply
    # the tool message should record the denial
    tool_msgs = [m for m in agent.messages if m["role"] == "tool"]
    assert tool_msgs and "DENIED" in tool_msgs[-1]["content"]


def test_agent_write_file_flow(tmp_path, monkeypatch):
    script = [
        ChatResponse(
            content="",
            tool_calls=[
                ToolCall(
                    name="write_file",
                    arguments={"path": "new.py", "content": "print('hi')\n"},
                )
            ],
        ),
        ChatResponse(content="Created new.py"),
    ]
    agent = make_agent(tmp_path, monkeypatch, script)
    agent.run("create new.py")
    assert (tmp_path / "new.py").read_text() == "print('hi')\n"
