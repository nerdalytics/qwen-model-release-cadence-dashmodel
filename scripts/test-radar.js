const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),F=require('../forecast.js'),dataset=require('../data/releases.json');
const source=fs.readFileSync(require.resolve('../radar.js'),'utf8'),settings={'#model-select':{value:'all'},'#include-updates':{checked:true},'#conditioned':{checked:false},'#year-select':{value:'all'}};
const context=vm.createContext({CadenceForecast:F,document:{querySelector:s=>settings[s]},localStorage:{getItem:()=>null}});
vm.runInContext(source.split('function showDetails(')[0],context);
context.inputRows=dataset.releases;vm.runInContext('rows=inputRows;types=F.types(rows)',context);
vm.runInContext(source.split('\n').find(line=>line.startsWith('function explorerConfig(')),context);
let config=vm.runInContext('explorerConfig()',context);
assert.equal(config.results.length,F.types(dataset.releases).length*F.algorithms.length);
for(const type of F.types(dataset.releases)){
 const expected=F.forecasts(dataset.releases.filter(r=>r.modelTypes.includes(type)),{type,peers:dataset.releases});
 for(const r of config.results.filter(r=>r.modelType===type)){
  assert.equal(r.date,expected.find(e=>e.id===r.id).date);
  assert.ok(r.color.startsWith('var(--method-'));
 }
}
settings['#model-select'].value='Max';const unconditioned=vm.runInContext('explorerConfig()',context);
settings['#conditioned'].checked=true;config=vm.runInContext('explorerConfig()',context);
assert.equal(config.results.find(r=>r.id==='mean').date,unconditioned.results.find(r=>r.id==='mean').date);
assert.ok(config.results.find(r=>r.id==='renewal').conditional);
settings['#year-select'].value='2026';assert.equal(vm.runInContext('explorerConfig().results.find(r=>r.id==="mean").date',context),unconditioned.results.find(r=>r.id==='mean').date);
vm.runInContext("selected=new Set(['ema'])",context);assert.equal(vm.runInContext('explorerConfig().results.length',context),1);
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.ok(!html.includes('noindex'));assert.ok(html.includes('og:image'));assert.ok(html.includes('id="release-log"'));assert.ok(html.includes('theme.js'));
console.log('Radar tests passed: independent all-type forecasts, algorithm filtering, full-history estimates, optional conditioning, production metadata and release log.');
