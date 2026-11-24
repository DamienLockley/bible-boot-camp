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
    from convert import extract, split_study_pdf, clean, REFS
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



TEACHER_STYLES = {
    "tg stage": "core",
    "tg extra": "supplement",
    "tg application": "application",
    "tg response": "response",
    "tg purpose": "purpose",
    "tg central truth": "central_truth",
}


def remove_teacher_markers(word_path, sections):
    """Read editable Word styles as navigation metadata, not study text.

    The existing extractor has already collected the original units/images.
    Remove only our named V2 marker paragraphs, preserving every other unit
    exactly and recalculating scripture references from retained text.
    """
    from docx import Document
    from docx.text.paragraph import Paragraph
    from docx.table import Table
    from docx.oxml.ns import qn
    document = Document(word_path)
    raw_entries = [[] for _ in sections]
    current = -1

    def scan(p):
        nonlocal current
        value = clean(p.text)
        style = (p.style.name or "").lower().strip()
        if style.startswith("heading 1") and value:
            current += 1
        if current < 0:
            return
        if not value and not p._element.xpath(".//a:blip"):
            return
        raw_entries[current].append((style, value))

    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            scan(Paragraph(child, document))
        elif child.tag == qn("w:tbl"):
            table = Table(child, document)
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        scan(p)

    markers = []
    for i, (sec, entries) in enumerate(zip(sections, raw_entries)):
        if len(entries) != len(sec["units"]):
            raise ValueError(
                "Word paragraph scan mismatch for study %d (%d vs %d); "
                "the master has a structure not supported by the existing extractor." %
                (i + 1, len(entries), len(sec["units"]))
            )
        kept, study_markers = [], []
        for (style, value), unit in zip(entries, sec["units"]):
            kind = TEACHER_STYLES.get(style)
            if kind:
                if not value:
                    raise ValueError("Study %d has an empty %s marker." % (i + 1, style))
                study_markers.append({
                    "kind": kind,
                    "start": len(kept),
                    "text": value,
                })
            else:
                kept.append(unit)
        sec["units"] = kept
        sec["verses"] = [
            match.group().strip()
            for unit in kept for match in REFS.finditer(unit["text"])
        ]
        markers.append(study_markers)
    if len(raw_entries) != len(sections):
        raise ValueError("Word marker scanner saw a different number of studies.")
    return markers


def apply_explicit_stages(teaching_map, markers, sections):
    """Let new styled Word headings define the teaching stages.

    Regular paragraphs, table cells and images may be added or deleted
    freely inside these sections. Stage titles are ordinary editable text.
    """
    updated = copy.deepcopy(teaching_map)
    for i, marks in enumerate(markers):
        stages = [m for m in marks if m["kind"] in ("core", "supplement")]
        if not stages:
            continue
        if stages[0]["kind"] != "core":
            raise ValueError("Study %d must begin its teaching stages with TG Stage." % (i + 1))
        if len({m["start"] for m in stages}) != len(stages):
            raise ValueError("Study %d has multiple stage headings without content between them." % (i + 1))
        ordered = []
        for j, m in enumerate(stages):
            start = m["start"]
            end = stages[j + 1]["start"] - 1 if j + 1 < len(stages) else len(sections[i]["units"]) - 1
            if not (0 <= start <= end):
                raise ValueError("Study %d has an empty teaching stage: %s" % (i+1,m["text"]))
            ordered.append({"kind": m["kind"], "start": start, "end": end, "label": m["text"]})
        updated["studies"][i]["groups"] = [x for x in ordered if x["kind"]=="core"] + [
            x for x in ordered if x["kind"]=="supplement"]
        updated["studies"][i]["source_unit_count"] = len(sections[i]["units"])
        for m in marks:
            if m["kind"] in ("purpose", "central_truth"):
                updated["studies"][i][m["kind"]] = m["text"]
            if m["kind"] in ("application", "response"):
                updated["studies"][i][m["kind"]] = {"text": m["text"], "origin": "Word master"}
    return updated


def remap_related_stages(previous_map, updated_map, old_units, new_units, additions, historical):
    """Preserve enrichment identity when a teacher inserts or moves a stage."""
    enrich = copy.deepcopy(additions)
    notes = copy.deepcopy(historical)
    for i, (old, new) in enumerate(zip(previous_map["studies"], updated_map["studies"])):
        former = [g for g in old["groups"] if g["kind"]=="core"]
        current = [g for g in new["groups"] if g["kind"]=="core"]
        if not current:
            raise ValueError("Study %d has no main teaching stages." % (i + 1))
        matches = old_to_new(old_units[i]["units"], new_units[i]["units"])
        def relocated(k):
            if k < 0 or k >= len(former):
                raise ValueError("Old teaching stage %d missing in study %d." % (k, i+1))
            title = canonical(former[k]["label"])
            exact = [index for index, group in enumerate(current)
                     if canonical(group["label"]) == title]
            if len(exact) == 1:
                return exact[0]
            pos = map_boundary(former[k]["start"], matches, len(new_units[i]["units"]))
            for index, group in enumerate(current):
                if group["start"] <= pos <= group["end"]:
                    return index
            return min(range(len(current)), key=lambda x:abs(current[x]["start"]-pos))
        for addition in enrich["studies"][i]["main_stage_additions"]:
            index = relocated(addition["core_stage_index"])
            addition["core_stage_index"] = index
            addition["core_label"] = current[index]["label"]
        for note in notes["notes"]:
            if note["study_id"] == i:
                note["stage_index"] = relocated(note["stage_index"])
    return enrich, notes


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
            if (p.style.name or "").lower().strip() in TEACHER_STYLES:
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
    markers = remove_teacher_markers(args.document, sections)
    add_native_tables(args.document, sections)
    new_map = remap_studies(previous, sections, metadata) if not any(
        any(m["kind"] in ("core","supplement") for m in marks) for marks in markers
    ) else apply_explicit_stages(
        remap_studies(previous, sections, metadata), markers, sections
    )
    new_enrich, new_history = remap_related_stages(
        metadata, new_map, previous, sections,
        load(source / "main-pathway-enrichments.json"),
        load(source / "main-historical-notes.json")
    )
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
        (staging / "main-pathway-enrichments.json").write_text(
            json.dumps(new_enrich, ensure_ascii=False, indent=2), encoding="utf-8")
        (staging / "main-historical-notes.json").write_text(
            json.dumps(new_history, ensure_ascii=False, indent=2), encoding="utf-8")
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
