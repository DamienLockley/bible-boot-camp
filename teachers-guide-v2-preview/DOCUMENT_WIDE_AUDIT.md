# Teachers’ Guide V2 — Document-Wide Fidelity Audit

**Review audit, not a complete Word-format certification.** This audit examines the current generated `study-data.json` across all 28 studies and the actual converter code provided for V24.14. It does not have raw-byte access to the latest Word master, so it cannot yet identify every native Word table, merged cell, font, footnote or floating illustration. The complete Word master must be inspected before final publication.

## Confirmed root cause

The current converter iterates Word tables as a flat list of cell paragraphs, then serializes them as generic text units. It does **not** preserve the table container, grid dimensions, merged-cell spans or borders/shading. It also calls `clean(p.text)`, normalizing all whitespace and discarding run-level bold/italic/colour/highlight and individual hyperlink formatting. Word-style numbering, indentation, table row layout and paragraphs inside cells are not faithfully represented in the website JSON.

The original Word-to-PDF export can preserve those features, but the website cannot reproduce them after they have been thrown away by the converter. This requires a structural converter upgrade, not CSS tweaks to individual studies.

## Survey of existing generated content

- **28 studies**, **2378 serialized teaching units**, **20 image occurrences**, and **31 explicitly marked question units**.
- **20** consecutive-short-unit sequences across **11** studies flagged for review. These sequences are **not all confirmed tables**; many are legitimate lists, notes or diagrams.
- **Confirmed tables:** two comparisons in *1844*, from the provided Word screenshot: Daniel 2/7/8 (24 cells) and Daniel 9/8/7 (6 cells). Recreated as actual tables **only in the isolated V2 preview**, retaining every original cell's text.
- **Likely review targets:** *Antichrist* (God/Dragon comparisons, divided kingdoms and historical citations); *Health* (clean/unclean categories); *The Godhead* (Jehovah/Jesus attributes); *The Nature of Man* (diagram/equation); plus several teaching sequences and numbered lists.

## Candidate sequences — verify against Word source

