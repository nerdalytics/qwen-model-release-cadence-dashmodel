const assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
const page=read('index.html'),radar=read('radar.js'),forecast=read('forecast.js'),audit=read('SOURCE_AUDIT.md'),readme=read('README.md');
assert.ok(page.includes("Has Qwen's release pace slowed?"));
assert.ok(radar.includes(`$('#page-title').textContent="Has Qwen's release pace slowed?"`));
assert.ok(page.includes('Cadence | Qwen release timing'));
for(const text of ['not announcements','not an announcement','Neither is a confirmed','not a delivery deadline','No guaranteed next release','not a ranking','not a line through calendar']){
 assert.ok(!page.includes(text),text);assert.ok(!radar.includes(text),text);
}
assert.ok(radar.includes('Historical mean: <strong>${date(generation.meanDate)}</strong>.<br>EMA: <strong>${date(generation.emaDate)}</strong>.'));
assert.equal((radar.match(/Newer releases may be missing\./g)||[]).length,1);
// Glossary: entry (release or model update), gap, forecast, historical mean. No synonyms in reader-facing copy.
const visible=page.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
const banned=[/\bestimates?\b/i,/\bintervals?\b/i,/\blaunch(es|ed)?\b/i,/\bevents?\b/i,/\baverage estimate\b/i,/\bten\b/i,/\bthree\b/i,/Technology &amp; business/,/↗/];
for(const pattern of banned)assert.ok(!pattern.test(visible),'index.html: '+pattern);
const strings=source=>(source.match(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)||[]).filter(literal=>!/^['`][#.]/.test(literal)).join('\n');
for(const [name,source] of [['radar.js',strings(radar)],['forecast.js',strings(forecast)]])for(const pattern of [/\b(Past|Future|Conditional) estimate\b/,/\bEstimate for today\b/,/\bestimates?\b/i,/\bintervals?\b/i,/\blaunch(es|ed)?\b/i,/recorded events?/i,/First event/,/\bAverage\b/,/↗/,/the radar/i])assert.ok(!pattern.test(source),name+': '+pattern);
for(const [name,source] of [['SOURCE_AUDIT.md',audit],['README.md',readme]]){assert.ok(!/\d{4}-\d{2}-\d{2}/.test(source),name+': ISO date');assert.ok(!/\b(January|February|March|April|June|July|August|September|October|November|December) \d/.test(source),name+': long month');assert.ok(!/\bradar\b/i.test(source),name+': radar')}
const navLabels=[...page.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)][0][1].match(/>([^<]+)<\/a>/g).map(s=>s.slice(1,-4));
for(const label of navLabels)assert.ok(page.includes(`<p class="eyebrow">${label}</p>`),'nav label without matching section eyebrow: '+label);
console.log('Copy tests passed: slowdown headline, direct date summary, 1 dataset-coverage note, glossary terms, date formats and nav labels.');
