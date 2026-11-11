const assert=require('node:assert/strict'),C=require('../chart-controls.js');
const rows=[{name:'Model 10',date:'2026-02-01'},{name:'Model 2',date:'2026-01-01'},{name:'Alpha',date:'2026-01-01'},{name:'Unavailable',date:null}];
assert.deepEqual(C.sortRows(rows,'date-asc').map(r=>r.name),['Alpha','Model 2','Model 10','Unavailable']);
assert.deepEqual(C.sortRows(rows,'date-desc').map(r=>r.name),['Model 10','Alpha','Model 2','Unavailable']);
assert.deepEqual(C.sortRows(rows,'name-asc').map(r=>r.name),['Alpha','Model 2','Model 10','Unavailable']);
assert.deepEqual(C.sortRows(rows,'name-desc').map(r=>r.name),['Unavailable','Model 10','Model 2','Alpha']);
assert.equal(rows[0].name,'Model 10');
const listeners={},svg={viewBox:{baseVal:{width:400,height:300}},getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),addEventListener:(type,handler)=>{listeners[type]=handler}};
const targets=[{key:'release|first',x:50,y:200,node:{}},{key:'release|cluster-a',x:120,y:100,node:{}},{key:'release|cluster-b',x:140,y:100,node:{}},{key:'forecast|later',x:300,y:100,node:{}},{key:'release|offscreen',x:450,y:100,node:{}}];
let highlighted,opened,cleared=0;
const originalTimeout=global.setTimeout,originalClear=global.clearTimeout;
try{
 global.setTimeout=callback=>{callback();return 1};global.clearTimeout=()=>{};
 C.bindPoints(svg,targets,{select:t=>{opened=t.key},choose:()=>{},preview:(t,index,count)=>{highlighted={key:t.key,index,count}},clear:()=>{cleared++},suppress:()=>{}});
 const touch=y=>({identifier:1,clientX:140,clientY:y}),event=(y,ended=false)=>({touches:ended?[]:[touch(y)],changedTouches:[touch(y)],preventDefault(){}});
 listeners.touchstart(event(100));assert.deepEqual(highlighted,{key:'release|cluster-b',index:2,count:4});
 listeners.touchmove(event(132));assert.equal(highlighted.key,'forecast|later','scrubbing reaches markers outside the old 44px radius');
 listeners.touchmove(event(36));assert.equal(highlighted.key,'release|first','scrubbing reaches the first-entry diamond');
 listeners.touchend(event(36,true));assert.equal(opened,'release|first');assert.equal(cleared,1);
 listeners.touchstart(event(100));listeners.touchmove(event(68));assert.equal(highlighted.key,'release|cluster-a');listeners.touchend(event(68,true));assert.equal(opened,'release|cluster-a');
}finally{global.setTimeout=originalTimeout;global.clearTimeout=originalClear}
console.log('Chart control tests passed: sorting and universal release/diamond/forecast scrubbing, including distant markers and offscreen exclusion.');