| Study | Serialized units (zero-based) | Example | Audit status |
|---|---:|---|---|
| 1. The Word of God | 3–9 | CLAIMS · 2 Tim 3:16 · All · Gob Breathed/from God(Divine) · 2 Pet 1:19-21 | Check original table/list/diagram formatting |
| 1. The Word of God | 25–33 | Seven predictive elements of Daniel 2. · A metal man that’s crushed by a stone · #1 Medo-Persia conquered Babylon. 539BC · #2 Gree… | Check original table/list/diagram formatting |
| 2. The Great Controversy | 63–69 | If NO isn’t an option, YES means nothing. · LOVE requires FREEDOM { chinese election} · FREEDOM involves RISK { teenager with keys… | Check original table/list/diagram formatting |
| 4. The Sanctuary | 63–69 | (7) The Table of Showbread · (6) The Golden Altar of Incense · (5) 1st Apartment The Holy place · (4) The Golden Candlestick · (3)… | Check original table/list/diagram formatting |
| 7. Antichrist | 27–47 | The Free Dictionary by Farlex · anti- · prefix · 1. against; opposing · 2. opposite to | Check original table/list/diagram formatting |
| 7. Antichrist | 63–71 | God has a throne (Rev 3: 21; 20: 11). · The Dragon has a throne (Rev 2: 13). · God has wrath (Rev 14: 19). · The dragon has wrath … | Check original table/list/diagram formatting |
| 7. Antichrist | 117–122 | In summary we find the successive empires of: · Babylon. · Medo- Persia. · Greece. · Rome. | Check original table/list/diagram formatting |
| 7. Antichrist | 184–203 | Visigoths · Spain · Anglo-Saxons · England · Franks | Check original table/list/diagram formatting |
| 7. Antichrist | 338–347 | A little Horn. · Among them. · Plucked. · Eyes. · Mouth. | Check original table/list/diagram formatting |
| 8. The Seventy Week Prophecy | 13–18 | To finish the transgression. · To make an end of sins. · To make reconciliation for iniquity. · To bring in everlasting righteousn… | Check original table/list/diagram formatting |
| 9. Historicity of Jesus | 47–52 | FIVE POINTS OF CALVANISM · T total depravity · U unconditional election∞∞∞∞∞ · L limited atonement · I irresistible | Check original table/list/diagram formatting |
| 11. 1844 | 30–37 | Books in heaven: · Revelation 3: 5. · Revelation 20: 12. · Revelation 21: 27. · Malachi 3: 16. | Check original table/list/diagram formatting |
| 11. 1844 | 47–72 | Part two: (1844 controversy)? · Daniel 2 · Daniel 7 · Daniel 8 · Babylon | Table structure confirmed within this sequence |
| 11. 1844 | 75–80 | Daniel 9 · Daniel 8 · Daniel 7 · Sacrifice · Priest | Table structure confirmed within this sequence |
| 16. The Nature of Man | 7–13 | DUST · + SPIRIT · = A LIVING SOUL · Or we could write it out like this: · ELEMENTS OF THE EARTH | Check original table/list/diagram formatting |
| 21. The Remnant Church | 60–66 | Acts 15 · True believers worship in all churches: · John 4:23, 24 · Amos 3:7 · John 16:13 | Check original table/list/diagram formatting |
| 24. Health | 3–11 | New Start acronym: · Nutrition · Exercise · Water · Sunlight | Check original table/list/diagram formatting |
| 24. Health | 36–43 | Land Animals · Sea Animals · Flying Animals · Split Hoof · Chews the Cud | Check original table/list/diagram formatting |
| 24. Health | 62–69 | Old Testament: Hebrew · יַיִן [yayin /yah·yin/] · Wine · New Testament: Greek · οἶνος [oinos /oy·nos/] | Check original table/list/diagram formatting |
| 26. The Godhead | 39–45 | Jehovah Is Jesus is · Glory (Isa. 42:8) Glory (Matt. 16:27) · Creator (Isa. 40:28) Creator (Eph. 3:9) · Redeemer (Isa. 33:22) Rede… | Check original table/list/diagram formatting |

## Mandatory Word-to-website and PDF support

1. Keep the full original Word paragraphs in their existing reading order; no silent rewriting or deleting of supplemental information.
2. Convert real `w:tbl` elements to structured table JSON: explicit row arrays, header rows, grid-cell widths, vertical/horizontal merges, shading and paragraph content within each cell. Render responsive HTML tables with horizontal scrolling only on small screens.
3. Preserve runs and inline styles: bold, italics, underline, colour/highlight, scripture hyperlinks, small caps, superscripts and endnotes where present.
4. Preserve Word lists, numbering, nested headings, illustrations and grouped diagrams. A numbered list must remain a list, not a series of unmarked paragraphs.
5. Separate main teaching, spiritual applications and named question-indexed supplementary topics using explicit Word styles, never hardcoded unit indices.
6. Produce a consistent editable Word master and per-study PDFs with styled headings, tables, readable typography, page numbers and an appropriate share title. Main study PDFs should retain the agreed teaching content, and substantial supplements should be kept accessible rather than discarded.
7. Build-time checks: reject invalid/missing Word stage markers, truncated tables, empty table cells unexpectedly lost, missing images, broken references, differences in source-unit counts, broken PDF splits and changed appendix coverage.
8. Visual regression testing: render the PDFs for **all 28** studies and compare representative tables/figures/highlights against Word; check both desktop and mobile HTML.

## Scope currently completed

- Confirmed root cause in the supplied converter.
- Exhaustive scan of the **existing flat site JSON** for the 28 studies and the candidate sequences above.
- Two 1844 comparison tables recovered in the review-only HTML presentation; the source JSON, original Word and published PDFs are unchanged.
- A styled one-page V2 Word/PDF layout demonstration has been created separately for review.

## Still required before a claim of complete document-wide fidelity

A raw copy of the latest **Teachers’ Guide Word master** (the source file used by Website Manager V24.14 or newer). Only that file can prove the exact native table inventory, merged cells, shading, screenshots, hyperlinks, drawings and objects throughout the 188-page source. The current scanned PDF/JSON representation cannot fully recover those semantics by itself. A V2 converter should then be tested against the actual master and rechecked after adding/editing content.
