# Color Palette & Font — "PGO - Academic Prestige" Theme

Extracted from `assets/template.pptx` → `ppt/theme/theme1.xml` (`<a:clrScheme name="PGO - Academic Prestige">`).
This is the **authoritative source** — if a chart or shape needs a hex value, use one of these, don't invent new colors.

## Background + Text

| Role | Hex | Use |
|---|---|---|
| Background 1 (lt1) | `F8F9FC` | Default light slide background |
| Text 1 (dk1) | `071C33` | Primary text on light backgrounds |
| Background 2 (lt2) | `EEF3F8` | Secondary/alternate background |
| Text 2 (dk2) | `0D315A` | Secondary dark text / navy panels |

## Accent Colors

| Role | Hex | Typical use |
|---|---|---|
| Accent 1 | `0B3A6F` | Primary brand navy — titles, headers, primary chart series |
| Accent 2 | `C99B43` | Gold — highlights, accent lines, secondary series |
| Accent 3 | `E0C06C` | Light gold — tertiary series, soft highlights |
| Accent 4 | `AFC0D6` | Light blue-gray — muted bars, gridlines-adjacent fills |
| Accent 5 | `D8DEE8` | Pale gray-blue — card backgrounds, subtle dividers |
| Accent 6 | `6D7F95` | Slate gray — captions, muted labels, 4th+ chart series |

## Links

| Role | Hex |
|---|---|
| Hyperlink | `1C5F9E` |
| Followed hyperlink | `8A6A2E` |

## Font

| Script | Typeface | Notes |
|---|---|---|
| Korean (Hangul) | **함초롬바탕** | Set on the `ea` (East Asian) field of every run/theme font. This is the exact Hancom font name — do not substitute "맑은 고딕" or "Noto Sans KR". |
| English / Latin | **Calibri** | Set on the `latin` (and `cs`) field. |

Both are already wired into `theme1.xml`'s `fontScheme` (`majorFont`/`minorFont`) and into `slideMaster1.xml`'s placeholder defaults, so any text typed into a placeholder inherits the right font automatically. Only set `<a:latin>`/`<a:ea>`/`<a:cs>` explicitly on a run if you're overriding size/weight and want to be safe — never introduce a different typeface.

## Chart color order (matplotlib/seaborn/pptxgenjs)

```python
PALETTE = ["#0B3A6F", "#C99B43", "#6D7F95", "#AFC0D6", "#E0C06C", "#D8DEE8"]
```

Use Accent 1 (navy) as the primary series always; don't default to blue-for-everything — vary using Accent 2/6 for comparison series.
