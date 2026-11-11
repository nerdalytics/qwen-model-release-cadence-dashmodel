const assert=require('node:assert/strict');
const F=require('../forecast.js'),payload=require('../data/releases.json'),today=new Date('2026-11-09T12:00:00Z');
const fixtures={Max:['2025-01-28','2025-09-24','2026-01-26','2026-05-20','2026-08-03'],'27B':['2026-02-24','2026-04-22','2026-08-14'],Plus:['2026-04-02','2026-06-01'],Flash:['2026-08-26']};
const summary=type=>F.summarize(fixtures[type].map(date=>({date})),today);
for(const row of payload.releases){assert.ok(row.modelTypes.length,row.name);assert.equal(new Set(row.modelTypes).size,row.modelTypes.length)}
assert.equal(summary('Max').emaDate,'2027-01-21');assert.equal(summary('Max').meanDate,'2026-12-19');
assert.equal(summary('27B').emaDate,'2026-10-21');assert.equal(summary('27B').meanDate,'2026-11-08');assert.equal(summary('27B').meanAge,1);
assert.equal(summary('Plus').limited,true);assert.equal(summary('Plus').emaDate,'2026-07-31');
assert.equal(summary('Flash').emaDate,null);assert.equal(summary('Flash').gaps.length,0);
const rows=[{date:'2026-01-01'},{date:'2026-01-11'},{date:'2026-01-31'}];
assert.equal(F.summarize(rows,today).ema,12);assert.equal(F.summarize(rows,today).mean,15);
assert.equal(F.summarize([...rows,rows[1]],today).ema,F.summarize(rows,today).ema);assert.equal(F.summarize([...rows,rows[1]],today).mean,F.summarize(rows,today).mean);
assert.equal(F.summarize(rows,new Date('2027-01-01')).emaDate,F.summarize(rows,today).emaDate);
assert.equal(F.summarize([],today).emaDate,null);assert.equal(F.summarize([{date:'2026-01-01'}],today).meanDate,null);
assert.ok(payload.releases.some(r=>r.modelTypes.includes('Max')));assert.ok(payload.releases.some(r=>r.modelTypes.includes('27B')));
assert.ok(!payload.releases.find(r=>r.name==='Qwen2.5-Coder').modelTypes.includes('Coder 32B'));
assert.ok(!payload.releases.filter(r=>r.series==='coding').some(r=>r.modelTypes.includes('7B')));
console.log('Forecast tests passed: isolated types, EMA, mean, missing history, same-day deduplication and stable past dates.');

for(const name of ['Qwen3.5','Qwen3.6-Plus','Qwen3.7-Max','Qwen3.8-Max']){const row=payload.releases.find(r=>r.name===name);assert.equal(row.event,'release');assert.equal(row.series,'core');assert.ok(row.modelTypes.includes('Generation'))}
for(const generation of ['3.5','3.6','3.7','3.8'])assert.equal(payload.releases.filter(r=>r.generation===generation&&r.modelTypes.includes('Generation')).length,1);
for(const name of ['Qwen3.5 medium-size expansion','Qwen3.5 small-size expansion','Qwen3.6-35B-A3B','Qwen3.6-27B','Qwen3.7-Plus'])assert.equal(payload.releases.find(r=>r.name===name).event,'release');
assert.ok(!payload.releases.find(r=>r.name==='Qwen3.7-Plus').modelTypes.includes('Generation'));

const flash=payload.releases.find(r=>r.name==='Qwen3.6-35B-A3B');assert.ok(flash.aliases.includes('Qwen3.6-Flash'));assert.ok(flash.modelTypes.includes('Flash'));assert.equal(flash.date,'2026-04-15');assert.equal(payload.releases.filter(r=>r.aliases?.includes('Qwen3.6-Flash')).length,1);const flashHistory=F.summarize(payload.releases.filter(r=>r.modelTypes.includes('Flash')),today);assert.equal(flashHistory.gaps[0],133);assert.equal(flashHistory.emaDate,'2027-01-06');

