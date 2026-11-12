---
name: hallym-edu-pptx
description: Create educational PowerPoint presentations for Hallym University Business School using Professor Hwang Hyunseok's (황현석) branded template — navy/gold "Academic Prestige" theme, 함초롬바탕/Calibri fonts. Covers title, agenda/TOC, general content, section-break, and closing slide types, plus integrating Python/R analysis results (ML/DL/statistics/visualization) with practical-implications framing for students and practitioners.
---

# Hallym University Educational Presentation Creator

Create professional educational PowerPoint presentations for Hallym University Business School, branded for Professor Hwang Hyunseok (한림대학교 경영학과 황현석 교수), by **editing the real template deck's XML** — not by generating HTML/CSS slides. This preserves the template's background artwork, gradients, and decorative graphics pixel-for-pixel, which an HTML-to-PPTX conversion cannot reproduce.

## Before anything else

Read `/mnt/skills/public/pptx/SKILL.md` in full — this skill is a thin, branded layer on top of it. Everything about `add_slide.py`, `clean.py`, `validate.py`, converting to images, and QA applies here unchanged.

## The template

`assets/template.pptx` is the source of truth for design. It has exactly 5 slides — one example of each slide type this skill produces:

| # | Slide type | File | Layout used |
|---|---|---|---|
| 1 | Title | `ppt/slides/slide1.xml` | 제목 슬라이드 (slideLayout1) |
| 2 | Agenda / TOC | `ppt/slides/slide2.xml` | Title and Content 1 (slideLayout2) |
| 3 | General content | `ppt/slides/slide3.xml` | Title and Content 2 (slideLayout3) |
| 4 | Section break | `ppt/slides/slide4.xml` | Section Header 1 (slideLayout4) |
| 5 | Closing / Thank you | `ppt/slides/slide5.xml` | Thank You (slideLayout6) |

Each slide currently holds bracketed Korean placeholder text (e.g. `[프레젠테이션 제목]`, `[핵심 메시지 1: 분석 결과 또는 주요 내용을 입력하세요]`) — replace these, never delete or restructure the shapes around them.

**Fixed content — do not change:**
- Slide 1 subtitle: `한림대학교 황현석`
- Slide 5 contact block: `황현석` / `hshwang@hallym.ac.kr` / `Hallym Univ.`
- Slide footers: `한림대학교 경영학과`

