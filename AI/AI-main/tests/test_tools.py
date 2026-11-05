import textwrap

from buffy import tools as T


def test_read_file_and_edit(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "a.txt").write_text("hello\nworld\n")

    r = T.read_file("a.txt")
    assert "hello" in r.output and not r.is_error

    r = T.edit_file("a.txt", "world", "there")
    assert not r.is_error
    assert "there" in (tmp_path / "a.txt").read_text()


def test_edit_file_rejects_ambiguous(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "a.txt").write_text("x = 1\nx = 1\n")
    r = T.edit_file("a.txt", "x = 1", "y = 2")
    assert r.is_error


def test_write_and_read_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    T.write_file("sub/dir/b.txt", "line1\nline2\n")
    assert (tmp_path / "sub" / "dir" / "b.txt").read_text() == "line1\nline2\n"


def test_run_command_output(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    r = T.run_command("echo buffy-test-123")
    assert "buffy-test-123" in r.output


def test_search_code_finds_match(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "code.py").write_text("def my_unique_fn():\n    pass\n")
    r = T.search_code("my_unique_fn")
    assert "code.py" in r.output


def test_unknown_tool(tmp_path):
    r = T.execute_tool("does_not_exist", {})
    assert r.is_error


def test_tool_schemas_valid():
    names = {s["function"]["name"] for s in T.TOOL_SCHEMAS}
    assert names == set(T.TOOL_IMPLS.keys())
