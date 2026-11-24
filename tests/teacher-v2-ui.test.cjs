const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'teachers-guide/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const inline = scripts.map(x=>x[1]).find(x=>x.includes('function renderVerses()'));
assert.ok(inline, 'Main Teachers Guide script missing');
const documentHTML = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const dom = new JSDOM(documentHTML, {
  url: 'https://endtimebiblestudies.org/teachers-guide/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.SITE_CONFIG = { contactWebAppUrl: 'https://script.google.com/macros/s/TEST_ENDPOINT/exec' };
window.fetch = async url => {
  const name = new URL(url,window.location.href).pathname.split('/').pop();
  const file = path.join(root,'teachers-guide',name);
  assert.ok(fs.existsSync(file),'Site JSON missing: '+url);
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(file,'utf8')) };
};
window.eval(inline);
async function flush(){
  for(let n=0;n<80;n++){
    if(!document.getElementById('library').classList.contains('hidden'))break;
    await new Promise(resolve=>setTimeout(resolve,20));
  }
}
(async ()=>{
 await flush();
 const items=[...document.querySelectorAll('#library-list .lib-item')];
 assert.equal(items.length,28,'Expected all 28 studies in GTKJ order');
 assert.match(items[0].textContent,/The Word of God/);
 assert.match(items[1].textContent,/Historicity of Jesus/);
 assert.match(items[2].textContent,/The Great Controversy/);
 assert.equal(document.getElementById('sort'),null,'Order toggle must be absent');
 assert.equal(document.getElementById('study-number'),null,'Study number must be absent');
 assert.doesNotMatch(items[0].textContent,/^\s*1\./);
 assert.match(html,/#study-title\{font-size:clamp/);
 assert.match(html,/#library-list \.lib-item strong\{font-size:clamp/);
 items[0].click();
 assert.equal(document.getElementById('study-title').textContent,'The Word of God');
 document.getElementById('mode-verses').click();
 const columns=document.querySelectorAll('#verses-view .verse-group');
 assert.equal(columns.length,2,'Expected two separate Bible reference lists');
 assert.match(columns[0].textContent,/Main study Scriptures/);
 assert.match(columns[1].textContent,/Supplementary Scriptures/);
 assert.ok(columns[0].querySelectorAll('.bible-ref').length>0,'Missing core Scriptures');
 assert.ok(columns[1].querySelectorAll('.bible-ref').length>0,'Missing supplementary Scriptures');
 assert.ok(columns[0].querySelectorAll('.bible-ref').length < 12,'Legacy combined Word reference list must not all appear as main readings');
 assert.match(columns[0].textContent,/2 Tim 3:16/);
 assert.match(columns[1].textContent,/1 John 4:8|Daniel|John 3:16/);
 assert.ok(!columns[0].textContent.includes('1 John 4:8'),'Embedded supporting reference was incorrectly treated as a main reading');
 const originalData=JSON.parse(fs.readFileSync(path.join(root,'teachers-guide/study-data.json'),'utf8'));
 assert.ok(originalData.sections[0].verses.length>columns[0].querySelectorAll('.bible-ref').length,'Original combined verse list no longer determines main references');
 const language=document.getElementById('teacher-tl-button');
 assert.ok(language,'Tagalog flag language button missing');
 assert.match(language.textContent,/Tagalog/);
 const flag=language.querySelector('img.teacher-language-flag');
 assert.ok(flag,'Real Philippine flag image is missing (emoji-only flags fail on Windows)');
 assert.ok(flag.getAttribute('src').startsWith('data:image/svg+xml,'),'Flag must have embedded SVG graphics');
 assert.equal(flag.getAttribute('aria-hidden'),'true');
 assert.match(html,/\.teacher-language-flag\{/);
 language.click();
 assert.equal(document.getElementById('tagalog-notice').classList.contains('hidden'),false,
   'The unpublished Tagalog edition must not be opened as a broken link');
 document.getElementById('close-tagalog-notice').click();
 assert.equal(document.getElementById('tagalog-notice').classList.contains('hidden'),true);
 document.getElementById('help-feedback').click();
 assert.equal(document.getElementById('feedback-modal').classList.contains('hidden'),false,'Feedback must open locally');
 assert.ok(document.querySelectorAll('#feedback-country option').length>200);
 assert.ok(document.querySelector('#feedback-form input[name="postcode"][required]'));
 assert.equal(document.querySelector('a[href="https://endtimebiblestudies.org/#help"]'),null,'Feedback incorrectly leaves Teachers Guide');
 document.getElementById('close-feedback').click();
 assert.equal(document.getElementById('feedback-modal').classList.contains('hidden'),true);
 const search=document.getElementById('search');
 search.value='Lucifer';
 search.dispatchEvent(new window.Event('input',{bubbles:true}));
 const matches=document.querySelectorAll('[data-match-study][data-match-unit]');
 assert.ok(matches.length>0,'Find words must still search all studies');
 assert.ok(document.querySelectorAll('.search-results mark').length>0,'Matches must be highlighted');
 matches[0].click();
 await new Promise(resolve=>setTimeout(resolve,50));
 assert.ok(document.querySelector('#stage .search-target'),'Result should navigate to a teaching passage');
 console.log('PASS: 28 GTKJ-ordered studies, no numbers/sort, larger titles, two Scripture lists, local feedback form, and highlighted word-search navigation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
