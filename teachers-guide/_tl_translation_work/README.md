# Teachers' Guide V2 — Tagalog translation work

**Status (25 November 2026):** The unpublished Tagalog review package has been rebuilt after recovering and translating the eight previously truncated English Daniel excerpts. First-pass Tagalog study text exists for all **28 studies / 2,662 units**, with **17 image positions**, the original KJV Scripture metadata, and the main/supplementary stage structure preserved. Study 28 was individually corrected against the English source.

## Supporting lessons

- All **28 GTKJ-linked supplementary lesson sections** have now been translated in `related-study-resources.tl.draft.json`, including their introductions, principles, three teaching connections, questions and answers, practices and linked reading titles.
- The builder incorporates this text into `review/related-study-resources.json`, while explicitly checking that scripture references, source identities, cross-site links, passage anchors and order match the English source.
- All **17 optional Daniel context passages** now have first-pass Tagalog translations in `main-pathway-enrichments.tl.draft.json` and are assembled into `review/main-pathway-enrichments.json`. All eight incomplete source fields were recovered verbatim from `daniel/index.html` (see `recovered-daniel-source-endings.en.json`) and their Tagalog endings have been translated. The generated `review/translation-audit.json` now requires **zero unresolved source-truncation warnings**.
- The Tagalog review interface has translated study/navigation/search, feedback, and error messages, but still requires a complete manual visual and native-language review. **The original English study PDFs remain placeholders** and must not be presented as translated documents.

## Editing and review

- English authoritative website: `teachers-guide/` (unchanged and public).
- Working study translations: `study_01.json` to `study_28.json`.
- Assembled working data: `study-data.tl.json`.
- Review folder: `review/` containing `Teachers_Guide_V2_TL_Master.docx`, `index.html`, the translated supporting JSON, `translation-audit.json`, and `Teachers_Guide_V2_TL_Review_Package.zip`.
- The Word master is intended for editing by the user. `TG Stage` and `TG Extra` mark the core and supplementary study boundaries for the Website Manager.
- The full ZIP and Word file are committed inside this repository: access via GitHub Desktop after **Fetch/Pull**, rather than GitHub's browser preview, which has a size limit.

## Website Manager

Pull the latest `bible-boot-camp` and `Website-Manager` repositories, then use **Teacher's Guide — Tagalog** in Website Manager V25.6 or newer. Build to **Desktop Test Site only**, without choosing **GitHub Repository**. The preview helper stages files outside the public repo and corrects nested Daniel/Revelation links without rewriting the English source references. Existing PDFs are English placeholders; leave **Update study PDFs** unchecked.

## Publication rule

**The Tagalog site is not yet live.** Machine checks and source recovery are complete, but are not a substitute for final native-speaker language/content review, live-device UI/link checks and approved Tagalog PDFs. Do not publish `teachers-guide/tl/` until those tasks are completed.
