#!/usr/bin/env python3
"""Integrity checks for independent Teachers' Guide V2 review mapping."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "teachers-guide" / "study-data.json"
MAP = HERE / "teaching-map.json"

def validate():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))["sections"]
    metadata = json.loads(MAP.read_text(encoding="utf-8"))["studies"]
    assert len(data) == len(metadata) == 28, "Unexpected study count"
    for i, (source, guide) in enumerate(zip(data, metadata)):
        assert guide["id"] == i
        assert guide["title"] == source["title"], f"Title mismatch: {i}"
        assert guide["source_unit_count"] == len(source["units"]), f"Source changed: {i}"
        groups = guide["groups"]
        assert groups and any(g["kind"] == "core" for g in groups), f"No core pathway: {i}"
        covered = []
        for g in groups:
            assert g["kind"] in ("core", "supplement")
            assert isinstance(g["label"], str) and g["label"].strip()
            assert 0 <= g["start"] <= g["end"] < len(source["units"]), (i, g)
            assert source["units"][g["start"]]["kind"] != "answer", f"Stage starts with answer: {i}, {g['label']}"
            covered.extend(range(g["start"], g["end"] + 1))
        assert len(covered) == len(set(covered)), f"Overlapping ranges: {i}"
        begin = min(covered)
        assert sorted(covered) == list(range(begin, len(source["units"]))), f"Lost or skipped teaching units: {i}"
        assert guide["application"]["text"] and guide["response"]["text"]
        assert guide["purpose"] and guide["central_truth"]
    print(f"PASS: {len(data)} studies; every original post-intro teaching item mapped exactly once; no orphan-answer stage starts.")

if __name__ == "__main__":
    validate()
