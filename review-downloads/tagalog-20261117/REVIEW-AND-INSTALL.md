# Windows retrieval — separate GitHub review branch

The three deliverables are copied to the public repository `DamienLockley/bible-boot-camp`, on branch `review/tagalog-downloads-20261117`, in `review-downloads/tagalog-20261117/`. This branch contains only the download packages, this document and a checksum file. It does not apply website or manager changes. The implementation branch described below remains local and unpublished.

## Retrieve with GitHub Desktop

1. Use **File → Clone repository → URL** and enter `https://github.com/DamienLockley/bible-boot-camp`. Choose a NEW local folder, such as `Documents/GitHub/GTKJ-Tagalog-Review`, to keep your existing working copy untouched.
2. Click **Fetch origin**, then **Current Branch**. Search for and select `review/tagalog-downloads-20261117`. If the clone initially shows main, simply switch to the review branch; no merge or publication is needed.
3. Choose **Repository → Show in Explorer** and open `review-downloads/tagalog-20261117`.
4. Copy these three files to a separate review folder on your PC:
   - `GTKJ-Tagalog-Draft.zip`
   - `GTKJ-Changed-Files-Only.zip`
   - `REVIEW-AND-INSTALL.md`
5. Optionally copy `SHA256SUMS.txt` and verify the downloads in PowerShell using `Get-FileHash .\GTKJ-Tagalog-Draft.zip -Algorithm SHA256` and the same command for the patch ZIP. Compare against `SHA256SUMS.txt`.
6. Extract the draft ZIP outside the clone. Follow the local preview steps below. Do not merge this downloads branch into main, use **Update from main**, or apply the site patch to your live repository as part of retrieval.

You can also browse this branch on GitHub, select each file and click **Download raw file**. The ZIP files are roughly 70 MB each; GitHub Desktop is the fallback if browser downloads fail.

## Testing on your PC

Serve the extracted draft at `http://localhost:8000/tl/` using `py -m http.server 8000` from the folder containing `tl`. Use a dedicated test account. Real sign-in, verification/reset email and contact delivery still require your review. If Firebase rejects localhost as an unauthorized domain or rejects the additional progress fields, record the error for review; no Firebase project, collection or security rules have been changed by this transfer.

Do not publish or merge until you have reviewed the draft and explicitly approved publication. The instructions below describe the original implementation and its local rollback point; only this separate delivery branch has now been uploaded.

---

# Tagalog draft — review and installation

The Dropbox master downloaded successfully (61,003,209 bytes). It contains 28 embedded illustrations, mapped by STUDY section rather than archive order. All 28 study IDs are retained; Study 01's documented `The Word` identifier is normalized to the renderer's existing `word` ID.

This is a local review draft. No remote GitHub writes, deployment, Firebase rule changes, real account operations, or real contact submissions were performed.

## Files

- `GTKJ-Tagalog-Draft.zip`: self-contained `tl/` draft, including the existing local Ang Dating Biblia dataset. Serve its parent folder, then open `/tl/`.
- `GTKJ-Changed-Files-Only.zip`: only the 99 changed/new site files under `site/tl/`, plus six changed/new manager files under `manager/`. Existing unchanged Bible data is omitted from this patch and remains in your repository.
- `Changed-site-files.txt`: exact site file list.
- `test-results.json`, `mock-results.json`: recorded automated results.
- `Comparison-1440.png`, `Comparison-1024.png`, `Comparison-390.png`: current English layout beside the Tagalog draft.
- `English-Image-Fix-Optional.patch`: proposed future English aspect-ratio fix; not applied.

## Review locally

1. Extract the draft ZIP into a new folder. Do not replace your live files.
2. Open a terminal in that folder and run `py -m http.server 8000` (or `python -m http.server 8000`).
3. Open `http://127.0.0.1:8000/tl/`. Opening the HTML directly as a file will prevent Bible JSON loading.
4. Review Start Here, the guide, all studies, translations, illustrations, mobile layouts and customised buttons. Longer Tagalog text wraps and increases page height naturally.

## Install the manager patch

1. Close Website Manager. Back up the entire installed V23.7 manager folder and its settings.
2. Copy the six files from the patch's `manager/` folder into the installed manager folder. No GUI file, settings, launcher, tab label or English converter is replaced.
3. Ensure dependencies are available: `py -m pip install python-docx beautifulsoup4`.
4. In the existing GTKJ Tagalog tab, use **Prepare TL Layout from English** with an empty isolated draft folder outside the repository. Select the restored Tagalog master, then Build. Preparation requires the current English repository and its existing `tl/bible/` and `tl/verses.json`.
5. On subsequent builds, retain that same draft folder. The builder updates generated data, images and the bounded guide content; it leaves `index.html`, styles, account implementation and layout/editor changes intact. To refresh shell code from newer English code, prepare a new empty draft and explicitly reconcile later editor changes.
6. Optional reproducible regression: `py GTKJ_TAGALOG_REGRESSION.py PATH_TO_ENGLISH_ROOT PATH_TO_RESTORED_MASTER.docx`.

## What changed

The site uses the current English shell, renderer and Graphical HTML Editor operations with translated labels and corrected relative Tagalog links. Study data and the full ten-point guide come from the Word master. The original embedded image bytes are retained and accompanied by a study-to-image SHA-256 manifest. Natural aspect-ratio rules cover the main illustration and gallery path; main images now open the existing zoom dialog.

The Tagalog reader loads the repository's real Ang Dating Biblia (1905) files, covering 66 books and 31,088 stored verses. Canonical English reference keys remain interoperable, and Tagalog aliases and chapter-only popups are supported. Missing stored verses are reported rather than substituted with KJV text.

Local Tagalog progress uses `discover-truth-tl-v1`. Existing Firebase accounts and `study_progress/{uid}` remain in place; Tagalog writes `progress_tl` and `updated_at_tl` using merge writes, preserving English `progress`. Existing English completion does not automatically unlock Tagalog lessons. Existing administrative access grants remain shared by the same study IDs.

## Publishing gate and rollback

Publication still requires your approval, native-speaker review, and the live-service checks in the test report. Confirm that the existing Firestore rules allow `progress_tl` merge writes in a safe test environment; this draft does not alter rules or collections. Ensure the current contact endpoint accepts the unchanged form field/option values.

The local branch is `draft/tagalog-word-master-20261117`; baseline rollback commit is `52878bdf72348c5ce97582dccaa58eda41ad5161`. Its draft commit is recorded in `Build-provenance.txt`. Nothing was pushed.

After approval, back up your repository and installed manager. Apply only `site/tl/` to the existing repository's `tl/`, inspect the diff, repeat the agreed account/contact checks, and merge/deploy through your normal process. Keep the English homepage unchanged, including its Tagalog button, unless you separately approve changing it. Do not apply the optional English CSS patch without a separate review.

To roll back, revert the draft change to `tl/` using the baseline or your backup, and restore the backed-up manager files. Tagalog progress is a separate field; rolling back site files does not require deleting or migrating user data.
