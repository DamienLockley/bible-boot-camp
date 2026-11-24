#!/usr/bin/env python3
"""Rebuild an editable Teachers' Guide V2 Word authoring master.

This reconstructs the content of the published 28-study JSON; it does not
purport to recover Word-only formatting that the original converter lost.
Uses explicit Word paragraph styles so section edits do not depend on indices.
"""
import argparse
import io
import json
import re
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STYLES = {
    "TG Stage": ("0A4667", True),
    "TG Extra": ("755A95", True),
    "TG Purpose": ("315B77", False),
    "TG Central Truth": ("315B77", False),
    "TG Application": ("24704F", False),
    "TG Response": ("24704F", False),
    "TG Note": ("24704F", False),
    "TG Answer": ("24704F", False),
}

def load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def color(value):
    return RGBColor.from_string(value)

def page_number(p):
    run = p.add_run()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run._r.addnext(fld)

def safe_picture(paragraph, asset_path):
    if not asset_path.exists():
        raise ValueError(f"Missing study illustration: {asset_path}")
    with Image.open(asset_path) as im:
        im.seek(0)
        im.load()
        if im.width <= 0 or im.height <= 0:
            raise ValueError("Invalid image: "+str(asset_path))
        # Word does not support many GIF/WebP variants reliably; save to
        # PNG *only inside the Word document*, preserving the site assets.
        out = io.BytesIO()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        im.save(out, format="PNG", optimize=True)
        out.seek(0)
        maxw = 6.0 if im.width < im.height else 6.5
        paragraph.add_run().add_picture(out, width=Inches(maxw))
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

def style_for(doc, name, hex_color, bold=False):
    styles = doc.styles
    obj = styles[name] if name in styles else styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    obj.base_style = styles["Normal"]
    obj.font.name = "Aptos"
    obj.font.size = Pt(10.5)
    obj.font.color.rgb = color(hex_color)
    obj.font.bold = bold
    obj.paragraph_format.space_before = Pt(6)
    obj.paragraph_format.space_after = Pt(5)
    if name == "TG Stage":
        obj.font.size = Pt(13)
        obj.paragraph_format.space_before = Pt(16)
        obj.paragraph_format.keep_with_next = True
    elif name == "TG Extra":
        obj.font.size = Pt(12)
        obj.paragraph_format.space_before = Pt(14)
        obj.paragraph_format.keep_with_next = True
    elif name in ("TG Application","TG Response"):
        obj.paragraph_format.left_indent = Cm(.35)
        obj.paragraph_format.right_indent = Cm(.35)
    return obj

