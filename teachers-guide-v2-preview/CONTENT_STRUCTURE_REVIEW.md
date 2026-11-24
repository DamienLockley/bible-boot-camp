# Teachers’ Guide V2 — Teaching Flow Review (28 studies)

**Status: preliminary document-wide structural review, not final editorial sign-off.** All changes stay in the separate V2 review branch. The original Word master and published website are unchanged.

## What the latest review corrected

- **Study 1 — The Word of God:** It already contained the four areas of evidence. They were inadvertently grouped into a single "Consistency" stage. The original material is now split into four clearly navigable stages: **Cultural**, **Internal**, **Manuscripts and Translation**, and **Experiential**. No original wording was removed. The original introduction to the four areas remains immediately before the first area.
- **Teaching additions:** source names and provisional authoring labels have been removed from the student-facing teaching cards. Colour distinctions remain: green for GTKJ-derived teaching insights, brown for Daniel and blue for Revelation. Full source provenance stays in the separate JSON review files.
- **Study 2 — The Great Controversy:** all four numbered apologetics questions and their matching answers are kept together; questions and answers are visible with answers highlighted.
- **1844:** the comparison diagrams remain intact as two preview tables and are not split across teaching stages.

## Structural audit checks across 28 published study datasets

- All 28 study maps account for every original teaching item outside the introductory title/purpose fields, without duplication.
- No teaching stage begins with a source item classified as an answer, and no stage splits a directly adjacent item classified as a question followed by an answer.
- No core stage begins with a detected appendix/apologetics/objections heading.
- All current enhancement references and historical notes target a valid stage after Study 1 was split.
- Potential structural-review issues still requiring human attention:
  - **Antichrist:** three long supplementary blocks (52, 54 and 65 items) need a more granular topic-by-topic editorial review against the full source master.
  - **The Judgement:** a section headed “Part one” is nested inside its first teaching stage; confirm natural subsection structure.
  - **Hell — Is God a Sadist?:** “The Rich Man and Lazarus” is an internal heading within a supplemental stage. Consider elevating the named passage as a specific navigation point.
  - **Study 1:** the document's original phrase “four areas of evidence” is followed by a **Consistency** heading identifying Cultural, Internal, Translational and Experiential. The new V2 stage labels align with these original four areas; do not change the doctrinal wording without review.

## What this audit does not yet certify

The generated `study-data.json` does **not** preserve all original Word table grids, formatting, merged cells, list levels, figures or inline styles. Thus no audit of this JSON alone can guarantee complete content fidelity or an exact reconstruction of each Word paragraph's visual layout. To complete the full document-wide rebuild and verify a professional PDF, inspect the latest raw Word master and regenerate the full website and all 28 study PDFs from that master, visually checking the resulting outputs.

No content is removed to shorten any study. Supplementary topics are navigational, not deletions.
