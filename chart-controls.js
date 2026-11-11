(function(root){
 const compareName=(a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'});
 function sortRows(rows,order='date-asc',name=r=>r.name){
  const descending=order.endsWith('-desc'),byName=order.startsWith('name-');
  return [...rows].sort((a,b)=>{
   if(!byName&&(!a.date||!b.date))return a.date?-1:b.date?1:compareName(name(a),name(b));
   const primary=byName?compareName(name(a),name(b)):a.date.localeCompare(b.date);
   return primary?(descending?-primary:primary):compareName(name(a),name(b))||String(a.id||'').localeCompare(String(b.id||''));
  });
 }
 function bindPoints(svg,targets,{select,choose,preview,clear,suppress}){
  let gesture=null,timer=null,blockedUntil=0;
  const position=(clientX,clientY)=>{const box=svg.getBoundingClientRect(),view=svg.viewBox.baseVal;return {x:(clientX-box.left)*view.width/box.width,y:(clientY-box.top)*view.height/box.height}};
  const nearby=(p,radius)=>targets.map(t=>({...t,distance:Math.hypot(t.x-p.x,t.y-p.y)})).filter(t=>t.distance<=radius).sort((a,b)=>a.distance-b.distance||a.key.localeCompare(b.key));
  const stop=()=>{clearTimeout(timer);timer=null;if(gesture?.active)clear();gesture=null};
  const highlight=()=>{const {candidates,index}=gesture;preview(candidates[index],index,candidates.length)};
  svg.addEventListener('click',event=>{
   if(!event.detail)return;
   if(performance.now()<blockedUntil){event.preventDefault();event.stopImmediatePropagation();return}
   const candidates=nearby(position(event.clientX,event.clientY),22);if(!candidates.length)return;
   event.preventDefault();event.stopImmediatePropagation();
   const closest=candidates[0],same=candidates.filter(t=>Math.hypot(t.x-closest.x,t.y-closest.y)<1);
   if(same.length>1)choose(same);else select(closest);
  },true);
  svg.addEventListener('touchstart',event=>{
   stop();if(event.touches.length!==1)return;
   const touch=event.touches[0],candidates=nearby(position(touch.clientX,touch.clientY),44);if(!candidates.length)return;
   gesture={id:touch.identifier,startX:touch.clientX,startY:touch.clientY,candidates,index:0,active:false};
   timer=setTimeout(()=>{if(!gesture)return;gesture.active=true;blockedUntil=performance.now()+1000;suppress(blockedUntil);highlight()},400);
  },{passive:true});
  svg.addEventListener('touchmove',event=>{
   if(!gesture)return;
   if(event.touches.length!==1){stop();return}
   const touch=event.touches[0];if(touch.identifier!==gesture.id){stop();return}
   if(!gesture.active){if(Math.hypot(touch.clientX-gesture.startX,touch.clientY-gesture.startY)>10)stop();return}
   event.preventDefault();
   const step=Math.round((touch.clientY-gesture.startY)/32),count=gesture.candidates.length;
   gesture.index=((step%count)+count)%count;highlight();
  },{passive:false});
  svg.addEventListener('touchend',event=>{
   if(!gesture)return;
   if(event.touches.length){stop();return}
   const ended=[...event.changedTouches].some(t=>t.identifier===gesture.id);if(!ended)return;
   if(!gesture.active){stop();return}
   event.preventDefault();const target=gesture.candidates[gesture.index];blockedUntil=performance.now()+700;suppress(blockedUntil);stop();select(target);
  },{passive:false});
  svg.addEventListener('touchcancel',stop,{passive:true});
  svg.addEventListener('contextmenu',event=>{if(gesture){event.preventDefault()}});
  return stop;
 }
 const api={sortRows,bindPoints};if(typeof module==='object'&&module.exports)module.exports=api;else root.CadenceControls=api;
})(globalThis);