def make_doc(root):
    source = load("study-data.json")["sections"]
    m = load("teaching-map.json")["studies"]
    tables = load("table-layouts.json")["tables"]
    additions = load("main-pathway-enrichments.json")["studies"]
    history = load("main-historical-notes.json")["notes"]
    if len(source) != len(m) or len(source) != 28:
        raise ValueError("Expected 28 studies and matching V2 metadata")
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(1.9)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(1.9)
    section.right_margin = Cm(1.9)
    section.header_distance = Cm(.9)
    section.footer_distance = Cm(.9)
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = color("243A4A")
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.16
    for name,(hex_color,bold) in STYLES.items():
        style_for(doc,name,hex_color,bold)
    for name in ("Heading 1","Heading 2"):
        style=doc.styles[name]
        style.font.name="Aptos Display"
        style.font.bold=True
        style.font.color.rgb=color("174F70")
    doc.styles["Heading 1"].font.size=Pt(20)
    doc.styles["Heading 2"].font.size=Pt(13)
    header=section.header.paragraphs[0]
    header.text="TEACHERS’ GUIDE  •  BIBLE STUDY NOTES"
    header.style="Caption"
    header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    footer=section.footer.paragraphs[0]
    footer.text="End Time Bible Studies  •  Page "
    footer.style="Caption"
    footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
    page_number(footer)
    title=doc.add_paragraph()
    title.style="Title"
    title.alignment=WD_ALIGN_PARAGRAPH.CENTER
    title.add_run("Teachers’ Guide\n").bold=True
    title.add_run("28 Studies • V2 Editable Working Master")
    intro=doc.add_paragraph(
        "Each study retains its original teaching text. Teal stage headings and "
        "purple supplemental questions organise the material for the website. "
        "The green teaching notes and responses are optional teacher prompts. "
        "Replace images directly in Word; the builder will preserve their position. "
        "Update PDFs only when you want to refresh the shareable handouts."
    )
    intro.style="Subtitle"
    note=doc.add_paragraph()
    note.add_run("Source fidelity note: ").bold=True
    note.add_run("This working copy is reconstructed from the published site content, "
                 "not the old Word file. Compare tables, captions, lists and images "
                 "with your backed-up original before considering it the definitive master.")
    doc.add_page_break()

    num_units=0
    num_images=0
    for i,(s,meta) in enumerate(zip(source,m)):
        if i: doc.add_page_break()
        groups=sorted(meta["groups"],key=lambda g:g["start"])
        starts={g["start"]:g for g in groups}
        core=sorted([g for g in groups if g["kind"]=="core"],key=lambda g:g["start"])
        unit_tables={t["start"]:t for t in tables if t["study_id"]==i}
        inside_table={j for t in unit_tables.values() for j in range(t["start"],t["end"]+1)}
        additions_by_stage={a["core_stage_index"]:a for a in additions[i]["main_stage_additions"]}
        history_by_stage={}
        for h in history:
            if h["study_id"]==i:history_by_stage.setdefault(h["stage_index"],[]).append(h)
        core_order={g["start"]:j for j,g in enumerate(core)}
        all_units=s["units"]
        if s["title"] != meta["title"] or len(all_units)!=meta["source_unit_count"]:
            raise ValueError(f"Study {i+1} changed relative to teaching map")
        idx=0
        while idx<len(all_units):
            if idx==0:
                doc.add_paragraph(all_units[0]["text"],"Heading 1")
                num_units+=1
                # Only add missing Purpose or Central Truth as new metadata.
                if meta.get("intro_origin")=="proposed":
                    doc.add_paragraph(meta["purpose"],"TG Purpose")
                    doc.add_paragraph(meta["central_truth"],"TG Central Truth")
                idx=1
                continue
            if idx in starts:
                group=starts[idx]
                doc.add_paragraph(group["label"],"TG Stage" if group["kind"]=="core" else "TG Extra")
                if group["kind"]=="core":
                    ci=core_order[idx]
                    insight=additions_by_stage.get(ci)
                    if insight:
                        guide=insight["teacher_guidance"]
                        p=doc.add_paragraph(style="TG Note")
                        p.add_run("TEACHING INSIGHT — "+guide["title"]+": ").bold=True
                        p.add_run(guide["explanation"])
                        doc.add_paragraph("Discussion question: "+guide["question"],"TG Note")
                        doc.add_paragraph("Suggested answer: "+guide["suggested_answer"],"TG Note")
                    for historical in history_by_stage.get(ci,[]):
                        p=doc.add_paragraph(style="TG Note")
                        p.add_run("HISTORICAL / PROPHETIC CONTEXT — "+historical["title"]+": ").bold=True
                        p.add_run(historical["text"])
                # Insert application/response at the end of core stages,
                # before optional appendices, not after them.
            if idx==unit_tables.get(idx,{}).get("start",-1):
                t=unit_tables[idx]
                if t["end"]>=len(all_units):
                    raise ValueError("Invalid table index range")
                doc.add_paragraph(t["caption"],"Caption")
                tbl=doc.add_table(rows=len(t["rows"]),cols=max(len(row) for row in t["rows"]))
                tbl.style="Light Shading Accent 1"
                for ri,row in enumerate(t["rows"]):
                    for ci,k in enumerate(row):
                        tbl.cell(ri,ci).text=all_units[k]["text"]
                num_units+=t["end"]-idx+1
                idx=t["end"]+1
                continue
            if idx in inside_table: raise ValueError("Table cells were skipped")
            u=all_units[idx]
            kind=u["kind"]
            style="Heading 2" if kind=="heading" else "TG Answer" if kind=="answer" else "Normal"
            p=doc.add_paragraph(u["text"],style)
            if kind=="question" and p.runs: p.runs[0].bold=True
            for image in u.get("images",[]):
                safe_picture(p,root/"assets"/image)
                num_images+=1
            num_units+=1
            idx+=1
        # Application, purpose and response remain editable Word metadata,
        # at the close of the study in this reconstructed version.
        doc.add_paragraph(meta["application"]["text"],"TG Application")
        doc.add_paragraph(meta["response"]["text"],"TG Response")
    if num_units!=sum(len(s["units"]) for s in source):
        raise ValueError(f"Teaching units mismatch: {num_units}")
    if num_images!=sum(len(u.get("images",[])) for s in source for u in s["units"]):
        raise ValueError(f"Image count mismatch: {num_images}")
    return doc, num_units,num_images

def main():
    global ROOT
    ap=argparse.ArgumentParser()
    ap.add_argument("--site",type=Path,default=ROOT)
    ap.add_argument("--out",type=Path,required=True)
    args=ap.parse_args()
    ROOT=args.site
    doc,units,images=make_doc(ROOT)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    doc.save(args.out)
    print(f"Generated reconstructed master: {args.out} ({units} original units, {images} images).")
    print("Compare this reconstruction to the backed-up original Word before adopting.")
if __name__=="__main__":
    main()
