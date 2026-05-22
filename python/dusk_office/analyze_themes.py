#!/usr/bin/env python3
"""Deep contrast, surface, and token coverage analysis for Dusk Office themes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from dusk_office.color import contrast_ratio_hex, luminance_from_hex, solid_hex

BASIC_SEMANTIC = [
    "class",
    "function",
    "variable",
    "keyword",
    "string",
    "comment",
    "number",
    "type",
    "interface",
    "namespace",
]

SKIP_FILES = {"dusk-hc.json"}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def analyze_theme(path: Path, data: dict) -> dict:
    colors = data.get("colors") or {}
    semantic = data.get("semanticTokenColors") or {}
    token_colors = data.get("tokenColors") or []

    name = data.get("name") or path.name
    editor_bg = solid_hex(colors.get("editor.background", "#000"))
    editor_fg = solid_hex(colors.get("editor.foreground", "#fff"))
    sidebar_bg = solid_hex(colors.get("sideBar.background", ""))
    panel_bg = solid_hex(colors.get("panel.background", ""))
    suggest_bg = colors.get("editorSuggestWidget.background")
    hover_bg = colors.get("editorHoverWidget.background")

    theme_type = data.get("type")
    if not theme_type:
        theme_type = "light" if luminance_from_hex(editor_bg) > 0.4 else "dark"

    cr = contrast_ratio_hex(editor_fg, editor_bg)
    sidebar_delta = abs(luminance_from_hex(editor_bg) - luminance_from_hex(sidebar_bg)) if sidebar_bg else 0.0
    panel_delta = abs(luminance_from_hex(editor_bg) - luminance_from_hex(panel_bg)) if panel_bg else 0.0

    semantic_keys = set(semantic.keys())
    has_full_semantic = all(key in semantic_keys for key in BASIC_SEMANTIC)
    missing_tooltips = not suggest_bg or not hover_bg

    strengths: list[str] = []
    issues: list[str] = []

    if cr >= 7:
        strengths.append(f"AAA({cr})")
    elif cr >= 4.5:
        strengths.append(f"AA({cr})")
    else:
        issues.append(f"LOW({cr})")

    if sidebar_delta < 0.005:
        strengths.append("sb=ed")
    elif sidebar_delta > 0.02:
        issues.append(f"sbGap({round(sidebar_delta * 1000) / 10}%)")

    if not missing_tooltips:
        strengths.append("ttSet")
    else:
        issues.append("noTT")

    if has_full_semantic:
        strengths.append("fullSem")
    else:
        issues.append("partSem")

    token_count = len(token_colors)
    if token_count >= 25:
        strengths.append(f"richTM({token_count})")
    elif token_count < 15:
        issues.append(f"sparseTM({token_count})")

    if panel_delta < 0.015:
        strengths.append("panelOk")
    elif panel_delta > 0.03:
        issues.append(f"panelGap({round(panel_delta * 1000) / 10}%)")

    return {
        "name": name,
        "type": theme_type,
        "contrast": cr,
        "issues": issues,
        "strengths": strengths,
        "semantic_count": len(semantic_keys),
        "token_count": token_count,
    }


def run_analysis(themes_dir: Path) -> list[dict]:
    files = sorted(
        path
        for path in themes_dir.glob("*.json")
        if path.name not in SKIP_FILES
    )
    results = []
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        results.append(analyze_theme(path, data))
    results.sort(key=lambda item: (len(item["issues"]), -len(item["strengths"])))
    return results


def status_icon(issue_count: int) -> str:
    if issue_count == 0:
        return "OK"
    if issue_count <= 2:
        return "WARN"
    return "BAD"


def print_report(results: list[dict]) -> None:
    print(f"DEEP ANALYSIS - {len(results)} THEMES\n")
    for item in results:
        issue_count = len(item["issues"])
        icon = status_icon(issue_count)
        print(
            f"{icon} {item['name']} [{item['type']}] "
            f"CR:{item['contrast']} sem:{item['semantic_count']} tm:{item['token_count']}"
        )
        if item["strengths"]:
            print("  + " + " | ".join(item["strengths"]))
        if item["issues"]:
            print("  - " + " | ".join(item["issues"]))

    perfect = sum(1 for item in results if not item["issues"])
    warning = sum(1 for item in results if 0 < len(item["issues"]) <= 2)
    bad = sum(1 for item in results if len(item["issues"]) > 2)
    print(f"\nSUMMARY: OK={perfect} WARN={warning} BAD={bad}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Analyze Dusk Office theme quality metrics.")
    parser.add_argument(
        "--themes-dir",
        type=Path,
        default=repo_root() / "themes",
        help="Directory containing theme JSON files",
    )
    args = parser.parse_args(argv)
    if not args.themes_dir.is_dir():
        parser.error(f"themes directory not found: {args.themes_dir}")
    print_report(run_analysis(args.themes_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
