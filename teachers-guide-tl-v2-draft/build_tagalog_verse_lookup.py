#!/usr/bin/env python3
"""Build a single teacher-compatible 1905 Tagalog Bible lookup from GTKJ TL.

The approved GTKJ Tagalog files already use canonical keys such as
"Genesis 1:1". The Teachers Guide KJV popup expects the same flat key format.
This utility copies the verse text; it does not alter or translate Scripture.
"""
import argparse
import json
from pathlib import Path


def merge(source):
    files=sorted(source.glob("part-*.json"))
    if len(files)<10:
        raise ValueError("Tagalog Bible parts are missing.")
    merged={}
    for file in files:
        data=json.loads(file.read_text(encoding="utf-8"))
        for reference,verse in data.items():
            if not isinstance(verse,str) or not verse.strip():
                raise ValueError(f"Empty Tagalog verse {reference} in {file.name}")
            if reference in merged and merged[reference]!=verse:
                raise ValueError(f"Conflicting Tagalog verse {reference}")
            merged[reference]=verse
    if len(merged)<30000:
        raise ValueError(f"Tagalog Bible appears incomplete: only {len(merged)} verses")
    for reference in ("Genesis 1:1","John 3:16","Revelation 22:21"):
        if reference not in merged:
            raise ValueError(f"Expected verse missing: {reference}")
    return merged


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    verses=merge(args.source)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(verses,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(f"Prepared {len(verses)} unchanged Tagalog 1905 Bible verse entries.")


if __name__=="__main__":
    main()
