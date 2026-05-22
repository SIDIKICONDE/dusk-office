from dusk_office.color import contrast_ratio_hex, luminance_from_hex, parse_hex_color, solid_hex


def test_parse_short_hex():
    rgb = parse_hex_color("#abc")
    assert rgb is not None
    assert (rgb.r, rgb.g, rgb.b) == (0xAA, 0xBB, 0xCC)


def test_contrast_black_on_white():
    assert contrast_ratio_hex("#000000", "#ffffff") == 21.0


def test_solid_hex_strips_alpha():
    assert solid_hex("#ff000080") == "#ff0000"


def test_luminance_dark_vs_light():
    assert luminance_from_hex("#000000") < luminance_from_hex("#ffffff")
