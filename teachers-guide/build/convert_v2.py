#!/usr/bin/env python3
"""Teachers' Guide V2 website builder.

Run alongside the existing Word_Converter/convert.py; it imports the established
Word/PDF extraction code without changing that legacy converter. Uses the live
V2 site as the template, keeps its rich resources and images, and defaults to
keeping the existing study PDFs.

Usage:
 python convert_v2.py MASTER.docx --site-template PATH/teachers-guide --output BUILD_DIR
 python convert_v2.py MASTER.docx --site-template PATH/teachers-guide --output BUILD_DIR --pdf-mode update --pdf MASTER.pdf

The --site-template directory can be a local checkout of the GitHub
bible-boot-camp/teachers-guide folder. This script never publishes to GitHub.
"""
import argparse
import copy
import difflib
import hashlib
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

try:
    from convert import extract, split_study_pdf, clean
except ImportError as exc:
    raise SystemExit(
        "Put convert_v2.py beside your current Word_Converter/convert.py "
        "so the established extractor can be imported."
    ) from exc

REQUIRED = (
    "index.html", "study-data.json", "teaching-map.json",
    "related-study-resources.json", "main-pathway-enrichments.json",
    "table-layouts.json", "main-historical-notes.json",
    "kjv-verses.json", "service-worker.js",
)
PDF_NAMES = tuple("Study_%02d.pdf" % i for i in range(1, 29))


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value):
    return re.sub(r"\s+", " ", value or "").strip().casefold()


def old_to_new(source_units, new_units):
    """Return source-unit index -> new-unit index for unchanged text anchors."""
    a = [canonical(unit["text"]) for unit in source_units]
    b = [canonical(unit["text"]) for unit in new_units]
    # Image-only paragraphs may share empty text, so preserve their kind too.
    a = [(a[i], source_units[i].get("kind")) for i in range(len(a))]
    b = [(b[i], new_units[i].get("kind")) for i in range(len(b))]
    blocks = difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks()
    return {ai + off: bi + off for ai, bi, n in blocks for off in range(n)}


def map_boundary(index, matches, new_length):
    if index in matches:
        return matches[index]
    later = [(i, j) for i, j in matches.items() if i > index]
    if later:
        i, j = min(later)
        return max(0, min(new_length - 1, j - (i - index)))
    earlier = [(i, j) for i, j in matches.items() if i < index]
    if earlier:
        i, j = max(earlier)
        return min(new_length - 1, j + (index - i))
    raise ValueError("Cannot align any previous study text with the edited Word master.")


def remap_studies(previous, updated, teaching_map):
    if len(previous) != len(updated) or len(updated) != len(teaching_map["studies"]):
        raise ValueError("The Word document has changed its number of studies. Update V2 resources before building.")
    result = copy.deepcopy(teaching_map)
    for i, (old, new, mapped) in enumerate(zip(previous, updated, result["studies"])):
        if canonical(old["title"]) != canonical(new["title"]):
            raise ValueError(
                "Study %d title/order changed (%s -> %s). V2 cross-links use stable "
                "study identities; don't silently reassign them." %
                (i + 1, old["title"], new["title"])
            )
        matches = old_to_new(old["units"], new["units"])
        # Substantial structural edits with no strong anchor must not silently
        # shift an appendix into another teaching stage.
        matching_ratio = len(matches) / max(len(old["units"]), len(new["units"]), 1)
        if matching_ratio < 0.58:
            raise ValueError(
                "Study %d (%s) has changed too extensively for safe automatic "
                "stage reconciliation (%.0f%% matching). Review its boundaries "
                "using the new Word stage styles before publishing." %
                (i + 1, new["title"], 100 * matching_ratio)
            )
        original_groups = sorted(mapped["groups"], key=lambda g: g["start"])
        new_groups = []
        for index, group in enumerate(original_groups):
            g = copy.deepcopy(group)
            g["start"] = map_boundary(group["start"], matches, len(new["units"]))
            if new_groups and g["start"] <= new_groups[-1]["start"]:
                raise ValueError("Merged/empty teaching stages detected in study %d; correct the Word stage boundaries." % (i+1))
            if new_groups:
                new_groups[-1]["end"] = g["start"] - 1
            new_groups.append(g)
        if new_groups:
            new_groups[-1]["end"] = len(new["units"]) - 1
        mapped["groups"] = sorted(new_groups, key=lambda g: (g["kind"] != "core", g["start"]))
        mapped["source_unit_count"] = len(new["units"])
        # Native Word table metadata takes precedence over legacy table overlays.
        # In their absence we do not guess at old table cells after structural edits.
        if i == 10 and not new.get("tables") and len(old["units"]) != len(new["units"]):
            raise ValueError("The 1844 study's table layout changed; use real Word tables before publishing.")
    return result


