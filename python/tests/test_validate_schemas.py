import json
from pathlib import Path

import pytest

from dusk_office.validate_schemas import validate_all


def test_validate_all_passes_on_repo():
    root = Path(__file__).resolve().parents[2]
    count = validate_all(root)
    assert count >= 27


def test_invalid_hex_color_rejected(tmp_path: Path):
    theme = {
        "name": "Bad Theme",
        "colors": {"editor.background": "not-a-color"},
    }
    theme_path = tmp_path / "bad.json"
    theme_path.write_text(json.dumps(theme), encoding="utf-8")

    from dusk_office.validate_schemas import read_theme

    with pytest.raises(ValueError, match="valid hex color"):
        read_theme(theme_path)
