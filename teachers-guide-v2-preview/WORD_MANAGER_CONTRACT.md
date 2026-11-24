# Teachers’ Guide V2 — Word Master and Manager Integration Contract

**Status:** proposed design contract, for review. **Do not apply to live or existing Word master yet.**

## Main principle
The current `teaching-map.json` uses original zero-based unit indexes solely for the isolated UI review. This must **not** be the permanent Word-to-HTML contract: adding or removing paragraphs would shift indexes. The production converter must derive the sections afresh from explicit human-readable Word styles and fail safely when its structure is inconsistent.

## Suggested friendly Word styles
| Word paragraph style | What the author sees/does | Converter behaviour |
| --- | --- | --- |
| **Heading 1** | Existing study title; unchanged | Starts a study, generates title and stable study identity |
| **TG Stage** | Short stage title inserted before connected paragraphs | Starts a core Guided Teaching stage |
| **TG Extra** | A human question such as “What does Acts 20:7 mean?” | Starts optional supplementary/defence/apologetics topic; stays searchable |
| **TG Purpose** | One-paragraph purpose (or current `Purpose:` statement) | Shows study purpose, not an extra teaching step |
| **TG Central Truth** | Key Christ-centred truth (or `Centred on:`) | Displays at the top of the study |
| **TG Application** | Short explanation of personal significance | Teacher-only reflective guidance; voluntary |
| **TG Response** | One open, non-coercive invitation/question | Teacher-only closing prompt; voluntary |

Existing heading, text, verse, question and answer paragraphs stay intact. The user can add, remove or reorder ordinary content inside a stage; no renumbering or special tags are needed. A Word style is enough. Existing embedded images stay adjacent to their paragraphs. All original source paragraphs remain accessible in **Main Study** (core and named supplementary topics) and in full PDF exports.

## Converting Word to the website
1. Parse the Word document in paragraph/table/image order, as currently, including its existing `Heading 1` study boundaries.
2. Recognise the new TG styles and generate a **structured teaching JSON** with `core_stages`, `supplement_topics`, `application`, `response`, and `all_source_units`.
3. Never generate stage groupings by hardcoded unit numbers after the Word master is styled. New source units naturally remain with their styled stage.
4. Stage and question labels come from the Word paragraph text; teachers can rename them in Word without modifying code.
5. Core and supplementary sections are **navigation categories**, not deletion rules. Supplemental material must be fully available through question-indexed **Explore Deeper** topics and the full Word/PDF exports.
6. Explicit question/answer paragraphs must remain paired if navigating by stage.
7. Read existing `Purpose:` and `Centred/Centered on:` text for backward compatibility. New TG styles should supersede that convention only where added.
8. Proposed content gets reviewed before being inserted; preserve exactly the old teaching paragraphs until approved.

## Validation and safety gates
- Every study's source paragraphs and images have one-to-one coverage in `all_source_units`; compare counts before and after.
- Every core and supplementary stage has a title; no empty stages or orphan-answer headings.
- A source change that invalidates a stage marker is a **clear build error** with study name and location, never a silent truncation.
- Verify original reference patterns, KJV popovers, answer reveals, image navigation, scripture verse lists, compact cross-study word search and PDF sharing.
- The manager must build in a separate temporary staging directory, verify, then atomically replace **only generated files** in a selected **Desktop Test** or **explicitly selected** repository destination.
- The manager must not delete original Word files, manually edited HTML, assets or unrelated projects; maintain backups and compare changes to detect regressions.
- Test a study with added, deleted, inserted and moved teaching items, questions and images to ensure no stale index references.
- Test all 28 studies, especially Sanctuary core/supplement split, long Antichrist material, Sabbath and Mark of the Beast appendices, and the two proposed introductions.
- Keep the approved preview on its own branch until a deliberate merge/deployment decision.

## Content review before integrating
The file `CONTENT_REVIEW.md` documents each proposed application/response and all topics. Review those first, along with question grouping and disputed placements (e.g. the final paragraphs of Historicity of Jesus and 1844's second part). Historical quotations and dated claims are source material, not yet independently re-verified.

## Why we use a separate map during the preview
It allows us to change the learning experience now **without touching the live site's content or Word master**. After approval the reviewed labels and optional teacher prompts can be embedded with simple Word styles **once**, and the manager/converter can be updated **once** to honour them on every regeneration.

## Additional requirements established by V2 review

- **Main Study** is the teacher's complete reading interface. Remove the duplicate Scrollable Reference button, but **never remove reference or appendix content**.
- Give teacher-friendly quick access to **Home**, **Main Study**, **Scriptures**, **Share**, **Links**, **Help / Connect**. The text search is compact and searches words **inside** all studies with passage snippets grouped beneath the study title.
- **GTKJ main-pathway enrichment**: use good existing GTKJ teaching points, real-life questions and explanations to strengthen the principal stages, without replacing or reducing the original teacher material. Proposed additions must be distinguishable during review.
- **Daniel and Revelation enrichment**: add precise historical context, timelines, named people, distinctions between biblical text/historicist interpretation, and deeper applications where they clarify core doctrine; move lengthy supporting analysis to Explore Deeper. Validate destination anchors before committing.
- **Structural preservation**: the converter must recognize real Word tables, merged cells, inline bold/italics/shading, highlighted passages, lists, images, text boxes or shapes, scripture links and question/answer groupings; flattened table-cell paragraphs are not acceptable.
- **High quality shareable PDF**: use the new structured Word master as the primary source for a professional, readable per-study PDF with true tables, images, suitable headings and footers, page breaks and coherent supplementary sections. The website's Share action must serve that newly generated PDF after visual QA, not silently continue serving an older incompatible PDF.
- **Document-wide audit**: verify all 28 Word studies before migration. See `DOCUMENT_WIDE_AUDIT.md`; the 20 serialized list/table candidate sequences are only a preliminary scan until the exact current Word master is available for OOXML inspection.
