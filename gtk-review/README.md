# Getting to Know Jesus — proposed 28-study review edition

**Review URL:** https://endtimebiblestudies.org/gtk-review/

## Purpose and approval status

This is an **isolated English review edition**. Nothing in the current GTKJ English or Tagalog learner pages, Firebase, approved account progress, or website manager has been modified. There is deliberately no link from the main GTKJ homepage until the owner approves the concept.

The original order of all 28 doctrinal studies remains unchanged in the interactive lesson reader: line upon line, building understanding gradually. Every study focuses on the primary truth, biblical evidence, its application to lived experience, and what it reveals about God's character.

A separate **Study Pathway Proposal** now audits the current sequence and shows an alternative order for owner review. The interactive lesson reader continues to use the original order; the alternative is not applied to either the review reader or the live learner site. It also demonstrates warmer “Coming up” wording while keeping future lessons unavailable in learner mode.

## What the reviewer can inspect

- Original lesson introduction, three teaching points, 6 Bible readings, Scripture connections, life questions, and application, read directly from the current site's **../lessons.js**, **../lesson-depth.js**, and **../principles.js**.
- Proposed What You Will Discover panel: the existing main principle and three teaching ideas, clearly marked as review material.
- An analogy for each lesson from the prior user-supplied 28-study review draft.
- Five new multiple-choice questions per study, 140 in total. These were drafted only from the uploaded GTKJ materials and their existing Scripture interpretations, and are **subject to the owner's theological and educational review**.
- A demonstration of 5/5 mastery unlocking the next lesson. Reviewer access is checked by default so the owner can inspect any of the 28 lessons.
- Local, editable review notes for each study, exported as **GTKJ_Review_Notes.json** using the button in the header.

## Source boundaries

Materials used directly to create this review:

1. The latest user-supplied **SEND_TO_CHATGPT(2).docx** 28-study GTKJ master (text-only exchange copy), including its introductory reliability material.
2. **GTKJ_English_28_Studies_Main_Points_Analogies_DRAFT(2).docx** from the earlier review work, including all 28 analogies.
3. The site's own maintained **lessons.js**, **lesson-depth.js**, and **principles.js** data, themselves generated from the owner's approved Word master.

The existing Daniel and Revelation study objectives and the owner's Scripture-first/historicist theological framework informed the review approach, but no new historical or prophetic claim was silently imported from an unavailable external source. This review is **not** a claim that every previously supplied PDF, book, Daniel/Revelation master or EGW quotation has been individually re-read and checked. Those source-by-source refinements remain for approval-based subsequent revisions.

## Important implementation distinctions

- This review does **not** use Firebase accounts; its progress and notes are stored only in this browser under `gtkj-educational-review-v1`.
- Unlocking here does not unlock anything on the current public GTKJ website.
- The 28 existing studies are read dynamically from the main English site files. Therefore when the owner's Website Manager rebuilds and publishes the original site's lesson data, the review displays that new lesson wording automatically. The proposed analogies and multiple-choice questions are in `review-data.js` and remain a separate editable draft until approved and incorporated into the Word master/converter.
- The review is in English only. Tagalog translation and real-learner integration should follow the owner's approval of the instructional design and questions.
- No external instructional sources were consulted or introduced for this review. Bible references are those already found in the approved studies.

## Review 3 — Becoming More Like Jesus (23 November 2026)

All 28 lessons now propose a **Becoming More Like Jesus** section: what the teaching reveals about God, a biblical example to follow, a warning not to imitate the sin of biblical characters, and a practical response empowered by Christ. In Study 5 the user explicitly requested following David's repentance, not his adultery and wrongdoing toward Uriah (2 Samuel 11–12; Psalm 51).

The fifth multiple-choice question in each study is now an applied character scenario, so the course still has 140 questions. The other four questions remain unchanged. Correct answers assess understanding, **not the reality of character transformation**. This entire educational pass is proposed for review; no live GTKJ accounts or production files were changed.

## Review 2 — main teaching points (23 November 2026)

The second pass has now replaced Review 1's repeated lesson headings with **four concise, source-grounded learning outcomes for each of the 28 lessons (112 total)**. Each outcome has an accompanying Bible reference already present in the site's approved study data or connections. The fourth outcome explicitly addresses God's character.

These new teaching points live only in `review-pass2.js`. The 140 demonstration questions and analogies remain in `review-data.js`. The 28 original lessons remain sourced from the main GTKJ site's Word-generated JavaScript files; no production study text was changed.

**Review status:** Proposed, not approved. The output is a faithful review draft, not a completed independent audit of every previously provided Ellen White, Daniel, Revelation, or original authority document. Those full masters were not all accessible in this session, so no new interpretations or outside research have been silently blended into the summaries.

### Recommended review order

Read a study's **Four truths to remember**, then its original Bible readings and the analogy, and finally try the five-question check. Review the fourth point especially: whether it really vindicates God's character and combats a relevant deception without overstating a passage. Use **My comments on this study** and **Export review notes** to send suggested corrections.

## Files

- `index.html`: review entry page, with a link to the pathway proposal
- `sequence-review.html`: proposed sequence audit and encouraging upcoming-study card wording
- `review.css`: separate responsive review styles
- `review-app.js`: independent lesson rendering, quiz, unlock demo and feedback export
- `review-data.js`: proposed analogies and five questions per lesson
- `review-pass2.js`: four Scripture-supported learning outcomes for each of the 28 studies, separated for theological review
- `review-pass3.js`: the 28 character transformation examples, warnings, practical applications and fifth-question replacements

## Safe feedback workflow

1. Open the review URL.
2. Keep **Reviewer access** checked to inspect any lesson immediately.
3. Read the summary, analogy, original Scripture lesson and understanding questions.
4. Type comments under **My comments on this study**.
5. Select **Export review notes**; save the JSON and provide it for the next review pass.

**Do not replace the approved production Word master or deploy these quizzes to Firebase until reviewed.**
