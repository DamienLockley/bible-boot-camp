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

Existing heading, text, verse, question and answer paragraphs stay intact. The user can add, remove or reorder ordinary content inside a stage; no renumbering or special tags are needed. A Word style is enough. Existing embedded images stay adjacent to their paragraphs. All original source paragraphs remain in their original order in Scrollable Reference and full PDF exports.

## Converting Word to the website
1. Parse the Word document in paragraph/table/image order, as currently, including its existing `Heading 1` study boundaries.
2. Recognise the new TG styles and generate a **structured teaching JSON** with `core_stages`, `supplement_topics`, `application`, `response`, and `all_source_units`.
3. Never generate stage groupings by hardcoded unit numbers after the Word master is styled. New source units naturally remain with their styled stage.
4. Stage and question labels come from the Word paragraph text; teachers can rename them in Word without modifying code.
5. Core and supplementary sections are **navigation categories**, not deletion rules. Supplemental material must be fully available in Scrollable Reference and the original PDF.
6. Explicit question/answer paragraphs must remain paired if navigating by stage.
7. Read existing `Purpose:` and `Centred/Centered on:` text for backward compatibility. New TG styles should supersede that convention only where added.
8. Proposed content gets reviewed before being inserted; preserve exactly the old teaching paragraphs until approved.

## Validation and safety gates
- Every study's source paragraphs and images have one-to-one coverage in `all_source_units`; compare counts before and after.
- Every core and supplementary stage has a title; no empty stages or orphan-answer headings.
- A source change that invalidates a stage marker is a **clear build error** with study name and location, never a silent truncation.
- Verify original reference patterns, KJV popovers, answer reveals, image navigation, scripture verse lists and PDF sharing.
- The manager must build in a separate temporary staging directory, verify, then atomically replace **only generated files** in a selected **Desktop Test** or **explicitly selected** repository destination.
- The manager must not delete original Word files, manually edited HTML, assets or unrelated projects; maintain backups and compare changes to detect regressions.
- Test a study with added, deleted, inserted and moved teaching items, questions and images to ensure no stale index references.
- Test all 28 studies, especially Sanctuary core/supplement split, long Antichrist material, Sabbath and Mark of the Beast appendices, and the two proposed introductions.
- Keep the approved preview on its own branch until a deliberate merge/deployment decision.

## Content review before integrating
The file `CONTENT_REVIEW.md` documents each proposed application/response and all topics. Review those first, along with question grouping and disputed placements (e.g. the final paragraphs of Historicity of Jesus and 1844's second part). Historical quotations and dated claims are source material, not yet independently re-verified.

## Why we use a separate map during the preview
It allows us to change the learning experience now **without touching the live site's content or Word master**. After approval the reviewed labels and optional teacher prompts can be embedded with simple Word styles **once**, and the manager/converter can be updated **once** to honour them on every regeneration.
