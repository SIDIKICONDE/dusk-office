"""Tests for the Python colour utilities.

Also pins the JS/Python agreement: `HEX_COLOR` (used by pydantic validation) and
`parse_hex_color` must accept exactly the same shapes. They did not — the regex
allowed 4/5/7-digit values that the parser rejects, so a colour could pass
validation and then be silently skipped by every contrast gate.
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dusk_office.color import (  # noqa: E402
    HEX_COLOR,
    Rgb,
    composite,
    contrast_ratio,
    contrast_ratio_hex,
    luminance,
    luminance_from_hex,
    parse_hex_color,
    solid_hex,
)

ACCEPTED = ["#abc", "#ABC", "#a1b2c3", "#abcdef", "#AABBCC", "#abcdef01", "#abcdef80"]
REJECTED = [
    "#ab",  # too short
    "#abcd",  # 4 digits — CSS4 style, not supported by the parser
    "#abcde",  # 5 digits
    "#abcdefa",  # 7 digits
    "#abcdef012",  # 9 digits
    "abcdef",  # no hash
    "#gggggg",  # not hex
    "",  # empty
]


class TestHexValidation:
    @pytest.mark.parametrize("value", ACCEPTED)
    def test_validator_and_parser_agree_on_accepted(self, value: str) -> None:
        assert HEX_COLOR.match(value) is not None
        assert parse_hex_color(value) is not None

    @pytest.mark.parametrize("value", REJECTED)
    def test_validator_and_parser_agree_on_rejected(self, value: str) -> None:
        # This is the regression: the validator used to accept 4/5/7-digit values.
        assert HEX_COLOR.match(value) is None, f"validator wrongly accepts {value!r}"
        assert parse_hex_color(value) is None, f"parser wrongly accepts {value!r}"

    def test_short_form_expands_each_channel(self) -> None:
        parsed = parse_hex_color("#abc")
        assert parsed == Rgb(0xAA, 0xBB, 0xCC)
        assert parsed.alpha is None

    def test_eight_digit_form_keeps_alpha(self) -> None:
        parsed = parse_hex_color("#10203080")
        assert parsed == Rgb(0x10, 0x20, 0x30, "80")

    def test_non_string_input(self) -> None:
        assert parse_hex_color(None) is None
        assert parse_hex_color(123) is None  # type: ignore[arg-type]


class TestSolidHex:
    def test_strips_alpha(self) -> None:
        assert solid_hex("#10203080") == "#102030"

    def test_keeps_six_digit_value_verbatim(self) -> None:
        assert solid_hex("#a1b2c3") == "#a1b2c3"

    def test_expands_three_digit_value(self) -> None:
        assert solid_hex("#abc") == "#aabbcc"

    def test_falls_back_on_unparseable(self) -> None:
        assert solid_hex("nope") == "nope"
        assert solid_hex("") == "#000000"


class TestLuminance:
    def test_white_is_one(self) -> None:
        assert luminance_from_hex("#ffffff") == pytest.approx(1.0)

    def test_black_is_zero(self) -> None:
        assert luminance_from_hex("#000000") == pytest.approx(0.0)

    def test_unparseable_is_zero(self) -> None:
        assert luminance_from_hex("#abcd") == 0.0

    def test_green_dominates_luminance(self) -> None:
        # WCAG weights: 0.2126 R, 0.7152 G, 0.0722 B
        green = luminance(Rgb(0, 255, 0))
        red = luminance(Rgb(255, 0, 0))
        blue = luminance(Rgb(0, 0, 255))
        assert green > red > blue

    def test_matches_the_wcag_reference_formula(self) -> None:
        def reference(channel: float) -> float:
            c = channel / 255
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

        expected = (
            0.2126 * reference(18) + 0.7152 * reference(52) + 0.0722 * reference(86)
        )
        assert luminance(Rgb(18, 52, 86)) == pytest.approx(expected)

    def test_accepts_an_iterable(self) -> None:
        assert luminance((18, 52, 86)) == pytest.approx(luminance(Rgb(18, 52, 86)))


class TestContrastRatio:
    def test_black_on_white_is_twenty_one(self) -> None:
        assert contrast_ratio_hex("#000000", "#ffffff") == pytest.approx(21.0, abs=0.01)

    def test_ratio_is_symmetric(self) -> None:
        a = contrast_ratio_hex("#123456", "#fedcba")
        b = contrast_ratio_hex("#fedcba", "#123456")
        assert a == b

    def test_identical_colors_have_ratio_one(self) -> None:
        assert contrast_ratio(
            luminance_from_hex("#334455"), luminance_from_hex("#334455")
        ) == pytest.approx(1.0)

    def test_is_never_below_one(self) -> None:
        for value in ACCEPTED:
            assert contrast_ratio_hex(value, value) == pytest.approx(1.0)


class TestComposite:
    def test_opaque_foreground_wins(self) -> None:
        out = composite(Rgb(255, 255, 255), 1.0, Rgb(0, 0, 0))
        assert out == Rgb(255, 255, 255)

    def test_transparent_foreground_shows_background(self) -> None:
        out = composite(Rgb(255, 255, 255), 0.0, Rgb(0, 0, 0))
        assert out == Rgb(0, 0, 0)

    def test_half_alpha_is_the_midpoint(self) -> None:
        out = composite(Rgb(255, 255, 255), 0.5, Rgb(0, 0, 0))
        assert out.r == pytest.approx(128, abs=1)

    def test_alpha_is_clamped(self) -> None:
        assert composite(Rgb(255, 0, 0), 2.0, Rgb(0, 0, 0)) == Rgb(255, 0, 0)
        assert composite(Rgb(255, 0, 0), -1.0, Rgb(0, 0, 0)) == Rgb(0, 0, 0)


class TestRegexIsAnchored:
    def test_does_not_match_a_longer_string(self) -> None:
        assert HEX_COLOR.match("#abcdefgh") is None

    def test_does_not_match_a_prefix_of_a_valid_value(self) -> None:
        assert HEX_COLOR.match("#abcdef and more") is None

    def test_is_anchored_at_both_ends(self) -> None:
        assert HEX_COLOR.pattern.startswith("^")
        assert HEX_COLOR.pattern.endswith("$")
        assert re.fullmatch(HEX_COLOR.pattern, "#abcdef") is not None
