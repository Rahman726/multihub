"""Allow `python -m buffy` to launch the CLI."""
from .cli.main import app

if __name__ == "__main__":
    app()
