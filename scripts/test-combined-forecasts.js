const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),F=require('../forecast.js');
const rows=require('../data/releases.json').releases,points=[];
function element(tag,attrs={},text){return {tag,attrs,text,children:[],append(...children){this.children.push(...children)}}}
const context=vm.createContext({
 CadenceForecast:F,modelType:'all',filter:'all',includeUpdates:true,
 localStorage:{getItem(){return null}},document:{querySelector(){return null}},
 scopeRows:()=>rows,modelHistory:type=>rows.filter(r=>r.modelTypes.includes(type)),
 el:element,registerChartPoint(node,date,activate){points.push({node,date,activate})},
 escapeHTML:String,dateLabel:String,rounded:String,openDialog(title,html){context.dialog={title,html}}
});
const source=fs.readFileSync(require.resolve('../forecast-comparison.js'),'utf8').split('(function initializeAlgorithmControls(){')[0];
vm.runInContext(source,context);
const selected=vm.runInContext('selectedForecasts()',context),types=F.types(rows);
assert.equal(selected.length,types.length*F.algorithms.length);
for(const type of types){
 const actual=selected.filter(r=>r.modelType===type),expected=vm.runInContext(`resultsForType(${JSON.stringify(type)})`,context);
 assert.equal(actual.length,expected.length);
 for(const result of actual)assert.equal(result.date,expected.find(r=>r.id===result.id).date);
}
const svg=element('svg'),plot=element('g'),geometry={left:0,right:1200,bottom:400,unit:1,font:16,xdate:Date.parse,yvalue:v=>v,nodes:[],activeKey:null};
context.svg=svg;context.plot=plot;context.geometry=geometry;
vm.runInContext('drawAlgorithmForecasts(svg,plot,null,geometry)',context);
const available=selected.filter(r=>r.date);
assert.equal(points.length,available.length);
assert.equal(new Set(points.map(p=>p.node.attrs['data-key'])).size,points.length);
for(const point of points){
 const [,type,id]=point.node.attrs['data-key'].split('|'),result=available.find(r=>r.modelType===type&&r.id===id),latest=F.summarize(rows.filter(r=>r.modelTypes.includes(type))).last;
 assert.equal(point.date,result.date);
 const line=point.node.children.find(e=>e.tag==='line'&&e.attrs['stroke-dasharray']);
 assert.equal(line.attrs.x1,Date.parse(latest.date));
 assert.equal(line.attrs.x2,Date.parse(result.date));
 point.activate();assert.ok(context.dialog.title.startsWith(type+' · '));assert.ok(context.dialog.html.includes(latest.date));
}
vm.runInContext("selectedAlgorithms=new Set(['ema'])",context);
assert.equal(vm.runInContext('selectedForecasts().length',context),types.length);
assert.ok(vm.runInContext("selectedForecasts().every(r=>r.id==='ema')",context));
vm.runInContext('selectedAlgorithms.clear()',context);
assert.equal(vm.runInContext('selectedForecasts().length',context),0);
console.log(`Combined forecast tests passed: ${points.length} independent markers, own-type anchors, details and global algorithm selection.`);
