#!/usr/bin/env python3
"""Build independent Tagalog V2 content and Word master from approved English V2 JSON.
This generator fails closed if translation is unavailable; it never publishes EN as TL.
"""
import json, os, re, shutil, tempfile, time, hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests
from bs4 import BeautifulSoup, Comment, NavigableString
from docx import Document
from docx.shared import Inches, Pt

BASE=Path(__file__).resolve().parents[1]/'teachers-guide'
OUT=BASE/'tl'
NAMES=['study-data.json','teaching-map.json','main-pathway-enrichments.json','main-historical-notes.json','related-study-resources.json','table-layouts.json']
SKIP={'id','kind','type','images','image','url','href','slug','status','source','sources',
'source_blob_sha','source_versions','source_sites','source_unit_count','study_id',
'start','end','path','filename','file','class','tag','hash','anchor','review_status',
'verses','scripture_ref','verse_reference','reference','references','chapter_verse'}
REF=re.compile(r'\b(?:(?:[1-3]\s*)?(?:Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut(?:eronomy)?|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Hosea|Joel|Amos|Jonah|Micah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Hebrews|James|Peter|Jude|Revelation|Rev|Ps|Isa|Dan|Matt?|Cor|Tim|Pet|Gen|Ex|Rom))\.?\s+\d+(?::\d+(?:[-–]\d+)?)?',re.I)
LABELS={'Teachers’ Guide':'Gabay ng mga Guro',"Teacher's Guide":'Gabay ng mga Guro',
'Study Library':'Aklatan ng mga Pag-aaral','Guided Teaching':'Gabay sa Pagtuturo',
'Help / Feedback':'Tulong / Puna','Home':'Tahanan','Previous':'Nakaraan',
'Next':'Susunod','Close':'Isara','Search':'Maghanap','Send message':'Ipadala ang mensahe',
'Your message':'Iyong mensahe','Reason':'Dahilan','Country':'Bansa',
'Name (optional)':'Pangalan (opsyonal)','Help with a study':'Tulong sa pag-aaral',
'Correction or feedback':'Pagwawasto o puna','Website problem':'Problema sa website',
'Other question':'Ibang tanong'}
CACHE=Path(__file__).resolve().parent/'.teacher-tl-cache.json'
memo=json.loads(CACHE.read_text('utf8')) if CACHE.exists() else {}
calls=0
def save():
 t=CACHE.with_suffix('.tmp');t.write_text(json.dumps(memo,ensure_ascii=False),'utf8');t.replace(CACHE)
def translate(s):
 global calls
 if not isinstance(s,str) or not s.strip():return s
 if s in LABELS:return LABELS[s]
 if s in memo:return memo[s]
 if s.startswith(('http:','https:','assets/','#','data:')) or REF.fullmatch(s.strip()) or re.fullmatch(r'[\d\s.,():;/\-–]+',s):return s
 preserved={}
 def store(m):
  k='XQREF'+str(len(preserved)).zfill(4)+'XQ';preserved[k]=m.group();return k
 protected=REF.sub(store,s)
 pieces=[]
 while len(protected)>2600:
  i=max(protected.rfind(' ',0,2600),protected.rfind('\n',0,2600))
  if i<800:i=2600
  pieces.append(protected[:i]);protected=protected[i:]
 pieces.append(protected)
 result=''
 for piece in pieces:
  for attempt in range(8):
   try:
    response=requests.get('https://translate.googleapis.com/translate_a/single',
      params={'client':'gtx','sl':'en','tl':'tl','dt':'t','q':piece},timeout=40)
    response.raise_for_status()
    translated=''.join(c[0] or '' for c in response.json()[0])
    if not translated.strip():raise ValueError('Empty translation')
    result+=translated;break
   except Exception as exc:
    if attempt==7:raise RuntimeError('Translation service failed; no English fallback') from exc
    time.sleep(min(25,(attempt+1)*3))
 for token,original in preserved.items():
  result=re.sub(r'\s*'.join(map(re.escape,token)),lambda _:original,result,flags=re.I)
 result=re.sub(r'\bJesus\b','Hesus',result,flags=re.I)
 return result
