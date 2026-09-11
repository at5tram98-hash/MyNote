export function exec(command, value=null){
  document.execCommand(command,false,value);
}
export function formatBlock(tag){
  document.execCommand('formatBlock',false,tag);
}
export function statsFromHTML(editor){
  const text=(editor.innerText||'').replace(/\n+$/,'');
  const blocks=[...editor.children].filter(el=>(el.innerText||'').trim()).length || (text.trim()?1:0);
  return {chars:text.length,blocks};
}
export function bindEditorToolbar(root=document){
  root.querySelectorAll('[data-command]').forEach(btn=>btn.addEventListener('click',()=>{exec(btn.dataset.command);document.getElementById('editor')?.focus();}));
}
