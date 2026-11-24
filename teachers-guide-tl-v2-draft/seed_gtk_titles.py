#!/usr/bin/env python3
"""Seed Tagalog Teacher titles from the approved GTKJ Tagalog studies.

Only exact cross-study IDs are used. This script does NOT translate teaching
paragraphs or mark the resulting catalog as complete.
"""
import argparse
import json
import re
from pathlib import Path
from prepare_tl_catalog import prepare, validate


def lessons(path):
    text=path.read_text(encoding="utf-8")
    found=re.search(r"const\s+STUDIES\s*=\s*(\[[\s\S]*?\]);",text)
    if not found:
        raise ValueError("GTKJ Tagalog studies JSON declaration is missing.")
    data=json.loads(found.group(1))
    if len(data)!=28 or len({item["id"] for item in data})!=28:
        raise ValueError("Expected 28 unique translated GTKJ studies.")
    return {item["id"]:item for item in data}


def seed(site, tl_lessons, output):
    catalog=prepare(site)
    related=json.loads((site/"related-study-resources.json").read_text(encoding="utf-8"))["items"]
    if len(related)!=28:
        raise ValueError("Expected 28 teacher study mappings.")
    translations={}
    for item in related:
        index=item["teacher_study_id"]
        key=item["gtk_source_id"]
        if key not in tl_lessons:
            raise ValueError("Missing Tagalog counterpart for "+key)
        name=tl_lessons[key]["title"].strip()
        if not name:
            raise ValueError("Empty translated title for "+key)
        translations[f"study-data.json#/sections/{index}/title"]=name
        translations[f"teaching-map.json#/studies/{index}/title"]=name
        translations[f"related-study-resources.json#/items/{index}/gtk_title"]=name
    updated=0
    for entry in catalog["items"]:
        if entry["source_id"] in translations:
            entry["tagalog"]=translations[entry["source_id"]]
            updated+=1
    catalog["status"]="PARTIAL translation seed only — not a deployable Tagalog website"
    catalog["seed_source"]="tl/lessons.js approved Tagalog study titles"
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    check=validate(site,catalog)
    if check["translated"]!=updated or check["ready"]:
        raise ValueError("Title seed unexpectedly marked a partial translation complete.")
    print(f"Seeded {updated} exact teacher-title fields; {len(check['missing'])} other fields still require full translation.")
    return updated


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True)
    p.add_argument("--gtk-tl-lessons",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    seed(args.site,lessons(args.gtk_tl_lessons),args.out)


if __name__=="__main__":
    main()
