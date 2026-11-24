#!/usr/bin/env python3
"""Teachers' Guide V2 Tagalog edition: passage-based AI translation and Word export.

Uses GitHub Models inference (GITHUB_TOKEN with models:read), not Google Translate.
Translates groups of related content in context and saves validated translations
after each group. Never publishes English substitutions on translation failures.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import time

import requests
from bs4 import BeautifulSoup, Comment, NavigableString
from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.shared import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'teachers-guide'
TARGET = SITE / 'tl'
CACHE = ROOT / 'tools' / '.teacher-v2-ai-tl-cache.json'
JSON_FILES = ('study-data.json','teaching-map.json','main-pathway-enrichments.json',
              'main-historical-notes.json','related-study-resources.json','table-layouts.json')
PRESERVE = {
    'id','kind','type','images','image','url','href','slug','status','source',
    'sources','source_blob_sha','source_versions','source_sites','source_unit_count',
    'study_id','start','end','path','filename','file','class','tag','hash','anchor',
    'review_status','verses','scripture_ref','scripture_ref_list','references',
    'verse_reference','chapter_verse','language','lang','selector','external_url'
}
REFERENCE = re.compile(
    r'\b(?:[1-3]\s*)?(?:Genesis|Gen|Exodus|Ex|Leviticus|Lev|Numbers|Num|'
    r'Deuteronomy|Deut|Joshua|Josh|Judges|Judg|Ruth|Samuel|Sam|Kings|'
    r'Chronicles|Chron|Chr|Ezra|Nehemiah|Neh|Esther|Est|Job|Psalms?|Ps|'
    r'Proverbs|Prov|Ecclesiastes|Eccl|Song of Solomon|Song|Isaiah|Isa|'
    r'Jeremiah|Jer|Lamentations|Lam|Ezekiel|Ezek|Daniel|Dan|Hosea|Hos|'
    r'Joel|Amos|Obadiah|Obad|Jonah|Micah|Nahum|Habakkuk|Hab|Zephaniah|'
    r'Zeph|Haggai|Hag|Zechariah|Zech|Malachi|Mal|Matthew|Matt|Mat|Mark|'
    r'Luke|John|Jn|Acts|Romans|Rom|Corinthians|Cor|Galatians|Gal|'
    r'Ephesians|Eph|Philippians|Phil|Colossians|Col|Thessalonians|Thess|'
    r'Timothy|Tim|Titus|Philemon|Philem|Hebrews|Heb|James|Jas|Peter|Pet|'
    r'Jude|Revelation|Rev)\.?\s*\d+(?:\s*[:：]\s*\d+(?:\s*[-–—]\s*\d+)?)?',
    re.I)
MODEL = os.environ.get('TEACHER_TL_MODEL', 'openai/gpt-4.1-mini')
API = 'https://models.github.ai/inference/chat/completions'
TOKEN = os.environ.get('GITHUB_TOKEN','')
mem = json.loads(CACHE.read_text('utf-8')) if CACHE.is_file() else {}
HEADINGS = {
    'Teachers’ Guide': 'Gabay ng mga Guro',
    "Teacher's Guide": 'Gabay ng mga Guro',
    'Study Library': 'Aklatan ng mga Pag-aaral',
    'Home': 'Tahanan',
    'Help / Feedback': 'Tulong / Puna',
    'Main teaching pathway': 'Pangunahing Gabay sa Pagtuturo',
    'Guided Teaching': 'Gabay sa Pagtuturo',
    'Search': 'Maghanap',
    'Find words...': 'Maghanap ng mga salita...',
    'Your message': 'Iyong mensahe',
    'Send message': 'Ipadala ang mensahe',
    'Close': 'Isara',
    'Previous': 'Nakaraan',
    'Next': 'Susunod'
}

def save_cache():
    CACHE.parent.mkdir(parents=True,exist_ok=True)
    path = CACHE.with_suffix('.tmp')
    path.write_text(json.dumps(mem,ensure_ascii=False,indent=1),encoding='utf-8')
    path.replace(CACHE)

def hold(s):
    token_map={}
    def replace(m):
        token='REFCODE'+str(len(token_map)+1).zfill(5)+'END'
        token_map[token]=m.group()
        return token
    return REFERENCE.sub(replace,s), token_map

def restore(s, token_map):
    for token, original in token_map.items():
        # Allow extra spaces inserted by the translation model in a token.
        pattern=r'\s*'.join(map(re.escape,token))
        s, count=re.subn(pattern,lambda _:original,s,flags=re.I)
        if count != 1:
            raise ValueError('Scripture placeholder lost or duplicated: '+token)
    if re.search(r'\bREFCODE\d+END\b',s,re.I):
        raise ValueError('Unresolved Scripture placeholder')
    return s

def call_model(items):
    payload={'model':MODEL,'temperature':0.1,'max_tokens':6500,
      'response_format':{'type':'json_object'},
      'messages':[{'role':'system','content':
        'Translate these Bible-teaching passages from English into natural, clear Tagalog. '
        'Maintain the historicist Seventh-day Adventist framing present in the source. '
        'Translate faithfully; do not add, omit, correct, or reinterpret teaching. '
        'Use Hesus for Jesus. Preserve every REFCODE token verbatim and in order. '
        'Keep numbers, dates and reference markers. Return ONLY a JSON object with '
        'a translations array of objects with keys id and text, one per input id.'},
        {'role':'user','content':json.dumps({'passages':items},ensure_ascii=False)}]}
    for attempt in range(9):
        try:
            response=requests.post(API,headers={'Authorization':'Bearer '+TOKEN,
              'Content-Type':'application/json','Accept':'application/vnd.github+json'},
              json=payload,timeout=120)
            if response.status_code in (429,500,502,503,504):
                delay=min(100, 5*(attempt+1)**2)
                print('Model busy (HTTP '+str(response.status_code)+'); retrying',flush=True)
                time.sleep(delay)
                continue
            response.raise_for_status()
            parsed=response.json()
            result=json.loads(parsed['choices'][0]['message']['content'])
            values=result['translations']
            if not isinstance(values,list) or len(values)!=len(items):
                raise ValueError('Incomplete translation batch')
            output={str(row['id']):row['text'] for row in values}
            if set(output)!={str(row['id']) for row in items}:
                raise ValueError('Translation batch identifiers changed')
            return output
        except (requests.RequestException,ValueError,KeyError,TypeError) as exc:
            if attempt==8:
                raise RuntimeError('AI translation could not be validated. Source remains untouched') from exc
            time.sleep(min(100,4*(attempt+1)**2))
    raise RuntimeError('No translation result')

def translatable(s):
    if not isinstance(s,str) or not s.strip():return False
    if s.startswith(('http://','https://','assets/','data:','#')):return False
    if REFERENCE.fullmatch(s.strip()):return False
    if re.fullmatch(r'[\d\s,.:;()\[\]/+%&\-–—]+',s):return False
    return True

def gather(obj, key='', found=None):
    if found is None:found=set()
    if isinstance(obj,dict):
        for k,v in obj.items():gather(v,k,found)
    elif isinstance(obj,list):
        for v in obj:gather(v,key,found)
    elif key not in PRESERVE and translatable(obj):
        found.add(obj)
    return found

def translate_passages(source_strings):
    pending=[s for s in sorted(source_strings) if s not in mem and s not in HEADINGS]
    print('Passage-based Tagalog translation; outstanding texts:',len(pending),flush=True)
    if not pending:return
    # Group coherent sentences into fewer, larger model requests, rather
    # than sending thousands of individual network translations.
    batches=[]
    current=[]
    used=0
    for s in pending:
        length=len(s)
        if current and used+length>7300:
            batches.append(current);current=[];used=0
        current.append(s);used+=length
    if current:batches.append(current)
    print('Contextual AI batches:',len(batches),flush=True)
    for n,strings in enumerate(batches,1):
        prepared=[]
        token_maps={}
        for index,s in enumerate(strings):
            protected,tokens=hold(s)
            key=str(index)
            prepared.append({'id':key,'text':protected})
            token_maps[key]=tokens
        results=call_model(prepared)
        new={}
        for index,original in enumerate(strings):
            key=str(index)
            translated=restore(results[key],token_maps[key])
            if not translated.strip() or translated.strip()==original.strip() and len(original)>50:
                raise ValueError('No valid Tagalog translation for batch '+str(n))
            old_refs=[m.group() for m in REFERENCE.finditer(original)]
            new_refs=[m.group() for m in REFERENCE.finditer(translated)]
            if old_refs!=new_refs:
                raise ValueError('Scripture reference change in batch '+str(n)+': '+repr(old_refs[:4])+
                                 ' -> '+repr(new_refs[:4]))
            new[original]=translated
        mem.update(new)
        save_cache()
        print('Validated contextual translation batch',n,'/',len(batches),flush=True)

def map_tree(obj,key=''):
    if isinstance(obj,dict):
        return {k:map_tree(v,k) for k,v in obj.items()}
    if isinstance(obj,list):
        return [map_tree(v,key) for v in obj]
    if isinstance(obj,str) and key not in PRESERVE:
        return HEADINGS.get(obj,mem.get(obj,obj))
    return obj

def localized(s):
    return HEADINGS[s] if s in HEADINGS else mem.get(s,s)

def html_translate(html):
    soup=BeautifulSoup(html,'html.parser')
    soup.html['lang']='tl'
    if soup.title:soup.title.string='Gabay ng mga Guro | End Time Bible Studies'
    for node in soup.find_all(string=True):
        if isinstance(node,Comment) or node.parent.name in ('script','style','pre','code','noscript'):
            continue
        if translatable(str(node)):
            node.replace_with(NavigableString(localized(str(node))))
    for item in soup.find_all(True):
        for attr in ('title','alt','aria-label','placeholder'):
            if item.has_attr(attr) and translatable(item[attr]):
                item[attr]=localized(item[attr])
    page=str(soup).replace('src="../site-config.js"','src="../../site-config.js"')
    return page

def custom(doc,name):
    styles=doc.styles
    if name in styles:return name
    styles.add_style(name,WD_STYLE_TYPE.PARAGRAPH)
    return name

def make_word(sections,study_map,asset_dir,out):
    doc=Document()
    doc.styles['Normal'].font.name='Aptos'
    doc.styles['Normal'].font.size=Pt(10)
    for name in ('TG Stage','TG Extra','TG Purpose','TG Central Truth',
                 'TG Application','TG Response','TG Note',
                 'TG Main Scripture','TG Supplementary Scripture'):
        custom(doc,name)
    for n,(study,mapped) in enumerate(zip(sections,study_map['studies'])):
        if n:doc.add_page_break()
        doc.add_heading(study['title'],level=1)
        # Stage markers are editable Word paragraphs and deliberately
        # excluded by the V2 extractor when generating website content.
        begins={}
        for group in mapped['groups']:
            begins.setdefault(group['start'],[]).append(group)
        for i,unit in enumerate(study['units']):
            # Heading 1 is itself the first extracted teaching unit. Do not
            # write that first title again or all unit indices would shift.
            if i == 0 and unit.get('text','').strip() == study['title'].strip():
                continue
            for group in begins.get(i,[]):
                marker=doc.add_paragraph(group['label'])
                marker.style='TG Stage' if group['kind']=='core' else 'TG Extra'
            kind=unit['kind']
            style=('Heading 2' if kind=='heading' else
                   'TG Note' if kind in ('insight','question','answer','daniel') else
                   'TG Main Scripture' if unit.get('scripture_role')=='main' else
                   'TG Supplementary Scripture' if unit.get('scripture_role')=='supplementary'
                   else 'Normal')
            p=doc.add_paragraph(style=style)
            p.add_run(unit.get('text',''))
            for file in unit.get('images',[]):
                path=asset_dir/file
                if path.is_file():
                    try:
                        p.add_run().add_picture(str(path),width=Inches(4.1))
                    except Exception:
                        p.add_run(' [IMAGE TO REPLACE: '+file+']')
                else:p.add_run(' [IMAGE TO REPLACE: '+file+']')
    doc.save(out)

def validate(en,tl):
    if len(en)!=28 or len(tl)!=28:raise ValueError('Expected 28 studies')
    for a,b in zip(en,tl):
        if a['id']!=b['id']:raise ValueError('Study IDs changed')
        if len(a['units'])!=len(b['units']):raise ValueError('Study content units changed')
        if [x['kind'] for x in a['units']] != [x['kind'] for x in b['units']]:
            raise ValueError('Teaching unit roles changed')
        if a['verses']!=b['verses']:raise ValueError('Scripture lists changed')

def run():
    if not TOKEN:raise RuntimeError('Requires GITHUB_TOKEN with models: read')
    sources={name:json.loads((SITE/name).read_text('utf-8')) for name in JSON_FILES}
    all_text=set()
    for source in sources.values():gather(source,found=all_text)
    html=(SITE/'index.html').read_text('utf-8')
    soup=BeautifulSoup(html,'html.parser')
    for node in soup.find_all(string=True):
        if not isinstance(node,Comment) and node.parent.name not in ('script','style','pre','code','noscript') and translatable(str(node)):
            all_text.add(str(node))
    for element in soup.find_all(True):
        for attr in ('title','alt','aria-label','placeholder'):
            if element.has_attr(attr) and translatable(element[attr]):
                all_text.add(element[attr])
    translate_passages(all_text)
    with tempfile.TemporaryDirectory(prefix='teacher-tl-ai-') as temp:
        path=Path(temp)
        staging=path/'tl'
        shutil.copytree(SITE,staging,
            ignore=lambda folder,names:{'tl','study-pdfs','.git'}.intersection(names))
        for name,data in sources.items():
            result=map_tree(data)
            (staging/name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
        en=sources['study-data.json']['sections']
        tl=json.loads((staging/'study-data.json').read_text('utf-8'))['sections']
        validate(en,tl)
        page=html_translate(html)
        if '<html lang="tl"' not in page.lower():raise ValueError('Tagalog HTML language missing')
        (staging/'index.html').write_text(page,'utf-8')
        output=path/'Teachers_Guide_V2_TL_Master.docx'
        make_word(tl,json.loads((staging/'teaching-map.json').read_text('utf-8')),
                  staging/'assets',output)
        if output.stat().st_size<15000:raise ValueError('Tagalog Word master unexpectedly small')
        audit={'language':'tl','study_count':28,
          'unit_count':sum(len(x['units']) for x in tl),
          'source_sha256':hashlib.sha256((SITE/'study-data.json').read_bytes()).hexdigest(),
          'method':'contextual AI translation in validated passages'}
        (staging/'translation-audit.json').write_text(json.dumps(audit,indent=2)+'\n','utf-8')
        # Commit only completely validated output.
        if TARGET.exists():shutil.rmtree(TARGET)
        shutil.move(str(staging),str(TARGET))
        shutil.copy2(output,SITE/'Teachers_Guide_V2_TL_Master.docx')
    save_cache()
    print('Validated Tagalog Word and HTML generated',flush=True)

if __name__=='__main__':run()
