# Ull Hexa Display provenance

Created 2 October 2026 as an original, editable typeface for Ull Hexa. The owner
selected Display as the active direction and subsequently requested archival of
the less refined Text companion. This delivery contains Display Regular and
Bold only. The prior combined source and fonts remain in `Font/Archive/`.
No site-wide or product-wide deployment is implied.

## Design source

- The owner requested a custom font matching Ull Hexa, with future commercial use.
- Brand context was read from `/Users/omapots/.agents/skills/ull-hexa-brand/SKILL.md` and the logo project's `DESIGN_BRIEF.md`.
- The current selected black logo was visually inspected at `Current selected/Current/B&W/Ull_Hexa_sub_black.png`. Its square terminals, broad geometry and U-shaped curves informed the general direction. The logo files were not edited or included in the font.
- All glyph outlines were constructed anew in `source/build_font.py`, using rectangles, polygons, cubic curves, boolean operations and optical spacing. No installed or downloaded typeface was used as an outline source. No logo paths were imported into the font.
- Codex assisted with the design and implementation. This should not be described as an entirely human-designed or hand-drawn typeface. No generative-image, video or audio tool was used.

## Build dependencies

The font binaries contain the project's glyph outlines and OpenType data, not
copies of dependency source code. The libraries are not bundled in this package.
Licence names below were read from the installed package metadata.

| Tool | Version | Role | Licence |
| --- | --- | --- | --- |
| fontTools | 4.66.1 | Construct TTF/WOFF2, compile kerning, export SVG outlines | MIT |
| skia-pathops | 0.9.2 | Union strokes and remove overlapping contours | BSD-3-Clause |
| Brotli | 1.2.0 | Compress WOFF2 | MIT |
| uharfbuzz | 0.56.2 | Validate shaping, kerning and composed accents | Apache-2.0 package; dependencies retain their licences |

The generated preview images use the finished TTF files. System Helvetica is
used only for small review labels, not copied into this font or distributed as
a font file. Pillow is a local rendering dependency for those review images.

## Rights and records

See `COMMERCIAL-USE.txt` for intended permissions and their limits. The creation
workflow avoids dependence on another typeface's desktop/web/app licence. It
does not establish unique copyright or trademark rights by itself.

The relevant OpenAI ownership and similarity provisions were checked in the
[Europe Terms of Use](https://openai.com/policies/eu-terms-of-use/) on 2 October
2026, under “Content”. The applicable service terms still govern the user's
account and use. The [fontTools licence](https://github.com/fonttools/fonttools/blob/main/LICENSE)
is separate from the font asset's usage note.

`source/build-manifest.json` records character coverage, kerning-pair counts and
SHA-256 hashes of each font binary. `qa/validation.json` records the build checks.
`source/glyphs/` contains original editable SVG outlines for both Display weights.
Filenames include a numeric glyph ID so uppercase and lowercase remain distinct
on case-insensitive filesystems.

## Scope and known limits

Display is intended primarily for titles and product names, in Regular and Bold.
Each style has 222 encoded characters, including the
full printable ASCII set, Norwegian letters and selected accented Latin. It is
not a complete pan-European, Greek, Cyrillic or symbol family. The exact coverage
is in the build manifest. Common decomposed accents are checked through HarfBuzz
normalization; arbitrary combining-mark sequences are not supported.

Both weights have proportional letters and tabular lining figures, GPOS and legacy kerning,
and installable embedding enabled. It has no italic, variable-font axes,
TrueType hinting, optical-size masters or exhaustive small-interface tuning.
Display's `I` and lowercase `l` are intentionally simple vertical forms. Font
Book installation, individual DAW/plugin hosts and printed output have not been
tested. The existing selected logo remains the authoritative logo.

## Nordic refinement — version 0.1.1

The owner requested refinement of ÆØÅ, then explicitly requested a filled mark
on Å. Æ/æ were reconstructed as joined letters; Ø/ø received thinner slashes
contained within their outlines; Å/å use a solid round mark. All other glyph
outlines and advances match the earlier build exactly; see
`qa/nordic-regression.json`. The original build is archived in the project.

## Text archival — 2 October 2026

The owner rejected the Text companion after observing visible join artifacts,
thick corner regions and uneven diagonal weight. It is preserved as historical
work, not offered as a current asset. The original build script, fonts, SVGs and
comparison images remain in the archived combined-source snapshot. This active
builder and delivery contain Display only. Display's font binaries are unchanged.
