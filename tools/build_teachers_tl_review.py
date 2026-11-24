#!/usr/bin/env python3
"""Build a non-published, manager-shaped Tagalog Teachers' Guide review package.

Reads the 28 human-authored Tagalog study files. Never translates via a
network API and NEVER edits the live English or Tagalog website.
"""
from __future__ import annotations
import copy, hashlib, io, json, re, shutil, zipfile
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt, RGBColor
from PIL import Image

WORK = Path(__file__).resolve().parents[1] / "teachers-guide" / "_tl_translation_work"
ROOT = WORK.parent
REVIEW = WORK / "review"

def load(p):
    return json.loads(p.read_text(encoding="utf-8"))

def store(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def tidy(s):
    return re.sub(r"\s+", " ", s).strip()

def stage_heading(tl, group, ordinal):
    pos = group["start"]
    explicit = tl["units"][pos].get("stage")
    if explicit and isinstance(explicit, (list, tuple)) and len(explicit) > 1:
        label = tidy(str(explicit[1]))
        if label:
            return label
    first = tl["units"][pos]["text"]
    if first.startswith("KAALAMAN SA PAGTUTURO"):
        match = re.match(r"KAALAMAN SA PAGTUTURO\s*[—-]\s*([^:]{5,90}):", first)
        if match:
            return match.group(1)
    return ("Pangunahing Pag-aaral " if group["kind"] == "core" else "Karagdagang Pag-aaral ") + str(ordinal)

def ensure_style(doc, name, size=10.5, color="315B77"):
    s = doc.styles[name] if name in doc.styles else doc.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    s.base_style = doc.styles["Normal"]
    s.font.name = "Aptos"
    s.font.size = Pt(size)
    s.font.color.rgb = RGBColor.from_string(color)
    s.paragraph_format.space_after = Pt(6)
    return s

def image_run(p, name):
    filepath = ROOT / "assets" / name
    if filepath.is_file():
        try:
            with Image.open(filepath) as im:
                im.seek(0)
                im.load()
                if im.mode not in ("RGB", "RGBA"):
                    im = im.convert("RGB")
                buf = io.BytesIO()
                im.save(buf, format="PNG", optimize=True)
                buf.seek(0)
                width = Inches(5.9 if im.height > im.width else 6.25)
                p.add_run().add_picture(buf, width=width)
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                return True
        except (OSError, ValueError, SyntaxError):
            pass
    marker = p.add_run(" [IMAGE TO REPLACE: " + name + "]")
    marker.bold = True
    marker.font.color.rgb = RGBColor(151, 98, 34)
    return False

def make_word(sections, translated, mapping, tables):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(1.75)
    sec.bottom_margin = Cm(1.65)
    sec.left_margin = Cm(1.85)
    sec.right_margin = Cm(1.85)
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.paragraph_format.space_after = Pt(6)
    for name, size, color in [
        ("TG Stage",13,"155A75"),("TG Extra",12,"755A95"),
        ("TG Purpose",10,"315B77"),("TG Central Truth",10,"315B77"),
        ("TG Application",10,"24704F"),("TG Response",10,"24704F"),
        ("TG Note",10,"24704F"),("TG Answer",10,"315B77"),
        ("TG Insight",10,"7A5A2D"),("TG Question",10,"315B77"),
        ("TG Main Scripture",10,"315B77"),("TG Supplementary Scripture",10,"755A95"),
    ]:
        ensure_style(doc,name,size,color)
    for name in ("Heading 1", "Heading 2"):
        doc.styles[name].font.name = "Aptos Display"
        doc.styles[name].font.color.rgb = RGBColor(21, 79, 112)
        doc.styles[name].font.bold = True
    doc.styles["Heading 1"].font.size = Pt(18)
    doc.styles["Heading 2"].font.size = Pt(12)
    h = sec.header.paragraphs[0]
    h.text = "GABAY NG GURO  •  GET TO KNOW JESUS"
    h.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    intro = doc.add_paragraph(style="Title")
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro.add_run("Gabay ng Guro").bold = True
    para = doc.add_paragraph("28 Pag-aaral • Tagalog V2 • Editable na Word Master")
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph(
        "Unang saling Tagalog para sa pagsusuri. Napanatili ang mga orihinal na talata, "
        "pagkakasunod-sunod ng pagtuturo, mga pandagdag na seksiyon, at mga puwesto ng larawan."
    )
    doc.add_paragraph(
        "Hindi pa ito inilalathala. Ang mga pamagat na may estilong TG Stage at TG Extra "
        "ay mga nababagong hangganan ng mga bahagi para sa Website Manager."
    )
    doc.add_page_break()
    image_slots = 0
    image_embedded = 0
    unit_total = 0
    for i, (en, tl, mapped) in enumerate(zip(sections, translated, mapping["studies"])):
        if i:
            doc.add_page_break()
        if tl["id"] != en["id"] or len(tl["units"]) != len(en["units"]):
            raise ValueError("Study unit mismatch " + str(i+1))
        group_starts = {g["start"]:g for g in mapped["groups"]}
        starts = {t["start"]:t for t in tables if t["study_id"] == i}
        inside = {j for t in starts.values() for j in range(t["start"],t["end"]+1)}
        core_n = other_n = 0
        j=0
        while j < len(tl["units"]):
            if j==0:
                doc.add_paragraph(tl["units"][0]["text"], "Heading 1")
                unit_total+=1
                j+=1
                continue
            if j in group_starts:
                group = group_starts[j]
                if group["kind"] == "core":
                    core_n+=1; number=core_n; style="TG Stage"
                else:
                    other_n+=1; number=other_n; style="TG Extra"
                doc.add_paragraph(stage_heading(tl,group,number),style)
            if j in starts:
                t = starts[j]
                caption = ("Talahanayan: " + (tl["title"] if t.get("caption") else ""))
                doc.add_paragraph(caption, style="Caption")
                tb=doc.add_table(rows=len(t["rows"]), cols=max(len(row) for row in t["rows"]))
                tb.style="Light Shading Accent 1"
                ordered=[]
                for ri,row in enumerate(t["rows"]):
                    for ci,index in enumerate(row):
                        tb.cell(ri,ci).text=tl["units"][index]["text"]
                        ordered.append(index)
                assert ordered == list(range(t["start"],t["end"]+1))
                unit_total+=len(ordered)
                j=t["end"]+1
                continue
            if j in inside:
                raise ValueError("Table range mismatch " + str(i+1))
            unit=tl["units"][j]
            kind=unit["kind"]
            style=("Heading 2" if kind=="heading"
                   else "TG Question" if kind=="question"
                   else "TG Answer" if kind=="answer"
                   else "TG Insight" if kind=="insight"
                   else "Normal")
            p=doc.add_paragraph(unit["text"],style)
            for name in unit.get("images",[]):
                image_slots+=1
                image_embedded+=int(image_run(p,name))
            unit_total+=1
            j+=1
        doc.add_paragraph(tl.get("application") or
                          "Paglalapat: Ilapit ang aral kay Hesus sa iyong pang-araw-araw na buhay.",
                          "TG Application")
        doc.add_paragraph(tl.get("response") or
                          "Paano ka tutugon kay Hesus?", "TG Response")
    return doc,{"study_count":len(sections),"unit_count":unit_total,
                "image_positions":image_slots,"images_embedded":image_embedded,
                "image_replacement_slots":image_slots-image_embedded}

def prepare_html(english):
    html=english.replace('<html lang="en">','<html lang="tl">')
    html=html.replace('Teachers’ Guide | End Time Bible Studies','Gabay ng Guro | End Time Bible Studies')
    html=html.replace('src="../site-config.js"','src="../../../site-config.js"')
    html=html.replace('href="../links/"','href="../../../links/"')
    html=html.replace("../teachers-guide/study-data.json","./study-data.json")
    html=html.replace("../teachers-guide/kjv-verses.json","../../kjv-verses.json")
    html=html.replace("../teachers-guide/assets/","../../assets/")
    html=html.replace("../teachers-guide/study-pdfs/","../../study-pdfs/")
    html=html.replace("const TEACHERS_TL_PUBLISHED=false;","const TEACHERS_TL_PUBLISHED=true;")
    html=html.replace("const TEACHERS_TL_URL='./tl/';","const TEACHERS_TL_URL='../../index.html';")
    replacements = {
      "Teachers’ Guide":"Gabay ng Guro",
      "Study Library":"Aklatan ng mga Pag-aaral",
      "Guided Teaching":"Gabay sa Pagtuturo",
      "Main study Scriptures":"Mga Pangunahing Talata",
      "Supplementary Scriptures":"Mga Karagdagang Talata",
      "Main study":"Pangunahing Pag-aaral",
      "Supplementary":"Karagdagan",
      "Help / Feedback":"Tulong / Puna",
      "Scriptures":"Mga Talata sa Biblia",
      "Previous":"Nakaraan",
      "Next":"Susunod",
      "Search":"Maghanap",
      "Share study PDF":"Ibahagi ang PDF (Ingles)",
      "No primary Scripture readings were marked.":"Walang nakatalang pangunahing talata.",
      "No additional Scripture references in this study.":"Walang karagdagang talata sa pag-aaral na ito.",
      "Main readings are separated from additional references in the teaching and optional material.":"Hiwalay ang pangunahing talata at mga karagdagang sanggunian.",
      "Your message has been sent. Thank you.":"Naipadala ang mensahe. Salamat.",
      "Please refresh or contact Help / Feedback if the issue persists.":"I-refresh ang pahina o gamitin ang Tulong / Puna kung magpapatuloy ang problema.",
    }
    # Avoid altering CSS class names and script identifiers: only literal
    # user-facing text and quoted JavaScript display strings are localized.
    for a,b in replacements.items():
        html=html.replace(">"+a+"<",">"+b+"<")
        html=html.replace("'"+a+"'","'"+b+"'")
        html=html.replace('"'+a+'"','"'+b+'"')
    # The TL preview links to the English PDFs until new PDFs are prepared.
    html=html.replace("const TEACHERS_TL_URL='../../index.html';",
                      "const TEACHERS_TL_URL='../../index.html';")
    return html

def main():
    eng=load(ROOT/"study-data.json")
    sections=eng["sections"]
    translated=[load(WORK/f"study_{i:02d}.json") for i in range(1,29)]
    mapping=load(ROOT/"teaching-map.json")
    table_data=load(ROOT/"table-layouts.json")
    assert len(sections)==len(translated)==len(mapping["studies"])==28
    issues=[]
    for i,(a,b,m) in enumerate(zip(sections,translated,mapping["studies"]),1):
        if a["id"] != b["id"] or len(a["units"]) != len(b["units"]):
            issues.append(f"Study {i}: ID/count")
        if a["verses"] != b["verses"]:
            issues.append(f"Study {i}: Scripture metadata")
        if len(a["units"]) != m["source_unit_count"]:
            issues.append(f"Study {i}: stage metadata")
        for j,(x,y) in enumerate(zip(a["units"],b["units"])):
            if x["kind"] != y["kind"] or x.get("images",[]) != y.get("images",[]):
                issues.append(f"Study {i} unit {j}: kind/image")
            if x.get("text","").strip() and not y.get("text","").strip():
                issues.append(f"Study {i} unit {j}: empty translation")
    if issues:
        raise ValueError("Translation not safe to build: "+", ".join(issues[:15]))
    source_total=sum(len(s["units"]) for s in sections)
    source_images=sum(len(u.get("images",[])) for s in sections for u in s["units"])
    if not source_total or not source_images:
        raise ValueError("Source study units/images could not be counted")
    # Keep source-unit identity, images, and all Scripture metadata unchanged.
    combined=copy.deepcopy(eng)
    for section,tl in zip(combined["sections"],translated):
        section["title"]=tl["title"]
        for u,v in zip(section["units"],tl["units"]):
            u["text"]=v["text"]
    store(WORK/"study-data.tl.json",combined)
    REVIEW.mkdir(parents=True,exist_ok=True)
    store(REVIEW/"study-data.json",combined)
    tl_map=copy.deepcopy(mapping)
    for i,(item,tl) in enumerate(zip(tl_map["studies"],translated)):
        item["title"]=tl["title"]
        item["purpose"]=tl["units"][1]["text"]
        item["central_truth"]=tl["units"][2]["text"]
        item["application"]={"text":tl.get("application",""),"origin":"Tagalog review"}
        item["response"]={"text":tl.get("response",""),"origin":"Tagalog review"}
        for k,g in enumerate(item["groups"],1):
            g["label"]=stage_heading(tl,g,k)
    store(REVIEW/"teaching-map.json",tl_map)
    tables=copy.deepcopy(table_data)
    for t in tables["tables"]:
        t["study_title"]=translated[t["study_id"]]["title"]
        if "caption" in t:
            t["caption"]="Talahanayan: "+translated[t["study_id"]]["title"]
    store(REVIEW/"table-layouts.json",tables)
    for n in ("related-study-resources.json","main-pathway-enrichments.json","main-historical-notes.json"):
        shutil.copyfile(ROOT/n,REVIEW/n)
    html=prepare_html((ROOT/"index.html").read_text("utf-8"))
    (REVIEW/"index.html").write_text(html,encoding="utf-8")
    doc,stats=make_word(sections,translated,mapping,table_data["tables"])
    assert stats["unit_count"]==source_total and stats["image_positions"]==source_images
    word=REVIEW/"Teachers_Guide_V2_TL_Master.docx"
    doc.save(word)
    reopened=Document(word)
    assert sum(p.style.name=="Heading 1" for p in reopened.paragraphs)==28
    assert sum(p.style.name=="TG Stage" for p in reopened.paragraphs)>=28
    assert len(reopened.tables)>=2
    assert len(html)>25000 and 'lang="tl"' in html
    assert "fetch('./study-data.json'" in html
    assert "fetch('./teaching-map.json'" in html
    audit={
        "language":"tl",
        "status":"unpublished_first_pass_review",
        **stats,
        "complete_study_units":True,
        "scripture_metadata_unchanged":True,
        "study_order_unchanged":True,
        "supplemental_stages_preserved":True,
        "supporting_metadata_note":"Supporting enrichment/resource prose still requires separate Tagalog verification.",
        "english_source_sha256":hashlib.sha256((ROOT/"study-data.json").read_bytes()).hexdigest(),
        "word_bytes":word.stat().st_size,
    }
    store(REVIEW/"translation-audit.json",audit)
    package=REVIEW/"Teachers_Guide_V2_TL_Review_Package.zip"
    with zipfile.ZipFile(package,"w",zipfile.ZIP_DEFLATED) as z:
        for f in sorted(REVIEW.iterdir()):
            if f.is_file() and f!=package:
                z.write(f,f.name)
    print(json.dumps(audit,ensure_ascii=False),flush=True)
if __name__=="__main__":
    main()
