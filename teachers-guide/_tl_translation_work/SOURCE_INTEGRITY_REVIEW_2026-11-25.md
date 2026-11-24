# Tagalog Teachers' Guide V2 — Source integrity review (25 November 2026)

Status: **review only; do not publish**.

## Confirmed translation inventory
- 28 translated studies; 2,662 units; main/supplementary order and Scripture metadata preserved.
- 28 supplementary GTKJ-linked lesson sections translated.
- 17 optional Daniel teaching-context passages translated (first pass).
- 17 image positions preserved.
- Tagalog Word master and HTML review are already generated. Existing PDF files remain English and must not be labelled Tagalog.

## Eight source-truncation findings (confirmed against current English JSON)
The gaps are **already present in the English source** `teachers-guide/main-pathway-enrichments.json`; they are not introduced by translation.

| Source study_id (zero-based) | Display study | Field | English text cut off at |
|---|---|---|---|
| 6 | 7 — Antichrist | Daniel context 0 spiritual_application | `Historical identification should` |
| 10 | 11 — 1844 | Daniel context 0 history_or_interpretation | `The beginning of the final heave` |
| 11 | 12 — America in Bible Prophecy | Daniel context 0 history_or_interpretation | `AD 538,` |
| 11 | 12 — America in Bible Prophecy | Daniel context 0 spiritual_application | `Historical identification should` |
| 12 | 13 — The Blue Stone | Daniel context 0 spiritual_application | `Historical identification should` |
| 13 | 14 — The Sabbath | Daniel context 0 spiritual_application | `Historical identification should` |
| 16 | 17 — The Mark of the Beast | Daniel context 0 spiritual_application | `Historical identification should` |
| 17 | 18 — The Millennium | Daniel context 0 spiritual_application | `Preparation for the final conflict is not an effort to b` |

## Safe remediation
1. Recover authoritative untruncated Daniel source excerpts, respecting the project's approved Bible/EGW/SISS source restrictions and without inventing missing words.
2. Repair English draft enrichment passages first, then faithfully translate only the recovered endings into Tagalog draft enrichment data.
3. Regenerate the unpublished Tagalog review outputs, recalculate `translation-audit.json`, compare exact Scripture targets/order/images/stage boundaries, and confirm no residual English in the UI.
4. Visually review on phone and desktop. Do not regenerate/label English PDFs as Tagalog. No `teachers-guide/tl/` public deployment without approval.

**Important:** Do not copy the incomplete passages into live English Word masters as supposed complete text. Existing deployed English Teachers' Guide is unaffected by this review note.
