import React from 'react';

export default function PageLayout({edition,stories,onChange,onError}) {
 const h=React.createElement,items=edition.items||[],max=edition.maxPerPage||5;
 function update(id,patch){onChange({items:items.map(item=>item.storyId===id?{...item,...patch}:item)})}
 function move(id,page,before){const source=items.find(item=>item.storyId===id);if(!source||id===before)return;const rest=items.filter(item=>item.storyId!==id);if(rest.filter(item=>item.page===page).length>=max){onError(`Page ${page} already has ${max} stories.`);return}const next={...source,page};const index=before?rest.findIndex(item=>item.storyId===before&&item.page===page):-1;if(index>=0)rest.splice(index,0,next);else {let last=-1;rest.forEach((item,i)=>{if(item.page===page)last=i});rest.splice(last<0?rest.length:last+1,0,next)}onChange({items:rest})}
 function drop(e,page,before){e.preventDefault();e.stopPropagation();move(e.dataTransfer.getData("text/plain"),page,before)}
 function option(v,text){return h("option",{key:v,value:v},text)}
 function card(item,page){
  const story=stories.find(s=>s.id===item.storyId),name=story?.title||"Story unavailable";
  const pageSelect=h("select",{"aria-label":`Move ${name} to page`,value:item.page,onChange:e=>move(item.storyId,Number(e.target.value))},[1,2,3,4].map(p=>option(p,`Page ${p}`)));
  const widthSelect=h("select",{"aria-label":`Width for ${name}`,value:item.width||"auto",onChange:e=>update(item.storyId,{width:e.target.value})},[option("auto","Automatic"),option("full","Full page"),option("half","Half page"),option("third","One third")]);
  const alignSelect=h("select",{"aria-label":`Text alignment for ${name}`,value:item.align||"auto",onChange:e=>update(item.storyId,{align:e.target.value})},["auto","left","center","right","justify"].map(v=>option(v,v==="auto"?"Automatic":v)));
  const controls=h("div",{className:"layout-controls"},h("label",null,"Move to page",pageSelect),h("label",null,"Width",widthSelect),h("label",null,"Text align",alignSelect));
  return h("article",{key:item.storyId,className:"page-layout-story",draggable:true,onDragStart:e=>{e.dataTransfer.setData("text/plain",item.storyId);e.dataTransfer.effectAllowed="move"},onDragOver:e=>e.preventDefault(),onDrop:e=>drop(e,page,item.storyId)},h("div",{className:"drag-head"},h("span",{"aria-label":"Drag story"},"⋮⋮"),h("b",null,name)),controls);
 }
 function zone(page){const selected=items.filter(i=>i.page===page);return h("div",{key:page,className:"page-zone",onDragOver:e=>e.preventDefault(),onDrop:e=>drop(e,page)},h("div",{className:"page-zone-title"},h("b",null,`Page ${page}`),h("small",null,`${selected.length} / ${max}`)),selected.length?selected.map(item=>card(item,page)):h("p",{className:"page-zone-empty"},"Drop a story here"))}
 return h("section",{className:"page-layout","aria-label":"Drag and drop page layout"},h("div",{className:"page-layout-head"},h("div",null,h("h3",null,"Arrange your newspaper"),h("p",null,"Drag a story to a page or above another story. Choose its width and alignment.")),h("span",null,"4 PAGES")),h("div",{className:"page-layout-grid"},[1,2,3,4].map(zone)));
}
