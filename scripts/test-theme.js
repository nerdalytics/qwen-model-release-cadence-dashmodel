const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync(require.resolve('../theme.js'),'utf8');
for(const initial of [false,true]){
 const preference={matches:initial,addEventListener(type,callback){assert.equal(type,'change');this.change=callback}},root={dataset:{},style:{}},meta={};
 const context={window:{matchMedia(query){assert.equal(query,'(prefers-color-scheme: dark)');return preference}},document:{documentElement:root,querySelector(){return meta}}};
 vm.runInNewContext(script,context);
 assert.equal(root.dataset.theme,initial?'dark':'light');assert.equal(root.style.colorScheme,initial?'dark':'light');assert.equal(meta.content,initial?'#10151b':'#f6f6f3');
 preference.matches=!initial;preference.change();
 assert.equal(root.dataset.theme,initial?'light':'dark');assert.equal(root.style.colorScheme,initial?'light':'dark');assert.equal(meta.content,initial?'#f6f6f3':'#10151b');
}
const css=fs.readFileSync(require.resolve('../editorial.css'),'utf8');
assert.ok(css.includes('light-dark('));assert.ok(css.includes('color-scheme:light dark;'));assert.ok(!/@media|@container/.test(css));
console.log('Theme tests passed: initial OS preference, live switching, native control scheme, browser chrome and CSS light/dark colors.');
