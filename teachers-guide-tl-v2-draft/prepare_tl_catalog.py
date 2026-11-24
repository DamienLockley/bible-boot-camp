#!/usr/bin/env python3
"""Prepare/validate a lossless Tagalog translation catalog for Teachers' Guide V2.

This does not machine-translate, shorten, or invent study content. The catalog
is a source-aligned checklist to be populated with approved Tagalog translations.
Publishing is blocked if even one display string is untranslated.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

SOURCE_FILES = (
    "study-data.json",
    "teaching-map.json",
    "main-pathway-enrichments.json",
    "main-historical-notes.json",
    "related-study-resources.json",
)
SOURCE_PATHS = {
    "study-data.json": ("title", "text"),
    "teaching-map.json": ("title", "purpose", "central_truth", "label", "text"),
    "main-pathway-enrichments.json": ("title", "explanation", "question", "suggested_answer"),
    "main-historical-notes.json": ("type", "title", "text"),
    "related-study-resources.json": (
        "gtk_title", "gtk_lead", "gtk_principle", "gtk_practice",
        "title", "insight", "question", "answer",
    ),
}


def read_json(folder, filename):
    return json.loads((folder / filename).read_text(encoding="utf-8"))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def child_segments(obj, path=()):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield from child_segments(value, path+(key,))
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            yield from child_segments(value, path+(index,))
    elif isinstance(obj, str):
        yield path, obj


def selected_paths(document, filename):
    accepted = set(SOURCE_PATHS[filename])
    for path, value in child_segments(document):
        if not value.strip() or not path or path[-1] not in accepted:
            continue
        # Don't translate technical metadata such as source-provenance descriptions.
        if "source_versions" in path or "source_blob_sha" in path:
            continue
        if filename == "study-data.json":
            if path[:1] != ("sections",):
                continue
            if path[-1] == "text" and "units" not in path:
                continue
        elif filename == "teaching-map.json":
            if path[:1] != ("studies",):
                continue
        elif filename == "main-pathway-enrichments.json":
            if path[:1] != ("studies",) or "teacher_guidance" not in path:
                continue
        elif filename == "main-historical-notes.json":
            if path[:1] != ("notes",):
                continue
        elif filename == "related-study-resources.json":
            if path[:1] != ("items",):
                continue
        yield path, value


def pointer(path):
    return "/"+"/".join(str(x).replace("~","~0").replace("/","~1") for x in path)


def source_id(filename, path):
    return filename+"#"+pointer(path)


def prepare(site):
    pages = {filename:read_json(site, filename) for filename in SOURCE_FILES}
    sections = pages["study-data.json"]["sections"]
    if len(sections)!=28:
        raise ValueError("Expected 28 Teachers Guide studies.")
    items = []
    for filename, data in pages.items():
        for path, value in selected_paths(data,filename):
            items.append({"source_id":source_id(filename,path),
                          "source":value,"tagalog":""})
    ids = [i["source_id"] for i in items]
    if len(set(ids))!=len(ids):
        raise ValueError("Duplicate translation IDs.")
    return {
        "schema":1,
        "status":"Translation review required — NOT a finished Tagalog site",
        "source_shas":{x:sha256(site/x) for x in SOURCE_FILES},
        "study_count":len(sections),
        "unit_count":sum(len(x["units"]) for x in sections),
        "items":items,
    }


def validate(site, catalog):
    fresh = prepare(site)
    if fresh["source_shas"]!=catalog.get("source_shas"):
        raise ValueError("English study source changed; reconcile translations before rebuilding.")
    translations = {x.get("source_id"):x for x in catalog.get("items",[])}
    if set(translations)!=set(x["source_id"] for x in fresh["items"]):
        raise ValueError("Tagalog translation catalog is missing/duplicating source IDs.")
    missing = []
    for item in fresh["items"]:
        entry = translations[item["source_id"]]
        if entry.get("source")!=item["source"] or not str(entry.get("tagalog","")).strip():
            missing.append(item["source_id"])
    return {
        "total":len(fresh["items"]),
        "translated":len(fresh["items"])-len(missing),
        "missing":missing,
        "ready":not missing,
    }


def main():
    parser=argparse.ArgumentParser(description="Tagalog Teachers Guide translation coverage guard")
    parser.add_argument("--site",type=Path,required=True)
    parser.add_argument("--catalog",type=Path,required=True)
    parser.add_argument("--prepare",action="store_true",help="Create an empty translation catalog")
    args=parser.parse_args()
    if args.prepare:
        catalog=prepare(args.site)
        args.catalog.parent.mkdir(parents=True,exist_ok=True)
        args.catalog.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("Prepared",len(catalog["items"]),"source-aligned Tagalog translation fields.")
    else:
        catalog=json.loads(args.catalog.read_text(encoding="utf-8"))
        result=validate(args.site,catalog)
        print("Tagalog coverage: %(translated)s / %(total)s. Ready=%(ready)s"%result)
        if result["missing"]:
            print("First missing source IDs:",", ".join(result["missing"][:20]))
            raise SystemExit(1)


if __name__=="__main__":
    main()
