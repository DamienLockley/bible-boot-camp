# Teachers' Guide V2 — Tagalog translation work

**Status (25 November 2026):** All 28 studies have first-pass Tagalog working files (`study_01.json` through `study_28.json`). The assembled study data is `study-data.tl.json`. These are **unpublished working sources**, not the final live TL site.

## Important handling

- The English source is `../study-data.json`; do not modify it when working on TL.
- Preserve every study unit in order, with its original `kind`, optional image attachments, and verse metadata. No translated teaching material should be silently dropped.
- Study 28 has an explicit QA note: check each of its 26 first-pass paragraphs against the English source before publishing; compare all other translated studies for accuracy too.
- Build a Tagalog Word master and local editable HTML with the same website-manager-compatible format as English before publishing.
- Images, scripture links, study/main versus supplemental scripture sections, stage navigation, feedback destination, English/Tagalog toggle and HTML editor save-to-desktop behaviour require functional review before publication.
- Do not start slow external-API translation or auto-publish workflows: these first-pass files were prepared directly and are meant to be reviewed locally.

## Source layout

Each `study_XX.json` preserves source `id`, `units[].kind`, `units[].images`, and `verses`. The `text` and title are Tagalog. Supporting `stage`, `application`, and `response` fields are working metadata and should not replace or remove the original teaching material.
