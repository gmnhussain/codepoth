"""Width-matched Bangla digits: Noto Sans Bengali shapes, Hind Siliguri widths.

Run from this folder with Python 3 and fontTools (a one-off tool, not a
project dependency; see README.md):

    python -m venv ~/fontvenv          # outside the repository
    ~/fontvenv/Scripts/python -m pip install fonttools brotli   # Windows
    ~/fontvenv/Scripts/python make-digits.py

For each weight it reads `noto-sans-bengali-digits-<weight>.woff2` (the
unmodified Noto subset in this folder) and Hind Siliguri's digits from the
Google Fonts CSS API, then writes `bangla-digits-<weight>.woff2`:

- every digit gets Hind Siliguri's advance width at that weight, with its
  outline centred in it; a digit whose ink would not fit with MIN_SIDE units
  on each side is scaled horizontally just enough to fit (never overhangs);
- the vertical metrics (hhea, OS/2) are Hind Siliguri's, so a line holding
  these digits is as tall as one in Hind alone;
- kerning and shaping tables are dropped (digits need neither), hinting
  instructions too (the outlines changed);
- the name table says "Bangla Digits", not "Noto Sans Bengali": this is a
  Modified Version under the SIL Open Font License (OFL.txt).

bangla-digits.css serves these files by name (README.md).
"""

import io
import re
import urllib.parse
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates

WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold"}
DIGITS = "০১২৩৪৫৬৭৮৯"
FAMILY = "Bangla Digits"
# Smallest side bearing, in font units, for a digit scaled to fit.
MIN_SIDE = 20
# next/font's user agent, so the CSS API answers with woff2 files.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
)
MODIFIED = (
    "Modified from Noto Sans Bengali: Bangla digits only (U+09E6-U+09EF), "
    "advance widths and vertical metrics matched to Hind Siliguri."
)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request) as response:
        return response.read()


def hind_digits(weight: int) -> TTFont:
    """Hind Siliguri cut down to the digits, at one weight."""
    text = urllib.parse.quote(DIGITS)
    css = fetch(
        "https://fonts.googleapis.com/css2?family=Hind+Siliguri:"
        f"wght@{weight}&text={text}"
    ).decode()
    url = re.search(r"url\((https://[^)]+)\)", css).group(1)
    return TTFont(io.BytesIO(fetch(url)))


def match_widths(noto: TTFont, hind: TTFont) -> list[str]:
    scale = noto["head"].unitsPerEm / hind["head"].unitsPerEm
    noto_cmap, hind_cmap = noto.getBestCmap(), hind.getBestCmap()
    glyf, hmtx = noto["glyf"], noto["hmtx"]
    report = []
    for char in DIGITS:
        name = noto_cmap[ord(char)]
        advance = round(hind["hmtx"][hind_cmap[ord(char)]][0] * scale)
        glyph = glyf[name]
        glyph.recalcBounds(glyf)
        x_min, x_max = glyph.xMin, glyph.xMax
        ink = x_max - x_min
        squeeze = min(1.0, (advance - 2 * MIN_SIDE) / ink)
        new_ink = ink * squeeze
        left = (advance - new_ink) / 2
        glyph.coordinates = GlyphCoordinates(
            [((x - x_min) * squeeze + left, y) for x, y in glyph.coordinates]
        )
        glyph.coordinates.toInt()
        glyph.program = ttProgram.Program()
        glyph.program.fromBytecode(b"")
        glyph.recalcBounds(glyf)
        assert glyph.xMin >= 0 and glyph.xMax <= advance, (char, glyph.xMin)
        hmtx[name] = (advance, glyph.xMin)
        report.append(
            f"U+{ord(char):04X} advance {hmtx.metrics[name][0]} ink {ink}"
            f"{f' x{squeeze:.3f}' if squeeze < 1 else ''}"
            f" sides {glyph.xMin}/{advance - glyph.xMax}"
        )
    return report


def copy_vertical_metrics(noto: TTFont, hind: TTFont) -> None:
    scale = noto["head"].unitsPerEm / hind["head"].unitsPerEm
    for table, fields in (
        ("hhea", ("ascent", "descent", "lineGap")),
        (
            "OS/2",
            (
                "sTypoAscender",
                "sTypoDescender",
                "sTypoLineGap",
                "usWinAscent",
                "usWinDescent",
            ),
        ),
    ):
        for field in fields:
            value = getattr(hind[table], field)
            setattr(noto[table], field, round(value * scale))
    use_typo_metrics = 1 << 7
    noto["OS/2"].fsSelection = (noto["OS/2"].fsSelection & ~use_typo_metrics) | (
        hind["OS/2"].fsSelection & use_typo_metrics
    )


def rename(font: TTFont, weight: int) -> None:
    style = WEIGHTS[weight]
    legacy_family = FAMILY if style == "Regular" else f"{FAMILY} {style}"
    postscript = f"BanglaDigits-{style}"
    names = font["name"]
    # Keep the copyright (0) and the licence (13, 14); replace every name
    # that says Noto Sans Bengali.
    for record in list(names.names):
        if record.nameID not in (0, 13, 14):
            names.removeNames(nameID=record.nameID)
    for name_id, value in (
        (1, legacy_family),
        (2, "Regular"),
        (3, f"1.000;{postscript}"),
        (4, f"{FAMILY} {style}"),
        (5, "Version 1.000"),
        (6, postscript),
        (10, MODIFIED),
        (16, FAMILY),
        (17, style),
    ):
        names.setName(value, name_id, 3, 1, 0x409)


def main() -> None:
    for weight in WEIGHTS:
        noto = TTFont(f"noto-sans-bengali-digits-{weight}.woff2")
        hind = hind_digits(weight)
        report = match_widths(noto, hind)
        copy_vertical_metrics(noto, hind)
        for table in ("GPOS", "GSUB", "GDEF", "STAT"):
            if table in noto:
                del noto[table]
        rename(noto, weight)
        noto.flavor = "woff2"
        out = f"bangla-digits-{weight}.woff2"
        noto.save(out)
        print(f"{out}:")
        for line in report:
            print(f"  {line}")


if __name__ == "__main__":
    main()
