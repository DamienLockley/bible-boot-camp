TEACHERS’ GUIDE V2 — PUBLISHED WEBSITE
=====================================

TAGALOG EDITION — LIVE CONTENT REVIEW (25 NOVEMBER 2026)
------------------------------------------------------
- Separate Tagalog site: teachers-guide/tl/index.html
- 28 translated studies, 17 image positions and supporting teaching JSON are published.
- The English guide at teachers-guide/index.html remains unchanged.
- Text/language review continues in the live TL edition; corrections must go through its TL Word master and the Website Manager.
- IMPORTANT: 28 individual TL PDFs are not yet committed to teachers-guide/tl/study-pdfs/. Do not use the English PDFs as Tagalog. The live Tagalog Share action will report missing PDFs until they are generated.
- To complete PDF publication: pull both repositories, select Teacher's Guide — Tagalog in Website Manager, tick Update study PDFs and GitHub Repository, build, then commit/push using GitHub Desktop. The manager splits Word into Study_01.pdf to Study_28.pdf and preserves the English PDF set. Review several of the 28 PDFs and verify Share before announcing them.
- The old _tl_translation_work/review/ folder remains an archived source/review workspace, not the live website.

The live site is served from this folder: teachers-guide/
The 28-study V2 interface uses:
- index.html, teaching-map.json, related-study-resources.json,
  main-pathway-enrichments.json, table-layouts.json,
  main-historical-notes.json and study-data.json
- assets/ and kjv-verses.json (original unchanged artwork and Bible)
- study-pdfs/ (existing shareable PDFs; kept until explicitly updated)

Study Library follows the GTKJ sequence. All 28 studies are freely selectable.
Main Study has all teaching plus optional supplementary questions.
The website has built-in full-text search, scriptures, and site sharing.

WORD MASTER / MANAGER:
The live Word converter and Windows Website Manager are held outside this
GitHub repository. DO NOT rebuild/publish Teachers' Guide with an older
converter that copies its original HTML template: it will overwrite V2.
When upgrading the authoring pipeline, carry all six JSON input files above
and ensure the converter reconciles stage markers whenever Word content or
images change. Never silently shift or truncate teaching sections.

PDF DEFAULT:
Keep the existing PDFs on normal builds (do not reprocess 28 PDFs).
Only regenerate when "Update PDFs" is explicitly selected in the manager.
Warn if the Word content has changed since the shared PDFs were generated.

This release leaves the original Word content, Bible, images and 28 PDFs intact.
Any large replacement of Word master or PDF styling requires source-level QA
before publishing that output.