def add_native_tables(word_path, sections):
    """Record true Word table row/cell coordinates while keeping source units."""
    from docx import Document
    from docx.text.paragraph import Paragraph
    from docx.table import Table
    from docx.oxml.ns import qn
    doc = Document(word_path)
    section = -1
    unit = 0
    for child in doc.element.body.iterchildren():
        if child.tag == qn("w:p"):
            p = Paragraph(child, doc)
            title = clean(p.text)
            if (p.style.name or "").lower().startswith("heading 1") and title:
                section += 1
                unit = 0
            if section < 0:
                continue
            if title or p._element.xpath(".//a:blip"):
                unit += 1
        elif child.tag == qn("w:tbl"):
            if section < 0:
                continue
            table = Table(child, doc)
            rows = []
            start = unit
            for row in table.rows:
                indices = []
                for cell in row.cells:
                    paras = [p for p in cell.paragraphs if clean(p.text) or p._element.xpath(".//a:blip")]
                    # Zero, one, or many paragraphs per Word cell are all valid.
                    # Lists of indexes preserve their reading order without
                    # pretending a multi-paragraph cell is a separate row.
                    cell_indices = list(range(unit, unit + len(paras)))
                    indices.append(cell_indices)
                    unit += len(paras)
                rows.append(indices)
            if not rows:
                continue
            if unit > len(sections[section]["units"]):
                raise ValueError("Source table index mismatch in study %d." % (section+1))
            sections[section].setdefault("tables", []).append({
                "start": start,
                "end": unit - 1,
                "rows": rows,
                "column_headers": True,
                "caption": "Scripture and teaching comparison",
            })
    if section + 1 != len(sections):
        raise ValueError("Word table scanner and existing converter disagree about the study count.")
    for i, section in enumerate(sections):
        # A stage must contain the complete table. The website already handles
        # table layout and the builder validates its stage mapping below.
        for table in section.get("tables", []):
            if sum(len(cell) for row in table["rows"] for cell in row) != table["end"] - table["start"] + 1:
                raise ValueError("Table cell mismatch in study %d." % (i+1))


def rename_images(sections, images, site):
    known = {}
    assets = site / "assets"
    assets.mkdir(exist_ok=True)
    for p in assets.iterdir():
        if p.is_file():
            known[hashlib.sha256(p.read_bytes()).hexdigest()] = p.name
    reserved = {p.name for p in assets.iterdir() if p.is_file()}
    replacements = {}
    seq = 1
    for digest, (suggested, blob) in images.items():
        if digest in known:
            name = known[digest]
        else:
            while any(Path(n).stem == "image-%03d" % seq for n in reserved):
                seq += 1
            name = "image-%03d%s" % (seq, Path(suggested).suffix)
            reserved.add(name)
            seq += 1
        replacements[suggested] = name
        (assets / name).write_bytes(blob)
    for section in sections:
        for unit in section["units"]:
            unit["images"] = [replacements[name] for name in unit.get("images", [])]


