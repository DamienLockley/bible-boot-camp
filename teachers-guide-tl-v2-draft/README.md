# Teachers’ Guide — Tagalog V2 preparation

The English V2 master now exists. This separate draft branch prepares a
**full-length** Tagalog Teachers’ Guide; it does not publish a partial or
English-language substitute at /teachers-guide/tl/.

The source alignment tool `prepare_tl_catalog.py` makes a translation
inventory for all 28 studies, every source teaching paragraph, purpose,
central truth, named stage, question, answer, application, and related
Daniel/Revelation notes. Translation coverage is checked by stable source
IDs, not guessed HTML positions.

Usage:
```
python teachers-guide-tl-v2-draft/prepare_tl_catalog.py \
  --site teachers-guide \
  --catalog Teachers_Guide_TL_Translation_Catalog.json --prepare

python teachers-guide-tl-v2-draft/prepare_tl_catalog.py \
  --site teachers-guide \
  --catalog Teachers_Guide_TL_Translation_Catalog.json
```

The second command **refuses** to report ready until all catalog fields are
translated. A completed Tagalog Word master must also retain all 28 studies,
all supplementary teaching, tables and illustration positions. Once the
translation is reviewed, the TL website can mirror the English V2 layout and
generate its own new study PDFs.

The current branch is only translation preparation. It does not contain a
completed Tagalog translation or a deployable TL site.