**Design reference (not part of the deliverable deck):** the original uploaded template also contained a "Color Palette & Font" slide and a template-credit FAQ slide. Those were stripped out of `assets/template.pptx` (they're not real content slides) but their information is captured in `references/color-palette.md` — read it before touching colors or fonts.

## Quick Start Workflow

### Step 1: Understand the presentation requirements

Ask about (or infer from context):
- Topic, objective, and audience (학생 / 실무자 / 임원)
- Number of agenda sections and content slides needed
- Whether Python/R analysis results (ML/DL/statistics/visualization/optimization) need to be integrated
- Whether the talk has multiple sections (→ needs Section Break slides between them)

### Step 2: Read required resources

1. `/mnt/skills/public/pptx/SKILL.md` — the template-editing workflow (`add_slide.py`, `clean.py`, `validate.py`)
2. `references/color-palette.md` — exact hex values and font rules; **always** read before creating charts or touching any color
3. If Python/R results are involved: `references/python-r-integration.md`

### Step 3: Plan the deck

Outline: title, agenda items, one section break + a run of content slides per section, closing. Match slide type to content — don't force everything onto "general content"; use section breaks to signal a topic change, exactly like the template demonstrates.

### Step 4: Build the deck from the template

```bash
# Work in a scratch dir, keep assets/template.pptx untouched
cp assets/template.pptx work.pptx
python3 -c "import zipfile; zipfile.ZipFile('work.pptx').extractall('unpacked')"

# Duplicate slides for however many of each type you need.
# add_slide.py copies the SOURCE slide's content verbatim — do structural
# work (all duplication) BEFORE editing any text.
python scripts/add_slide.py unpacked/ slide3.xml --after slide3.xml   # another content slide
python scripts/add_slide.py unpacked/ slide4.xml --after slide6.xml  # another section break
# ... repeat as needed, then reorder via <p:sldIdLst> in ppt/presentation.xml if needed

# Now edit text in each ppt/slides/slideN.xml — replace bracketed placeholders only
# (see "Editing text safely" below)

python scripts/clean.py unpacked/     # drop anything orphaned by reordering
(cd unpacked && rm -f ../out.pptx && zip -Xr ../out.pptx .)
python scripts/office/validate.py out.pptx --original assets/template.pptx
```

(`scripts/add_slide.py`, `scripts/clean.py`, `scripts/office/validate.py`, `scripts/office/soffice.py` are the ones from `/mnt/skills/public/pptx/scripts/` — call them by that path, or copy them alongside `work.pptx` for shorter commands.)

### Step 5: Editing text safely

- Parse with `defusedxml.minidom` if scripting the edits — never round-trip through `xml.etree.ElementTree` (it rewrites namespace prefixes and corrupts OOXML).
- Replace only the text inside `<a:t>` nodes. Keep every `<a:r>`/`<a:rPr>` wrapper as-is so the font (함초롬바탕/Calibri per `references/color-palette.md`), size, and color survive untouched.
- One `<a:p>` per bullet point — never cram two ideas into one paragraph with a line break.
- If a content slide needs more or fewer bullets than the 2–3 the template ships with, copy/remove sibling `<a:p>` blocks (matching `<a:pPr>`) rather than editing bullet count via other means.
- The page-number placeholders (`<a:fld type="slidenum">`) recompute automatically — never hand-edit the visible digit inside them.
- Footer/date placeholders (`[날짜]`, `한림대학교 경영학과`) — replace `[날짜]` with the actual date if the user gives one; otherwise leave the bracket (visible placeholder beats a wrong guessed date).

### Step 6: Integrating Python/R analysis results

See `references/python-r-integration.md` for full examples (feature importance, confusion matrix, ROC curve, distribution plots) and `scripts/export_analysis_results.py` for structuring a multi-section analysis narrative before you build slides. Key rules:
- Save all plots at 300 DPI.
- Use the palette in `references/color-palette.md` — Accent 1 (`#0B3A6F`) as the primary series color, never a default matplotlib blue.
- Every analysis/content slide should carry **practical implications**, not just numbers: pair each chart with 1–2 bullets translating the result into a managerial policy, feature-importance takeaway, or field-actionable recommendation — this is the standard the professor's audiences (학생/현장 실무자) expect.

## QA (required — same as the base pptx skill)

```bash
markitdown out.pptx | grep -iE "\[.*(제목|메시지|주제|섹션|날짜|입력)|lorem|ipsum|TODO"
```
Any hit means a bracket placeholder or template lorem-ipsum survived — fix before delivering.

```bash
python scripts/office/validate.py out.pptx --original assets/template.pptx
```

Then convert to images and eyeball every slide (see `/mnt/skills/public/pptx/SKILL.md` → Converting to Images / Visual QA) — check especially:
- Text overflow where placeholder text was replaced with something longer
- Section-break and title slides: the graduation-cap artwork and diagonal navy/gold panel must stay untouched (these come from the slide layout background, not something you should ever redraw)
- Fonts rendering as Calibri (Latin) / 함초롬바탕 (Hangul) — if the sandbox substitutes a fallback font in the LibreOffice preview, that's expected (함초롬바탕 isn't installed here); trust the XML, not the preview glyphs

## Resources

- **Template deck**: `assets/template.pptx` — 5 slide types, ready to duplicate/edit
- **Color & font reference**: `references/color-palette.md`
- **Python/R integration guide**: `references/python-r-integration.md`
- **Analysis-structure export utility**: `scripts/export_analysis_results.py`
- **Base PPTX skill**: `/mnt/skills/public/pptx/SKILL.md`

## Quality Checklist

Before finalizing, verify:

- [ ] Title slide: real title filled in, subtitle still exactly `한림대학교 황현석`
- [ ] No bracketed placeholder (`[...]`) or lorem-ipsum text remains anywhere
- [ ] Section breaks used between topic shifts, not just piled-up content slides
- [ ] Every analysis/content slide pairs data with a practical-implications bullet
- [ ] Colors used are all from `references/color-palette.md` — no invented hex values
- [ ] Closing slide contact block unchanged: `황현석` / `hshwang@hallym.ac.kr` / `Hallym Univ.`
- [ ] `validate.py --original assets/template.pptx` passes
- [ ] Visual QA done on every slide (background art intact, no overflow/overlap)
- [ ] File size reasonable (<20MB) — check embedded chart PNGs aren't oversized
