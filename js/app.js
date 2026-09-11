import {getAllNotes,saveNote} from './storage/database.js';
import {debounce} from './storage/autosave.js';
import {bindEditorToolbar,formatBlock,statsFromHTML} from './editor/editor.js';

const el=id=>document.getElementById(id);
const editor=el('editor'), title=el('documentTitle'), saveState=el('saveState');
let notes=[], currentId=null, showingLibrary=false;

const starter=`<h1>アイデアを、そのまま形に。</h1><p>書き始めるまでは軽く、書き始めたら強い。これは <b>NoteOne</b> の最初のプロトタイプです。</p><h2>今日のノート</h2><p>大学の講義、レポート、アイデアまで1つの場所で整理できます。</p><ul><li>Apple Notesのようにすぐ書ける</li><li>Wordのように書式設定できる</li><li>Google Driveとの同期を今後追加</li></ul>`;

function newId(){return crypto.randomUUID?.()||String(Date.now())}
function createNote(seed=false){return {id:newId(),title:seed?'はじめてのNoteOne':'無題のノート',html:seed?starter:'',updatedAt:Date.now()}}
function preview(n){const d=document.createElement('div');d.innerHTML=n.html;return (d.innerText||'新しいノート').replace(/\s+/g,' ').slice(0,54)}
function dateText(ts){const d=new Date(ts);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}

async function init(){
  bindEditorToolbar();
  notes=await getAllNotes();
  if(!notes.length){const first=createNote(true);await saveNote(first);notes=[first]}
  renderLists(); openNote(notes[0].id); bindUI(); applyAutoMode();
}
function renderLists(filter=''){
  const q=filter.trim().toLowerCase();
  const items=notes.filter(n=>!q||n.title.toLowerCase().includes(q)||preview(n).toLowerCase().includes(q));
  const html=items.map(n=>`<div class="note-item ${n.id===currentId?'active':''}" data-note-id="${n.id}"><strong>${escapeHTML(n.title||'無題のノート')}</strong><p>${dateText(n.updatedAt)} · ${escapeHTML(preview(n))}</p></div>`).join('');
  el('noteList').innerHTML=html; el('mobileNoteList').innerHTML=html; el('noteCount').textContent=notes.length;
  document.querySelectorAll('[data-note-id]').forEach(node=>node.onclick=()=>{openNote(node.dataset.noteId);hideMobileLibrary()});
}
function openNote(id){
  const n=notes.find(x=>x.id===id); if(!n)return; currentId=id; title.value=n.title; editor.innerHTML=n.html; updateStats(); renderLists();
}
async function addNote(){const n=createNote();notes.unshift(n);await saveNote(n);renderLists();openNote(n.id);hideMobileLibrary();editor.focus()}
const persist=debounce(async()=>{
  const n=notes.find(x=>x.id===currentId);if(!n)return; n.title=title.value.trim()||'無題のノート';n.html=editor.innerHTML;n.updatedAt=Date.now();
  saveState.textContent='保存中…';await saveNote(n);saveState.textContent='保存済み';notes.sort((a,b)=>b.updatedAt-a.updatedAt);renderLists();
},420);
function onEdit(){saveState.textContent='変更あり';updateStats();persist()}
function updateStats(){const s=statsFromHTML(editor);el('wordCount').textContent=`${s.chars}文字`;el('statChars').textContent=s.chars;el('statBlocks').textContent=s.blocks}
function bindUI(){
  editor.addEventListener('input',onEdit);title.addEventListener('input',onEdit);
  el('newNoteButton').onclick=addNote;el('mobileNewNote').onclick=addNote;
  el('searchInput').oninput=e=>renderLists(e.target.value);el('mobileSearch').oninput=e=>renderLists(e.target.value);
  el('blockSelect').onchange=e=>{formatBlock(e.target.value);editor.focus();onEdit()};
  el('undoButton').onclick=()=>document.execCommand('undo');el('redoButton').onclick=()=>document.execCommand('redo');el('mobileUndo').onclick=()=>document.execCommand('undo');
  el('backButton').onclick=()=>showMobileLibrary();
  el('mobileStyle').onclick=()=>el('styleSheet').hidden=false;
  el('styleSheet').onclick=e=>{if(e.target===el('styleSheet'))el('styleSheet').hidden=true};
  document.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{formatBlock(b.dataset.block);el('styleSheet').hidden=true;editor.focus();onEdit()});
  el('modeToggle').onclick=cycleMode;window.addEventListener('resize',applyAutoMode);
}
function showMobileLibrary(){el('mobileLibrary').classList.add('is-open');showingLibrary=true}
function hideMobileLibrary(){el('mobileLibrary').classList.remove('is-open');showingLibrary=false}
function cycleMode(){const app=el('app');const modes=['auto','mobile','desktop'];const next=modes[(modes.indexOf(app.dataset.mode)+1)%modes.length];app.dataset.mode=next;el('modeToggle').textContent=next==='auto'?'自動':next==='mobile'?'モバイル':'PC';applyAutoMode()}
function applyAutoMode(){const app=el('app');if(app.dataset.mode==='mobile'&&innerWidth>900){document.querySelectorAll('.mobile-only').forEach(()=>{});}if(innerWidth>900)hideMobileLibrary()}
function escapeHTML(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
init();