def run():
    p = argparse.ArgumentParser(description="Teachers Guide V2 flexible Word builder")
    p.add_argument("document", type=Path)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--site-template", type=Path, default=None)
    p.add_argument("--existing-site", type=Path, default=None)
    p.add_argument("--pdf", type=Path, default=None)
    p.add_argument("--pdf-mode", choices=("keep", "update"), default="keep",
                   help="keep existing PDFs (default) or update all 28")
    args = p.parse_args()
    if not args.document.is_file() or args.document.suffix.lower() != ".docx":
        p.error("A complete .docx Word master is required")
    dest = args.output.resolve()
    if dest == Path(__file__).resolve().parent or dest in Path(__file__).resolve().parents:
        p.error("Output must not overwrite the converter's own files")
    choices = [args.site_template, args.existing_site, Path(__file__).resolve().parent / "template" / "github"]
    source = next((x.resolve() for x in choices if x and
                   all((x / name).is_file() for name in REQUIRED)), None)
    if source is None:
        p.error("Provide --site-template PATH to a current bible-boot-camp/teachers-guide checkout containing V2 files")
    previous = load(source / "study-data.json")["sections"]
    metadata = load(source / "teaching-map.json")
    sections, images = extract(args.document)
    add_native_tables(args.document, sections)
    new_map = remap_studies(previous, sections, metadata)
    for i, (section, mapped) in enumerate(zip(sections, new_map["studies"])):
        for table in section.get("tables", []):
            if not any(g["start"] <= table["start"] and g["end"] >= table["end"] for g in mapped["groups"]):
                raise ValueError("Study %d has a Word table split between teaching stages; check its boundaries" % (i+1))
    with tempfile.TemporaryDirectory(prefix="teacher-v2-", dir=str(dest.parent)) as td:
        staging = Path(td) / "GitHub_PWA"
        shutil.copytree(source, staging)
        rename_images(sections, images, staging)
        (staging / "study-data.json").write_text(
            json.dumps({"sections": sections}, ensure_ascii=False, indent=2), encoding="utf-8")
        (staging / "teaching-map.json").write_text(
            json.dumps(new_map, ensure_ascii=False, indent=2), encoding="utf-8")
        pdfs = staging / "study-pdfs"
        if args.pdf_mode == "update":
            if not args.pdf or not args.pdf.is_file():
                p.error("--pdf-mode update requires --pdf matching-full-document.pdf")
            if pdfs.exists():
                shutil.rmtree(pdfs)
            split_study_pdf(args.pdf, [s["title"] for s in sections], pdfs)
            pdf_status = "Updated all 28 study PDFs"
        else:
            if args.existing_site and (args.existing_site / "study-pdfs").is_dir():
                if pdfs.exists():
                    shutil.rmtree(pdfs)
                shutil.copytree(args.existing_site / "study-pdfs", pdfs)
            missing = [name for name in PDF_NAMES if not (pdfs / name).is_file()]
            if missing:
                raise ValueError("Keep PDFs selected but %d PDF(s) missing. Supply --existing-site with the current 28 PDFs, or select --pdf-mode update." % len(missing))
            pdf_status = "Kept all 28 existing PDFs"
        if args.pdf_mode == "keep" and hashlib.sha256(
            json.dumps(previous, ensure_ascii=False, sort_keys=True).encode()).hexdigest() != hashlib.sha256(
            json.dumps(sections, ensure_ascii=False, sort_keys=True).encode()).hexdigest():
            print("WARNING: Word content or images changed; PDFs have not been regenerated. Share PDFs may be older than the website.")
        (staging / "pdf-build-status.json").write_text(json.dumps({
            "pdf_mode": args.pdf_mode, "status": pdf_status,
            "word_sha256": fingerprint(args.document),
            "source_site": str(source),
        }, indent=2), encoding="utf-8")
        dest.mkdir(parents=True, exist_ok=True)
        final = dest / "GitHub_PWA"
        backup = dest / "GitHub_PWA.previous"
        if backup.exists():
            shutil.rmtree(backup)
        if final.exists():
            final.rename(backup)
        try:
            shutil.copytree(staging, final)
        except Exception:
            if final.exists():
                shutil.rmtree(final)
            if backup.exists():
                backup.rename(final)
            raise
        if backup.exists():
            shutil.rmtree(backup)
    print("V2 build validated: %d studies, %d teaching items; %s." %
          (len(sections), sum(len(s["units"]) for s in sections), pdf_status))
    print("Generated:", final)
    print("Preview before publishing; this tool never publishes directly.")


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print("ERROR:", exc, file=sys.stderr)
        sys.exit(1)
