# Getting to Know Jesus — proposed 28-study review edition

**Review URL:** https://endtimebiblestudies.org/gtk-review/

## Purpose and approval status

This is an **isolated English review edition**. Nothing in the current GTKJ English or Tagalog learner pages, Firebase, approved account progress, or website manager has been modified. There is deliberately no link from the main GTKJ homepage until the owner approves the concept.

The original order of all 28 doctrinal studies remains unchanged: line upon line, building understanding gradually. Every study focuses on the primary truth, biblical evidence, its application to lived experience, and what it reveals about God's character.

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

## Files

- `index.html`: review entry page
- `review.css`: separate responsive review styles
- `review-app.js`: independent lesson rendering, quiz, unlock demo and feedback export
- `review-data.js`: proposed analogies and five questions per lesson

## Safe feedback workflow

1. Open the review URL.
2. Keep **Reviewer access** checked to inspect any lesson immediately.
3. Read the summary, analogy, original Scripture lesson and understanding questions.
4. Type comments under **My comments on this study**.
5. Select **Export review notes**; save the JSON and provide it for the next review pass.

**Do not replace the approved production Word master or deploy these quizzes to Firebase until reviewed.**
