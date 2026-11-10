const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),F=require('../forecast.js'),dataset=require('../data/releases.json');
const source=fs.readFileSync(require.resolve('../radar.js'),'utf8');
function element(tag){return {tag,attrs:{},dataset:{},children:[],listeners:{},setAttribute(k,v){this.attrs[k]=v;if(k==='data-key')this.dataset.key=v},append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=nodes},addEventListener(k,fn){this.listeners[k]=fn},contains(){return false}}}
const document={querySelector(){return null},createElement:element,createElementNS:(_,tag)=>element(tag)};
const context=vm.createContext({CadenceForecast:F,document,localStorage:{getItem:()=>null},syncZoom(){},showDetails(){}});
vm.runInContext(source.split('function showDetails(')[0],context);
context.inputRows=dataset.releases;vm.runInContext('rows=inputRows',context);
vm.runInContext(source.slice(source.indexOf('function drawChart('),source.indexOf('function modelCommentary(')),context);
function descendants(node){return [node,...node.children.flatMap(descendants)]}
let checked=0;
for(const width of [250,320,393,852,1440])for(const updates of [true,false])for(const type of F.types(dataset.releases)){
 const records=dataset.releases.filter(r=>r.modelTypes.includes(type)&&(updates||r.event!=='update'));
 const host=element('div');Object.assign(host,{id:'test',clientWidth:width,clientHeight:450});
 context.chart={host,configuration:{title:type,types:[type],updates,results:F.forecasts(records,{type,peers:dataset.releases}).map(r=>({...r,modelType:type})),explore:true}};
 vm.runInContext('drawChart(chart)',context);
 const nodes=descendants(host),markers=nodes.filter(n=>n.attrs['data-key']?.startsWith('release|'));
 assert.deepEqual(markers.map(n=>n.attrs['data-key'].split('|')[2]),[...new Set(records.map(r=>r.date))].sort(),type+' includes all dates');
 if(markers.length){
  const halo=markers[0].children.find(n=>n.attrs.class==='halo'),cx=halo.attrs.cx,r=halo.attrs.r;
  assert.ok(cx-r>=context.chart.geometry.left-.001,type+' first-entry touch target fits horizontally');
  const clip=nodes.find(n=>n.tag==='clipPath').children[0];
  assert.ok(halo.attrs.cy+r<=clip.attrs.y+clip.attrs.height,type+' baseline touch target fits vertically');
 }
 checked++;
}
const dismissal=source.slice(source.indexOf("const pointDialog=$('#point-dialog');"),source.indexOf("window.addEventListener('scroll',syncBackTop"));
for(const native of [false,true]){
 const dialog=element('dialog');let closes=0;
 dialog.getBoundingClientRect=()=>({left:20,right:300,top:20,bottom:400});
 dialog.close=()=>{closes++;dialog.listeners.close?.()};
 const fixture={document:{querySelector:()=>dialog},HTMLDialogElement:{prototype:native?{closedBy:'any'}:{}}};
 vm.runInNewContext('const $=s=>document.querySelector(s);'+dismissal,fixture);
 if(native){assert.deepEqual(Object.keys(dialog.listeners),[],'native dismissal needs no JS listeners');continue}
 const inside={target:dialog,clientX:100,clientY:100},outside={target:dialog,clientX:10,clientY:10},child={...outside,target:element('button')};
 dialog.listeners.pointerdown(inside);dialog.listeners.pointerup(inside);assert.equal(closes,0);
 dialog.listeners.pointerdown(inside);dialog.listeners.pointerup(outside);assert.equal(closes,0,'selection drag must not dismiss');
 dialog.listeners.pointerdown(outside);dialog.listeners.pointerup(inside);assert.equal(closes,0);
 dialog.listeners.pointerdown(child);dialog.listeners.pointerup(outside);assert.equal(closes,0);
 dialog.listeners.pointerdown(outside);dialog.listeners.pointerup(outside);assert.equal(closes,1);
 for(const event of ['pointercancel','cancel','close']){dialog.listeners.pointerdown(outside);dialog.listeners[event]();dialog.listeners.pointerup(outside);assert.equal(closes,1,event+' clears stale pointer state')}
 dialog.listeners.pointerup(outside);assert.equal(closes,1,'a release alone must not dismiss');
}
const page=fs.readFileSync(require.resolve('../index.html'),'utf8'),title=page.match(/<title>(.*?)<\/title>/)[1],description=page.match(/<meta name="description" content="([^"]+)"/)[1];
assert.ok(title.length>=50&&title.length<=60);
assert.ok(description.length>=120&&description.length<=160);
for(const tag of ['og:title','twitter:title'])assert.ok(page.includes(`="${tag}" content="${title}"`));
for(const tag of ['og:description','twitter:description']){const value=page.match(new RegExp(`="${tag}" content="([^"]+)"`))[1];assert.ok(value.length>=120&&value.length<=160)}
assert.ok(page.match(/<header[\s\S]*?class="header-github"[\s\S]*?<\/header>/));
assert.ok(!/<footer>[\s\S]*?github[\s\S]*?<\/footer>/.test(page));
const styles=fs.readFileSync(require.resolve('../radar.css'),'utf8');
assert.ok(/dialog:modal\{overscroll-behavior:contain\}/.test(styles),'modal scroll does not chain to the page');
assert.ok(/dialog::backdrop\{overflow:hidden;overscroll-behavior:contain\}/.test(styles),'backdrop establishes contained scrolling');
assert.ok(!/html:has\(dialog/.test(styles),'opening a dialog must not mutate root overflow');
assert.ok(page.includes('<dialog id="point-dialog" closedby="any"'));
assert.ok(/<form method="dialog"><button id="dialog-close"[^>]*autofocus/.test(page),'close and initial focus are native');
assert.ok(!source.includes('lastFocus'),'focus restoration belongs to the native dialog');
assert.ok(styles.includes('container:chart-zoom / inline-size'));
assert.ok(styles.includes('@container chart-zoom (min-width:24rem)'));
assert.ok(page.includes('<meta name="text-scale" content="scale">'));
assert.equal((page.match(/name="color-scheme"/g)||[]).length,1);
assert.ok(page.indexOf('name="color-scheme"')<page.indexOf('rel="stylesheet"'));
assert.ok(!source.includes('</dd><p'), 'definition-list descriptions must contain their status text');
assert.ok(page.includes('<search class="log-controls" aria-label="Release entries">'));
assert.ok(page.includes('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'));
for(const file of ['radar.css','editorial.css']){
 const css=fs.readFileSync(require.resolve('../'+file),'utf8');
 assert.ok(!/@import/.test(css),'font CSS must be discovered in HTML');
 assert.ok(!/(?:html|:root)\s*\{[^}]*font-size\s*:/.test(css),'root font size belongs to the browser');
}
assert.ok(fs.readFileSync(require.resolve('./generate-social-preview.py'),'utf8').includes('Compare forecasts →'));
console.log(`UI regressions passed: ${checked} model/layout combinations, baseline touch targets, dialog dismissal/focus, metadata and header GitHub link.`);
