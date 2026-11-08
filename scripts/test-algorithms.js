const assert=require('node:assert/strict'),F=require('../forecast.js'),dataset=require('../data/releases.json').releases;
const origin='2026-01-01',DAY=86400000,now=new Date('2026-11-09');
function records(gaps,type='Max',start=origin){let time=Date.parse(start);return [{date:start,modelTypes:[type]},...gaps.map(gap=>{time+=gap*DAY;return {date:new Date(time).toISOString().slice(0,10),modelTypes:[type]}})]}
const find=(rows,id,options={})=>F.forecasts(rows,{now,backtest:false,...options}).find(r=>r.id===id);
assert.equal(F.algorithms.length,10);assert.equal(new Set(F.algorithms.map(a=>a.id)).size,10);
const known=records([10,20,30,40]);
assert.equal(find(known,'mean').gap,25);assert.equal(find(known,'rolling-mean').gap,30);assert.equal(find(known,'rolling-median').gap,30);assert.equal(find(known,'weighted').gap,33);
assert.equal(find(records([10]),'weighted').gap,10);assert.equal(find(records([10,20]),'weighted').gap,16.25);
assert.equal(find(known,'regression').gap,50);assert.equal(find(known,'holt').gap,50);
assert.ok(find(known,'damped-holt').gap<50);assert.ok(find(known,'damped-holt').gap>40);
for(const id of ['holt','damped-holt','regression','renewal'])assert.ok(find(records([10,20]),id).reason);
assert.ok(find(records([80,50,20]),'regression').reason);assert.ok(find(records([239,124,114,75]),'holt').reason);
const one=records([]);for(const r of F.forecasts(one,{now})){assert.equal(r.date,undefined);assert.ok(r.reason)}
const stable=records([20,20,20,20]);
for(const id of ['mean','ema','rolling-mean','rolling-median','weighted','holt','damped-holt','regression','renewal'])assert.ok(Math.abs(find(stable,id).gap-20)<1e-7,id);
const lognormal=records([10,20,40]),renewal=find(lognormal,'renewal');assert.ok(Math.abs(renewal.gap-20)<1e-6);assert.ok(renewal.lowDate<renewal.date);assert.ok(renewal.highDate>renewal.date);
const last=lognormal.at(-1).date,conditionalNow=new Date(Date.parse(last)+25*DAY),conditional=find(lognormal,'renewal',{now:conditionalNow,conditioned:true});assert.ok(conditional.conditional);assert.ok(conditional.date>conditionalNow.toISOString().slice(0,10));assert.ok(conditional.gap>renewal.gap);
assert.ok(find(stable,'renewal',{conditioned:true}).reason);
const duplicate=[...known,known[1],known[2]];for(const id of ['mean','ema','rolling-mean','rolling-median','weighted','holt','damped-holt','regression','renewal'])assert.equal(find(known,id).gap,find(duplicate,id).gap,id);
const own=records([20,30,40]),peers=[...own,...records([10,20,30],'Plus','2024-01-01'),...records([15,25,35],'Flash','2025-01-01')];
const prior=F.peerPrior(peers,'Max');assert.equal(prior.count,6);assert.equal(prior.mean,22.5);assert.deepEqual(prior.peers,['Plus','Flash']);
const bayes=find(own,'bayesian',{type:'Max',peers});assert.equal(bayes.gap,(22.5+90)/4);assert.ok(bayes.lowDate<bayes.date);assert.ok(bayes.highDate>bayes.date);
const conditionalBayes=find(own,'bayesian',{type:'Max',peers,conditioned:true});assert.ok(conditionalBayes.conditional);assert.ok(conditionalBayes.date>now.toISOString().slice(0,10));assert.ok(conditionalBayes.gap>bayes.gap);
assert.ok(find(own,'bayesian',{type:'Generation',peers}).reason);assert.ok(find(own,'bayesian',{type:'Max',peers:own}).reason);
const overlapping=records([12,22,32],'Plus','2025-04-01').map(r=>({...r,modelTypes:['Plus','Flash']}));assert.equal(F.peerPrior([...own,...overlapping],'Max').count,3);
const relatedOwn=own.map(r=>({...r,modelTypes:['Max','Plus']}));assert.equal(F.peerPrior(relatedOwn,'Max'),null);
const trials=F.forecasts(records([10,20,30,40,50]),{now}).find(r=>r.id==='regression').backtest;assert.equal(trials.trials,2);assert.equal(trials.mae,0);
const forecastTrials=F.forecasts(own,{type:'Max',peers,now}).find(r=>r.id==='bayesian').backtest;
const futurePeer=[...peers,...records([1,1,1],'Flash','2029-01-01')];assert.deepEqual(F.forecasts(own,{type:'Max',peers:futurePeer,now}).find(r=>r.id==='bayesian').backtest,forecastTrials);
for(const type of F.types(dataset)){
 const rows=dataset.filter(r=>r.modelTypes.includes(type));
 for(const conditioned of [false,true])for(const r of F.forecasts(rows,{type,peers:dataset,now,conditioned})){
  assert.ok(r.date||r.reason,`${type}/${r.id}`);if(r.date){assert.ok(Number.isFinite(r.gap)&&r.gap>0);assert.ok(r.date>rows.map(r=>r.date).sort().at(-1));if(r.lowDate){assert.ok(r.lowDate<=r.date);assert.ok(r.date<=r.highDate)}}
 }
}
console.log('Algorithm tests passed: 10 methods, known answers, sparse/invalid history, windows, conditioning, isolated peers, duplicate dates and walk-forward leakage checks.');
