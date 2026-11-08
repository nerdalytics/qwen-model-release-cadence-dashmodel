const assert=require('node:assert/strict'),fs=require('node:fs');
const page=fs.readFileSync(require.resolve('../index.html'),'utf8'),radar=fs.readFileSync(require.resolve('../radar.js'),'utf8');
assert.ok(page.includes("When could Qwen's next model arrive?"));
assert.ok(page.includes('Cadence | Qwen release timing'));
for(const text of ['not announcements','not an announcement','Neither is a confirmed','not a delivery deadline','No guaranteed next release','not a ranking','not a line through calendar']){
 assert.ok(!page.includes(text),text);assert.ok(!radar.includes(text),text);
}
assert.ok(radar.includes('Average: <strong>${date(generation.meanDate)}</strong>.<br>EMA: <strong>${date(generation.emaDate)}</strong>.'));
assert.equal((radar.match(/Newer releases may be missing\./g)||[]).length,1);
console.log('Copy tests passed: release-timing title, direct date summary and one dataset-coverage note.');