def pretranslate_all():
 # Prepare unique JSON and interface strings before generating content.
 # Requests run concurrently, rather than taking one network round-trip
 # for every teaching unit and resource in sequence.
 pending=set()
 def collect(value,key=''):
  if isinstance(value,dict):
   for k,v in value.items():collect(v,k)
  elif isinstance(value,list):
   for v in value:collect(v,key)
  elif isinstance(value,str) and key not in SKIP and value.strip():
   pending.add(value)
 for name in NAMES:
  collect(json.loads((BASE/name).read_text('utf8')))
 html=BeautifulSoup((BASE/'index.html').read_text('utf8'),'html.parser')
 for node in html.find_all(string=True):
  if not isinstance(node,Comment) and node.parent.name not in ('script','style','pre','code','noscript') and node.strip():
   pending.add(str(node))
 for el in html.find_all(True):
  for key in ('title','alt','aria-label','placeholder'):
   if el.has_attr(key) and isinstance(el[key],str):pending.add(el[key])
 pending.difference_update(memo)
 pending.difference_update(LABELS)
 total=len(pending)
 if not total:return
 print('Translating',total,'unique remaining texts using concurrent requests',flush=True)
 completed=0
 errors=[]
 with ThreadPoolExecutor(max_workers=10) as pool:
  futures={pool.submit(translate,item):item for item in pending}
  for future in as_completed(futures):
   item=futures[future]
   try:memo[item]=future.result()
   except Exception as exc:errors.append((item[:75],str(exc)))
   completed+=1
   if completed%40==0:
    save()
    print('Completed:',completed,'of',total,'failed:',len(errors),flush=True)
 save()
 if errors:
  raise RuntimeError(str(len(errors))+' translations failed, first: '+repr(errors[:3]))
def tree(value,key=''):
 if isinstance(value,dict):return {k:tree(v,k) for k,v in value.items()}
 if isinstance(value,list):return [tree(v,key) for v in value]
 if isinstance(value,str) and key not in SKIP:return translate(value)
 return value
def html_translate(text):
 soup=BeautifulSoup(text,'html.parser')
 if soup.html:soup.html['lang']='tl'
 for node in soup.find_all(string=True):
  if isinstance(node,Comment) or node.parent.name in ('script','style','pre','code','noscript'):continue
  if node.strip():node.replace_with(NavigableString(translate(str(node))))
 for element in soup.find_all(True):
  for attr in ('title','alt','aria-label','placeholder'):
   if element.has_attr(attr) and isinstance(element[attr],str):
    element[attr]=translate(element[attr])
 text=str(soup).replace('src="../site-config.js"','src="../../site-config.js"')
 for en,tl in LABELS.items():
  for quote in ("'",'"'):
   text=text.replace(quote+en+quote,quote+tl+quote)
 return text
def word(studies,path,assets):
 doc=Document();doc.styles['Normal'].font.name='Aptos';doc.styles['Normal'].font.size=Pt(10)
 for section in studies:
  if section['id']:doc.add_page_break()
  doc.add_heading(section['title'],1)
  for unit in section['units']:
   p=doc.add_paragraph(style='Heading 2' if unit['kind']=='heading' else 'Normal')
   p.add_run(unit['text'])
   for name in unit.get('images',[]):
    f=assets/name
    try:
     if f.is_file():p.add_run().add_picture(str(f),width=Inches(4.4))
     else:p.add_run(' [IMAGE TO REPLACE: '+name+']')
    except Exception:p.add_run(' [IMAGE TO REPLACE: '+name+']')
 doc.save(path)
def build():
 en=json.loads((BASE/NAMES[0]).read_text('utf8'))['sections']
 assert len(en)==28
 pretranslate_all()
 with tempfile.TemporaryDirectory(prefix='v2-tl-') as temp:
  stage=Path(temp)/'tl'
  shutil.copytree(BASE,stage,ignore=lambda folder,names: {'tl','study-pdfs','.git'}.intersection(names))
  for name in NAMES:
   translated=tree(json.loads((BASE/name).read_text('utf8')))
   (stage/name).write_text(json.dumps(translated,ensure_ascii=False,indent=2)+'\n','utf8')
   save()
  tl=json.loads((stage/NAMES[0]).read_text('utf8'))['sections']
  assert len(tl)==28
  for source,target in zip(en,tl):
   assert source['id']==target['id']
   assert len(source['units'])==len(target['units'])
   assert [u['kind'] for u in source['units']]==[u['kind'] for u in target['units']]
   if source['verses'] != target['verses']:
   raise ValueError('Study %d Scripture reference list changed in translation' % (source['id'] + 1))
  (stage/'index.html').write_text(html_translate((BASE/'index.html').read_text('utf8')),'utf8')
  assert 'lang="tl"' in (stage/'index.html').read_text('utf8')
  master=Path(temp)/'Teachers_Guide_V2_TL_Master.docx'
  word(tl,master,stage/'assets')
  assert master.stat().st_size>10000
  audit={'language':'tl','studies':28,'units':sum(len(s['units']) for s in tl),
  'source_sha256':hashlib.sha256((BASE/NAMES[0]).read_bytes()).hexdigest(),
  'translation':'machine generated; structure validated'}
  (stage/'translation-audit.json').write_text(json.dumps(audit,indent=2),'utf8')
  if OUT.exists():shutil.rmtree(OUT)
  shutil.move(str(stage),str(OUT))
  shutil.copy2(master,BASE/'Teachers_Guide_V2_TL_Master.docx')
 save()
 print('FINISHED',audit,flush=True)
if __name__=='__main__':build()
