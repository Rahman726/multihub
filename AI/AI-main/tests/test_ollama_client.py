import io
import json
import urllib.error
from unittest import mock

from buffy.ollama_client import OllamaClient


class FakeResponse:
    """Mimics the HTTPResponse returned inside a `with urlopen(...) as r` block."""

    def __init__(self, lines):
        self._buf = io.BytesIO(b"\n".join(lines))

    def read(self, n=-1):
        return self._buf.read(n)

    def __iter__(self):
        return iter(self._buf.read(-1).splitlines())

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_list_models_parses_tags():
    client = OllamaClient()
    payload = json.dumps(
        {"models": [{"name": "qwen2.5-coder:7b"}, {"name": "llama3:8b"}]}
    ).encode()
    with mock.patch(
        "urllib.request.urlopen", return_value=FakeResponse([payload])
    ):
        models = client.list_models()
    assert models == ["qwen2.5-coder:7b", "llama3:8b"]


def test_is_running_false_when_down():
    client = OllamaClient()
    with mock.patch("urllib.request.urlopen", side_effect=urllib.error.URLError("nope")):
        assert client.is_running() is False


def test_chat_accumulates_stream():
    client = OllamaClient()
    lines = [
        json.dumps({"message": {"content": "Hel"}, "done": False}).encode(),
        json.dumps({"message": {"content": "lo"}, "done": True}).encode(),
    ]
    with mock.patch("urllib.request.urlopen", return_value=FakeResponse(lines)):
        resp = client.chat([{"role": "user", "content": "hi"}])
    assert resp.content == "Hello"
    assert resp.done


def test_chat_parses_tool_calls():
    client = OllamaClient()
    tc = {"function": {"name": "read_file", "arguments": {"path": "a.py"}}}
    lines = [
        json.dumps({"message": {"content": "", "tool_calls": [tc]}, "done": True}).encode(),
    ]
    with mock.patch("urllib.request.urlopen", return_value=FakeResponse(lines)):
        resp = client.chat([])
    assert resp.tool_calls[0].name == "read_file"
    assert resp.tool_calls[0].arguments == {"path": "a.py"}