// Classification follows the dataset rule: new models are releases, only changes to existing models are model updates.
const byName=name=>payload.releases.find(r=>r.name===name);
for(const name of ['Qwen-14B','Qwen2.5-Coder family expansion','Qwen2.5-1M','Qwen3.8-2.4T-A95B'])assert.equal(byName(name).event,'release',name);
assert.equal(byName('Qwen-7B checkpoint update').event,'update');assert.equal(byName('Qwen-14B').date,byName('Qwen-7B checkpoint update').date);
assert.equal(flash.apiModel,'qwen3.6-flash');assert.ok(flash.sourceIds.every(id=>payload.sources[id]));
const typeOrder=F.types(payload.releases);assert.ok(typeOrder.indexOf('2B')<typeOrder.indexOf('2.4T-A95B'));assert.ok(typeOrder.indexOf('397B')<typeOrder.indexOf('2.4T-A95B'));assert.ok(typeOrder.indexOf('Coder 3B')<typeOrder.indexOf('Coder 14B'));
for(const type of ['30B-A3B','235B-A22B'])for(const r of F.forecasts(payload.releases.filter(r=>r.modelTypes.includes(type)),{type,peers:payload.releases,now:today,backtest:false}))assert.ok(!r.date&&r.reason,type+'/'+r.id);
console.log('Data tests passed: release/update classification, API name, size order and the 7-day minimum gap.');

const preview=byName('Qwen4-Max Preview');assert.equal(preview.date,'2026-11-11');assert.equal(preview.event,'release');assert.equal(preview.series,'core');assert.deepEqual(preview.modelTypes,['Generation','Max']);assert.equal(preview.generation,'4');assert.equal(preview.apiModel,'qwen4-max-preview');assert.match(preview.availability,/preview/);assert.equal(preview.verification,'primary-source-checked');assert.equal(preview.verifiedAt,payload.updatedAt);assert.equal(payload.sources[preview.sourceIds[0]].url,'https://x.com/Alibaba_Qwen/status/2120335993643684315');assert.equal(payload.releases.filter(r=>r.generation==='4'&&r.modelTypes.includes('Generation')).length,1);
for(const type of preview.modelTypes){const history=F.summarize(payload.releases.filter(r=>r.modelTypes.includes(type)),new Date('2026-11-11T12:00:00Z'));assert.equal(history.gaps.at(-1),100);assert.ok(history.meanDate>preview.date);assert.ok(history.emaDate>preview.date)}
console.log('Qwen4 preview tests passed: source, date, availability and Generation/Max forecast inclusion.');

for(const [name,date,source] of [['Qwen3.5-Max Preview','2026-03-19','v35maxPreview'],['Qwen3.6-Max Preview','2026-04-18','v36maxPreview']]){const r=byName(name);assert.equal(r.date,date);assert.equal(r.event,'release');assert.equal(r.series,'variant');assert.deepEqual(r.modelTypes,['Max']);assert.match(r.availability,/preview/);assert.deepEqual(r.sourceIds,[source]);assert.ok(payload.sources[source]);assert.equal(payload.releases.filter(row=>row.name===name).length,1)}
assert.equal(byName('Qwen3.5-Max Preview').apiModel,undefined);assert.equal(byName('Qwen3.6-Max Preview').apiModel,'qwen3.6-max-preview');
assert.deepEqual(payload.releases.map(r=>r.date),payload.releases.map(r=>r.date).sort());
const maxHistory=F.summarize(payload.releases.filter(r=>r.modelTypes.includes('Max')),new Date('2026-11-11T12:00:00Z'));assert.deepEqual(maxHistory.gaps,[239,124,52,30,32,75,100]);
assert.equal(payload.releases.filter(r=>r.modelTypes.includes('Generation')).length,10);
console.log('Earlier Max preview tests passed: dates, sources, hosted availability, chronological history and no duplicate generations.');
