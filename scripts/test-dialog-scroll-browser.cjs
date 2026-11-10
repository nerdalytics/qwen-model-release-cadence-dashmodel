const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const origin='http://cadence.test';
const engines=process.argv.slice(2);
const choices=engines.length?engines:['chromium','webkit'];
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'};
async function run(name){
 const engine={chromium,webkit}[name];
 assert.ok(engine,'Choose chromium or webkit');
 const browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:393,height:700}]){
   const page=await browser.newPage({viewport});
   const forceFallback=process.env.CADENCE_DIALOG_FALLBACK==='1';
   if(forceFallback)await page.addInitScript(()=>{delete HTMLDialogElement.prototype.closedBy});
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root+path.sep))return route.fulfill({status:403,body:''});
    try{
     let body=await fs.readFile(file);
     if(forceFallback&&path.extname(file)==='.html')body=Buffer.from(body.toString().replace(' closedby="any"',''));
     return route.fulfill({body,contentType:mime[path.extname(file)]||'application/octet-stream'});
    }
    catch{return route.fulfill({status:404,body:''})}
   });
   await page.goto(origin+'/');
   await page.waitForSelector('#overview-chart [role="button"]');
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const read=()=>page.evaluate(()=>({x:scrollX,y:scrollY,width:document.documentElement.clientWidth,left:document.querySelector('main').getBoundingClientRect().left}));
   const wheel=async(x,y,dy)=>{await page.mouse.move(x,y);await page.mouse.wheel(0,dy);await page.waitForTimeout(250)};
   for(const tall of [false,true])for(const dismissal of ['button','escape','backdrop']){
    await page.evaluate(()=>{scrollTo(0,500);document.querySelector('#overview-chart [role="button"]').focus({preventScroll:true})});
    const before=await read();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('#point-dialog').open);
    await page.evaluate(tall=>{
     const dialog=document.querySelector('#point-dialog');
     dialog.style.maxBlockSize=tall?'220px':'none';
     if(!tall)document.querySelector('#dialog-content').textContent='Short recorded release details.';
     dialog.scrollTop=0;
    },tall);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
    assert.deepEqual(await read(),before,'opening must preserve page position and content width');
    await wheel(2,2,600);
    assert.deepEqual(await read(),before,'backdrop wheel must not scroll the page');
    const box=await page.locator('#point-dialog').boundingBox();
    await wheel(box.x+box.width/2,box.y+box.height/2,500);
    assert.deepEqual(await read(),before,'scrolling details must not move the page');
    if(tall)assert.ok(await page.evaluate(()=>document.querySelector('#point-dialog').scrollTop)>0,'long details must remain scrollable');
    for(const bottom of [false,true]){
     await page.evaluate(bottom=>{const d=document.querySelector('#point-dialog');d.scrollTop=bottom?d.scrollHeight:0},bottom);
     await wheel(box.x+box.width/2,box.y+box.height/2,bottom?900:-900);
     assert.deepEqual(await read(),before,'dialog boundaries must not scroll the page');
    }
    if(dismissal==='escape')await page.keyboard.press('Escape');
    else if(dismissal==='backdrop')await page.mouse.click(2,2);
    else{await page.locator('#dialog-close').scrollIntoViewIfNeeded();await page.locator('#dialog-close').click()}
    await page.waitForFunction(()=>!document.querySelector('#point-dialog').open);
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
    assert.deepEqual(await read(),before,'dismissal must preserve page position');
    if(dismissal==='escape')assert.equal(await page.evaluate(()=>document.activeElement.dataset.key),'release|Generation|2023-08-03','keyboard dismissal must return focus');
    assert.ok(await page.evaluate(()=>!document.querySelector('#point-dialog').contains(document.activeElement)),'focus must not remain in the closed dialog');
    await wheel(2,2,300);
    assert.ok((await read()).y>before.y,'normal page scrolling must resume');
   }
   await page.evaluate(()=>{const d=document.querySelector('#point-dialog');d.show()});
   assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden','non-modal dialogs must not lock scrolling');
   await page.close();
   console.log(`${name} ${viewport.width}px: short/overflowing details, backdrop/boundary scrolling, all dismissals, position/width preservation and unlocking passed (${forceFallback?'fallback':'native'}).`);
  }
 }finally{await browser.close()}
}
(async()=>{for(const name of choices)await run(name)})().catch(error=>{console.error(error);process.exitCode=1});
