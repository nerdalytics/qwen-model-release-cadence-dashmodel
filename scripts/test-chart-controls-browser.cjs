const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='http://cadence.test',mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'};
async function run(name){
 const browser=await {chromium,webkit}[name].launch({headless:true});
 try{for(const width of [393,1440]){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
   const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return route.fulfill({status:403,body:''});
   try{return route.fulfill({body:await fs.readFile(file),contentType:mime[path.extname(file)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:''})}
  });
  await page.goto(origin+'/');await page.waitForSelector('#overview-chart .point');
  await page.selectOption('#model-select','Max');await page.locator('#explore-chart').scrollIntoViewIfNeeded();
  const pointData=()=>page.locator('#explore-chart').evaluate(host=>{const svg=host.querySelector('svg'),box=svg.getBoundingClientRect(),v=svg.viewBox.baseVal;return [...svg.querySelectorAll('.point:not(.today-point)')].map(node=>{const halo=node.querySelector('.halo');return {key:node.dataset.key,label:node.querySelector('title').textContent,x:box.left+Number(halo.getAttribute('cx'))*box.width/v.width,y:box.top+Number(halo.getAttribute('cy'))*box.height/v.height}})});
  const points=await pointData(),forecasts=points.filter(p=>p.key.startsWith('forecast|'));
  assert.ok(forecasts.length>=8);
  const cdp=name==='chromium'?await page.context().newCDPSession(page):null;
  const checkHistoricalScrubbing=async selector=>{
   const host=page.locator(selector);await host.scrollIntoViewIfNeeded();
   const visible=await host.evaluate(host=>{const svg=host.querySelector('svg'),box=svg.getBoundingClientRect(),v=svg.viewBox.baseVal;return [...svg.querySelectorAll('.point:not(.today-point)')].map(node=>{const halo=node.querySelector('.halo'),x=Number(halo.getAttribute('cx')),y=Number(halo.getAttribute('cy'));return {key:node.dataset.key,label:node.querySelector('title').textContent,x,y,clientX:box.left+x*box.width/v.width,clientY:box.top+y*box.height/v.height}}).filter(p=>p.x>=0&&p.x<=v.width&&p.y>=0&&p.y<=v.height).sort((a,b)=>a.x-b.x||a.y-b.y||a.key.localeCompare(b.key))});
   const releases=visible.filter(p=>p.key.startsWith('release|'));assert.ok(releases.length>2);
   const anchor=releases.find(p=>releases.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<=44).length>2)||releases[1],start=visible.findIndex(p=>p.key===anchor.key);
   const touch=async(type,y)=>{if(cdp)return cdp.send('Input.dispatchTouchEvent',{type:type==='touchstart'?'touchStart':type==='touchmove'?'touchMove':'touchEnd',touchPoints:type==='touchend'?[]:[{x:anchor.clientX,y}]});return host.evaluate((host,{type,x,y,startY})=>{const svg=host.querySelector('svg'),target=document.elementFromPoint(x,startY)||svg,touch={identifier:9,target,clientX:x,clientY:y},event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:type==='touchend'?[]:[touch]},changedTouches:{value:[touch]}});target.dispatchEvent(event)},{type,x:anchor.clientX,y,startY:anchor.clientY})};
   for(const release of releases){
    await touch('touchstart',anchor.clientY);await host.locator('[data-scrubbing]').waitFor();
    let step=visible.findIndex(p=>p.key===release.key)-start;if(step>visible.length/2)step-=visible.length;if(step<-visible.length/2)step+=visible.length;
    await touch('touchmove',anchor.clientY+step*32);await page.waitForFunction(({selector,key})=>document.querySelector(selector+' [data-scrubbing]')?.dataset.key===key,{selector,key:release.key});
    assert.match(await host.locator('.chart-tooltip').innerText(),new RegExp('of '+visible.length+' · Drag'));
    await touch('touchend',anchor.clientY+step*32);await page.waitForFunction(()=>document.querySelector('#point-dialog').open);
    assert.equal(await page.locator('#dialog-title').innerText(),release.label.split(', ')[0]);assert.match(await page.locator('#dialog-kind').innerText(),/^RECORDED /);
    await page.locator('#dialog-close').click();assert.equal(await host.locator('[data-scrubbing]').count(),0);await page.waitForTimeout(750);
   }
  };
  for(const point of points){
   if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
   else await page.mouse.click(point.x,point.y);
   await page.waitForFunction(()=>document.querySelector('#point-dialog').open);
   if(await page.locator('#dialog-title').innerText()==='Choose a chart point')await page.locator('.point-choices button').filter({hasText:point.label}).click();
   assert.equal(await page.locator('#dialog-title').innerText(),point.key.startsWith('forecast|')?point.label.split(': ')[0]:point.label.split(', ')[0]);
   await page.locator('#dialog-close').click();
  }
  const cluster=forecasts.find(p=>points.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<=44).length>2);assert.ok(cluster);
  const dispatch=async(type,x,y)=>page.evaluate(({type,x,y})=>{const svg=document.querySelector('#explore-chart svg'),touch={identifier:8,target:svg,clientX:x,clientY:y,pageX:x+scrollX,pageY:y+scrollY};const ended=['touchend','touchcancel'].includes(type),event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:ended?[]:[touch]},targetTouches:{value:ended?[]:[touch]},changedTouches:{value:[touch]}});svg.dispatchEvent(event);return event.defaultPrevented},{type,x,y});
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cluster.x,y:cluster.y}]});else await dispatch('touchstart',cluster.x,cluster.y);
  await page.waitForSelector('#explore-chart [data-scrubbing]');
  const first=await page.locator('#explore-chart [data-scrubbing]').getAttribute('data-key'),firstCount=await page.locator('#explore-chart .chart-tooltip').innerText();
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cluster.x,y:cluster.y+32}]});else assert.ok(await dispatch('touchmove',cluster.x,cluster.y+32));
  await page.waitForFunction(first=>document.querySelector('#explore-chart [data-scrubbing]')?.dataset.key!==first,first);
  const highlighted=await page.locator('#explore-chart [data-scrubbing] title').textContent();
  assert.equal(await page.locator('#point-dialog').evaluate(d=>d.open),false);
  assert.match(await page.locator('#explore-chart .chart-tooltip').innerText(),/of \d+ · Drag/);assert.notEqual(await page.locator('#explore-chart .chart-tooltip').innerText(),firstCount);
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await dispatch('touchend',cluster.x,cluster.y+32);
  await page.waitForFunction(()=>document.querySelector('#point-dialog').open);
  assert.equal(await page.locator('#dialog-title').innerText(),highlighted.split(': ')[0]);
  await page.locator('#dialog-close').click();
  assert.equal(await page.locator('[data-scrubbing]').count(),0);
  await page.waitForTimeout(750);
  await dispatch('touchstart',cluster.x,cluster.y);await page.waitForSelector('[data-scrubbing]');await dispatch('touchcancel',cluster.x,cluster.y);
  assert.equal(await page.locator('[data-scrubbing]').count(),0);assert.equal(await page.locator('#point-dialog').evaluate(d=>d.open),false);
  await dispatch('touchstart',cluster.x,cluster.y);assert.equal(await dispatch('touchmove',cluster.x,cluster.y+20),false);await page.waitForTimeout(450);assert.equal(await page.locator('[data-scrubbing]').count(),0);await dispatch('touchend',cluster.x,cluster.y+20);
  await page.waitForTimeout(750);
  await checkHistoricalScrubbing('#explore-chart');
  const maxCard=page.locator('#model-grid .model-card').filter({has:page.locator('h3',{hasText:/^Max$/})}),cardId=await maxCard.locator('.chart-host').getAttribute('id');
  await checkHistoricalScrubbing('#'+cardId);await page.locator('#explore-chart').scrollIntoViewIfNeeded();
  await page.evaluate(()=>{const result=explorerConfig().results.find(r=>r.date);drawChart({host:document.querySelector('#explore-chart'),configuration:{title:'Exact overlaps',types:['Max'],results:[result,{...result,id:'overlap-test',name:'Overlap test'}],explore:false}})});
  const overlaps=(await pointData()).filter(p=>p.key.startsWith('forecast|'));await page.mouse.click(overlaps[0].x,overlaps[0].y);await page.waitForFunction(()=>document.querySelector('#point-dialog').open);assert.equal(await page.locator('#dialog-title').innerText(),'Choose a chart point');assert.equal(await page.locator('.point-choices button').count(),2);await page.locator('.point-choices button').filter({hasText:'Overlap test'}).click();assert.equal(await page.locator('#dialog-title').innerText(),'Max · Overlap test');await page.locator('#dialog-close').click();await page.evaluate(()=>drawChart(exploreChart));
  for(const order of ['date-asc','date-desc','name-asc','name-desc']){
   await page.selectOption('#forecast-sort',order);
   const actual=await page.locator('#forecast-results .forecast-result').evaluateAll(nodes=>nodes.map(n=>({name:n.querySelector('.result-name').textContent,date:n.querySelector('strong').textContent})));
   const available=actual.filter(r=>r.date!=='Not available'),dates=available.map(r=>Date.parse(r.date));
   if(order.startsWith('date'))assert.deepEqual(dates,[...dates].sort((a,b)=>order==='date-asc'?a-b:b-a));
   else{const names=actual.map(r=>r.name);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'})*(order==='name-desc'?-1:1)))}
   await page.selectOption('#release-sort',order);
   const entries=await page.locator('#release-rows tr').evaluateAll(nodes=>nodes.map(n=>({name:n.querySelector('button').textContent,date:n.querySelector('time').dateTime})));
   const values=entries.map(r=>order.startsWith('date')?r.date:r.name),expected=[...values].sort((a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'})*(order.endsWith('desc')?-1:1));assert.deepEqual(values,expected);
  }
  await page.locator('#release-search').fill('max preview');assert.equal(await page.locator('#release-rows tr').count(),3);
  assert.deepEqual(await page.locator('#release-rows button').allTextContents(),await page.evaluate(()=>matchingReleases().map(r=>r.name)));
  await page.locator('#explore-chart').scrollIntoViewIfNeeded();
  await page.locator('#explore-chart').evaluate(host=>{const svg=host.querySelector('svg'),box=svg.getBoundingClientRect(),dispatch=(type,touches)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:touches},changedTouches:{value:touches}});svg.dispatchEvent(event)};const touch=(id,x)=>({identifier:id,clientX:box.left+x,clientY:box.top+100});dispatch('touchstart',[touch(1,80),touch(2,160)]);dispatch('touchmove',[touch(1,60),touch(2,180)]);dispatch('touchend',[])});
  assert.ok(Number(await page.locator('#zoom').inputValue())>0);assert.equal(await page.locator('[data-scrubbing]').count(),0);await page.locator('#zoom-reset').click();
  await page.locator('#overview-chart').scrollIntoViewIfNeeded();await page.locator('#overview-chart .point').first().focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#point-dialog').open);await page.locator('#dialog-close').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);await page.close();
  console.log(`${name} ${width}px: every forecast/release target, historical cluster and baseline scrubbing in Explore and model cards, cancellation, scroll intent, keyboard and sorting passed.`);
 }}finally{await browser.close()}
}
(async()=>{for(const name of ['chromium','webkit'])await run(name)})().catch(error=>{console.error(error);process.exitCode=1});
