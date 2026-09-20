'use strict';
window.JOTI_CHATGPT=Object.freeze({
 projectUrl:'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/project',
 isChatUrl(value){
  try{
   const u=new URL(String(value||'').trim());
   return u.protocol==='https:'&&['chatgpt.com','www.chatgpt.com','chat.openai.com'].includes(u.hostname);
  }catch{return false;}
 },
 bindProjectLinks(root=document){
  root.querySelectorAll('[data-chatgpt-project]').forEach(a=>{
   a.href=this.projectUrl;
   a.target='_blank';
   a.rel='noopener';
  });
 }
});
document.addEventListener('DOMContentLoaded',()=>window.JOTI_CHATGPT.bindProjectLinks());
