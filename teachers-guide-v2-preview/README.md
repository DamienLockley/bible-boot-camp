# Teachers' Guide V2 — Independent Review Preview

**Review branch:** `teachers-guide-v2-review-20261124`
**Deployment:** None. This branch is NOT the website's `main` branch.
**Do not rebuild or publish the existing live Teachers' Guide from this prototype.**

## What is ready
- 28 unchanged studies read directly from `../teachers-guide/study-data.json`.
- **92** suggested core teaching stages, grouped into natural blocks rather than one paragraph at a time.
- **63** suggested supplementary question/topic entries (the 1844 comparison is now one intact table-containing section); major appendices including Antichrist are divided into navigable questions.
- Simplified **Main Study**, **Scriptures**, **Share**, **Home**, **Links**, and **Help / Connect** controls. Main Study includes all core content and individually accessible supplementary topics; a duplicate Scrollable Reference mode has been removed.
- Teacher-only *proposed* spiritual application and response prompt for every study.
- Proposed introductions for the two studies currently missing them.
- Clickable King James Version references using the existing Teachers' Guide parsing logic and the original KJV JSON.
- Study library with search and optional alphabetical or original ordering.
- Compact search **inside study content** with matched passages grouped beneath their study title.
- Proposed GTKJ teaching additions integrated into **92 main pathway stages**, clearly marked for review (source: GTKJ revised depth readings).
- Optional contextual explanations and spiritual applications from Daniel; 81 grounded Daniel/Revelation links across 28 studies.
- Two recovered 1844 comparison tables in responsive HTML, without modifying source content.
- No study-order requirements, accounts or student tracking.

## How to view without affecting the live site
1. In **GitHub Desktop**, switch `bible-boot-camp` to the review branch `teachers-guide-v2-review-20261124` (do not merge it).
2. Open the Website Manager and choose **Teachers' Guide → Run Local Site → GitHub Repository**. This starts a local web server from your repository root.
3. In the browser, open **http://127.0.0.1:8000/teachers-guide-v2-preview/**.
4. When reviewing is finished, switch GitHub Desktop back to **main**. No push to main is required.

Alternatively, from the repository folder run `python -m http.server 8000`, then open the same local URL. A `file://` browser tab is not sufficient because this preview fetches JSON files.

If the manager shows a regular Teachers' Guide rather than V2, use the exact local preview URL above. The manager is not yet modified to generate V2.

## Content source and safety
Original study units and the Bible verse lists are read directly from the existing published-site source files. The review branch adds only files under `teachers-guide-v2-preview/`. **It does not replace the Word master, the main Teachers' Guide HTML, study-data.json, PDFs, images, converter or manager.**

The PDF shared by the current preview is still the **existing published PDF**, not the new V2 typeset PDF (which must be generated and verified from the revised Word master). An independent one-page DOCX/PDF layout sample has been produced for review.

The original source may contain historical quotations, argumentation, and dates. Their inclusion in the preview is **not a separate source-validation exercise**. All teaching labels and newly written spiritual prompts need content approval before we integrate into Word and manager.

The review files:
- `index.html`: responsive prototype
- `teaching-map.json`: editable stage and appendix/question mapping
- `CONTENT_REVIEW.md`: content-led review of all 28 studies
- `related-study-resources.json`: study-specific GTKJ references, Daniel and Revelation scene links
- `main-pathway-enrichments.json`: proposed GTKJ main-pathway explanations and Daniel contextual notes
- `main-historical-notes.json`: nine targeted historical/prophetic and spiritual-application notes, with source references and review labels
- `table-layouts.json`: two temporary 1844 table recovery overlays (the final converter must read actual Word table grids)
- `DOCUMENT_WIDE_AUDIT.md`: 28-study formatting/fidelity risk audit
- `validate_teaching_map.py`: source mapping integrity test

## Future integration (after review)
1. Agree on stage boundaries, labels, appendix questions and teacher prompts.
2. Add stable explicit markers or a separate well-defined teaching map to the Word authoring/build process.
3. Change the manager and converter together so editing paragraphs or images never silently corrupts stage mapping; fail the build safely on invalid markers.
4. Test all 28 studies, KJV links, answer reveals, image groups, Bible verse views, PDFs, mobile layout and regeneration twice.
5. Only then consider merging approved changes for publishing.

**No live files have been changed by this preview.**
