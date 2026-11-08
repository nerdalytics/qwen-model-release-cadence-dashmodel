function checkedSource(source){if(!source||typeof source.url!=='string'||typeof source.title!=='string')return false;try{const url=new URL(source.url);return url.protocol==='https:'&&(['qwen.ai','qwenlm.github.io'].includes(url.hostname)||(url.hostname==='github.com'&&url.pathname.toLowerCase().startsWith('/qwenlm/')))}catch{return false}}
function qualifiedDataset(payload){return !!(payload&&payload.demo===false&&payload.quality?.status==='primary-source-checked'&&Array.isArray(payload.releases)&&payload.releases.length&&payload.releases.every(r=>r.verification==='primary-source-checked'&&r.evidence&&Array.isArray(r.sourceIds)&&r.sourceIds.length&&r.sourceIds.every(id=>checkedSource(payload.sources?.[id]))))}
function latestEntryDate(records){return records.reduce((latest,record)=>record.date>latest?record.date:latest,'')}
function appendSourceDetails(record){
 const container=document.querySelector('#dialog-content');if(!container||!record)return;
 const section=document.createElement('section');section.className='source-details';
 const heading=document.createElement('h3');heading.textContent='Source verification';section.append(heading);
 for(const id of record.sourceIds||[]){const source=dataConfig.sources?.[id];if(!checkedSource(source))continue;const p=document.createElement('p'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title+' ↗';a.setAttribute('aria-label',source.title+' (opens in a new tab)');p.append(a);section.append(p)}
 const evidence=document.createElement('blockquote');evidence.textContent=record.evidence||'No dated evidence attached.';section.append(evidence);
 if(record.notes){const notes=document.createElement('p');notes.textContent=record.notes;section.append(notes)}
 const verification=document.createElement('p');verification.textContent=`Availability: ${record.availability||'not specified'} · Source checked: ${record.verifiedAt||'not checked'}`;section.append(verification);container.append(section);
}
document.addEventListener('DOMContentLoaded',()=>{
 const originalDetail=detail;detail=function(record){originalDetail(record);const sourceRecord=dataConfig?.releases?.find(r=>r.name===record.name&&r.date===record.date);appendSourceDetails(sourceRecord)};
 const coverage=document.createElement('details');coverage.className='data-coverage';coverage.id='data-coverage';coverage.innerHTML='<summary>Data coverage & verification</summary><div class="coverage-content"></div>';document.querySelector('#data-banner').after(coverage);
 function refreshQuality(){
  if(typeof dataConfig==='undefined'||!dataConfig)return;
  const qualified=qualifiedDataset(dataConfig),badge=document.querySelector('.demo-badge'),label=dataConfig.demo===true?'Demo dataset':qualified?'Updated dataset':'Unverified dataset';
  if(badge.textContent.trim()!==label){badge.replaceChildren();const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');badge.append(dot,document.createTextNode(' '+label))}
  const status=document.querySelector('#data-status'),latest=latestEntryDate(data);
  if(/^\d+ releases loaded/.test(status.textContent)&&latest){const text=`${data.length} releases loaded · ${dataConfig.demo===true?'Unverified demo data':qualified?'Source-checked release data':'Unverified release data'} · Updated ${latest}`;if(status.textContent!==text)status.textContent=text}
  const content=coverage.querySelector('.coverage-content');const stamp=`${dataConfig.updatedAt}|${dataConfig.releases.length}|${qualified}`;
  if(content.dataset.stamp===stamp)return;content.dataset.stamp=stamp;content.replaceChildren();
  const p=document.createElement('p');p.textContent=qualified?`${dataConfig.releases.length} curated events · Every event has dated first-party evidence · Checked ${dataConfig.quality.checkedAt}`:'This dataset has not passed the source-verification checks.';content.append(p);
  for(const key of ['coverage','datePolicy','grouping','automation'])if(dataConfig.quality?.[key]){const p=document.createElement('p');p.textContent=dataConfig.quality[key];content.append(p)}
  const a=document.createElement('a');a.href='https://github.com/nerdalytics/qwen-model-release-cadence-dashmodel/blob/main/SOURCE_AUDIT.md';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Read the source audit and corrections ↗';a.setAttribute('aria-label','Read the source audit and corrections (opens in a new tab)');content.append(a);
 }
 new MutationObserver(refreshQuality).observe(document.querySelector('#data-status'),{childList:true,characterData:true,subtree:true});
 new MutationObserver(refreshQuality).observe(document.querySelector('.demo-badge'),{childList:true,characterData:true,subtree:true});
 document.querySelector('#about').onclick=()=>openDialog('Source-checked release history.','<p>This dashboard loads a curated release and update snapshot from an external JSON file. Open any release to inspect its official source and dated evidence.</p><p class="notice">A checked snapshot is not a live announcement feed or a complete catalogue. Forecasts are interval estimates, not confirmed releases.</p>','CADENCE / DATA');
 const timeline=document.querySelector('#timeline');timeline.addEventListener('keydown',event=>{const point=event.target.closest('.chart-release');if(event.key==='Escape'&&point)point.dataset.tooltipHidden='true'});for(const name of ['focusin','pointerover'])timeline.addEventListener(name,event=>{const point=event.target.closest('.chart-release');if(point)delete point.dataset.tooltipHidden});
 function alignChartNames(){for(const point of timeline.querySelectorAll('.chart-release')){if(point.dataset.accessibleName==='true')continue;const visible=[...point.querySelectorAll(':scope > text')].map(text=>text.textContent.trim()).join(' '),original=point.getAttribute('aria-label');point.querySelector('title')?.remove();for(const text of point.querySelectorAll('text'))text.textContent=text.textContent.trim()+' ';if(visible)point.setAttribute('aria-label',visible+'. '+original);point.dataset.accessibleName='true'}}
 new MutationObserver(alignChartNames).observe(timeline,{childList:true});alignChartNames();
 refreshQuality();
});
