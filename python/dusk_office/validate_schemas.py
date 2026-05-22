#!/usr/bin/env python3
"""Pydantic schema validation for Dusk Office themes (complements validate-themes.mjs)."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from dusk_office.color import HEX_COLOR

REQUIRED_COLOR_KEYS = [
    "editor.background",
    "editor.foreground",
    "focusBorder",
    "activityBar.background",
    "sideBar.background",
    "statusBar.background",
    "titleBar.activeBackground",
    "list.activeSelectionBackground",
    "list.activeSelectionForeground",
    "editor.selectionBackground",
    "editorCursor.foreground",
    "editorLineNumber.activeForeground",
    "editorSuggestWidget.border",
    "editorHoverWidget.border",
    "terminal.background",
    "terminal.foreground",
    "diffEditor.border",
    "notebook.cellBorderColor",
]

REQUIRED_TOKEN_SCOPES = [
    "comment",
    "keyword",
    "string",
    "constant.numeric",
    "entity.name.function",
    "entity.name.type",
]

REQUIRED_SEMANTIC_KEYS = [
    "variable",
    "function",
    "keyword",
    "string",
    "number",
    "type",
]

LEGACY_EXTENSION_BUTTON_FG = "#22d3ee"
LEGACY_EXTENSION_BUTTON_BG = "#06b6d433"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


class ThemeContribution(BaseModel):
    label: str
    path: str
    uiTheme: str | None = None


class PackageManifest(BaseModel):
    contributes: dict[str, Any]

    @property
    def themes(self) -> list[ThemeContribution]:
        raw = self.contributes.get("themes")
        if not isinstance(raw, list):
            raise ValueError("package.json: contributes.themes missing or invalid")
        return [ThemeContribution.model_validate(item) for item in raw]


class ThemeDocument(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str = Field(min_length=1)
    include: str | None = None
    colors: dict[str, str] | None = None
    tokenColors: list[dict[str, Any]] | None = None
    semanticTokenColors: dict[str, Any] | None = None

    @field_validator("colors")
    @classmethod
    def validate_color_values(cls, colors: dict[str, str] | None) -> dict[str, str] | None:
        if colors is None:
            return colors
        for key, value in colors.items():
            if not isinstance(value, str) or not HEX_COLOR.match(value):
                raise ValueError(f"colors[{key!r}] is not a valid hex color: {value!r}")
        return colors


def read_theme(path: Path) -> ThemeDocument:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path}: invalid JSON — {exc}") from exc
    try:
        return ThemeDocument.model_validate(data)
    except ValidationError as exc:
        raise ValueError(f"{path}: {exc}") from exc


def resolve_include_chain(path: Path, chain: set[str] | None = None) -> None:
    chain = chain or set()
    rel = path.as_posix()
    if rel in chain:
        raise ValueError(f"Circular include chain: {' → '.join([*chain, rel])}")
    chain.add(rel)
    theme = read_theme(path)
    if theme.include:
        parent = (path.parent / theme.include).resolve()
        if not parent.is_file():
            raise ValueError(f"{path}: include not found — {theme.include}")
        resolve_include_chain(parent, chain)


def merge_effective_colors(path: Path, chain: set[str] | None = None) -> dict[str, str]:
    chain = chain or set()
    rel = path.as_posix()
    if rel in chain:
        raise ValueError(f"Circular include chain: {' → '.join([*chain, rel])}")
    chain.add(rel)
    theme = read_theme(path)
    base: dict[str, str] = {}
    if theme.include:
        parent = (path.parent / theme.include).resolve()
        base = merge_effective_colors(parent, chain)
    merged = {**base, **(theme.colors or {})}
    return merged


def validate_root_theme_requirements(path: Path) -> None:
    theme = read_theme(path)
    if theme.include:
        return

    colors = theme.colors or {}
    missing_colors = [key for key in REQUIRED_COLOR_KEYS if key not in colors]
    if missing_colors:
        raise ValueError(f"{path}: missing required color keys: {', '.join(missing_colors)}")

    token_scopes: set[str] = set()
    for rule in theme.tokenColors or []:
        scope = rule.get("scope")
        if isinstance(scope, str):
            token_scopes.add(scope)
        elif isinstance(scope, list):
            token_scopes.update(str(item) for item in scope)

    missing_scopes = [scope for scope in REQUIRED_TOKEN_SCOPES if scope not in token_scopes]
    if missing_scopes:
        raise ValueError(f"{path}: missing required token scopes: {', '.join(missing_scopes)}")

    semantic = theme.semanticTokenColors or {}
    missing_semantic = [key for key in REQUIRED_SEMANTIC_KEYS if key not in semantic]
    if missing_semantic:
        raise ValueError(f"{path}: missing required semantic token keys: {', '.join(missing_semantic)}")


def assert_extension_button_legible(path: Path, label: str) -> None:
    colors = merge_effective_colors(path)
    fg = colors.get("extensionButton.prominentForeground")
    bg = colors.get("extensionButton.prominentBackground")
    if bg == LEGACY_EXTENSION_BUTTON_BG:
        raise ValueError(
            f"{label} ({path}): extensionButton.prominentBackground must not remain {LEGACY_EXTENSION_BUTTON_BG}"
        )
    if fg == LEGACY_EXTENSION_BUTTON_FG:
        raise ValueError(
            f"{label} ({path}): extensionButton.prominentForeground must not remain {LEGACY_EXTENSION_BUTTON_FG}"
        )


def validate_palettes_extended_ui(path: Path) -> None:
    if not path.is_file():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path}: root must be an object")
    for variant_id, palette in data.items():
        if not isinstance(palette, dict):
            raise ValueError(f"{path}: palette {variant_id!r} must be an object")
        for key, value in palette.items():
            if not isinstance(value, str) or not HEX_COLOR.match(value):
                raise ValueError(f"{path}: {variant_id}[{key!r}] invalid hex color: {value!r}")


def validate_all(root: Path) -> int:
    pkg_path = root / "package.json"
    manifest = PackageManifest.model_validate(json.loads(pkg_path.read_text(encoding="utf-8")))
    themes = manifest.themes
    if not themes:
        raise ValueError("package.json: contributes.themes is empty")

    seen: set[str] = set()
    for theme in themes:
        full = (root / theme.path).resolve()
        if not full.is_file():
            raise ValueError(f"Theme file not found: {theme.path}")
        key = full.relative_to(root).as_posix()
        if key in seen:
            raise ValueError(f"Duplicate theme path: {key}")
        seen.add(key)
        resolve_include_chain(full)
        validate_root_theme_requirements(full)
        assert_extension_button_legible(full, theme.label)

    validate_palettes_extended_ui(root / "scripts" / "palettes-extended-ui.json")

    themes_dir = root / "themes"
    for path in sorted(themes_dir.glob("dusk*.json")):
        key = path.relative_to(root).as_posix()
        if key not in seen and path.name != "dusk.json":
            print(f"WARN theme not listed in package.json: {key}", file=sys.stderr)

    print(f"OK {len(themes)} Marketplace themes validated (Pydantic)")
    return len(themes)


def main(argv: list[str] | None = None) -> int:
    root = repo_root()
    try:
        validate_all(root)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
