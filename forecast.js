(function(root){
const DAY=86400000,ALPHA=.2;
function summarize(records,now=new Date()){
 const rows=[...records].sort((a,b)=>a.date.localeCompare(b.date)),dates=[...new Set(rows.map(r=>r.date))],gaps=dates.slice(1).map((d,i)=>(Date.parse(d)-Date.parse(dates[i]))/DAY);
 const mean=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null;
 const ema=gaps.reduce((value,gap)=>value===null?gap:ALPHA*gap+(1-ALPHA)*value,null),last=rows.at(-1)||null;
 const forecast=gap=>last&&gap!==null?new Date(Date.parse(last.date)+Math.max(1,Math.round(gap))*DAY).toISOString().slice(0,10):null;
 const emaDate=forecast(ema),meanDate=forecast(mean),today=new Date(now).toISOString().slice(0,10);
 const age=date=>date===null?null:Math.round((Date.parse(today)-Date.parse(date))/DAY);
 return {rows,dates,gaps,last,mean,ema,emaDate,meanDate,emaAge:age(emaDate),meanAge:age(meanDate),limited:gaps.length<3};
}
function types(records){const priority=['Generation','Max','Plus','Flash','27B','Coder','Coder Next','Next','Turbo'];return [...new Set(records.flatMap(r=>r.modelTypes||[]))].sort((a,b)=>{const x=priority.indexOf(a),y=priority.indexOf(b);return (x<0?999:x)-(y<0?999:y)||a.localeCompare(b,undefined,{numeric:true})})}
const api={summarize,types};if(typeof module==='object'&&module.exports)module.exports=api;else root.CadenceForecast=api;
})(typeof globalThis==='object'?globalThis:this);
