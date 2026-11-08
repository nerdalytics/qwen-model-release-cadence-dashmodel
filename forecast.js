(function(root){
const DAY=86400000,ALPHA=.2;
const algorithms=[
 {id:'mean',name:'Historical mean',color:'#24e3df',min:1,description:'Averages the gaps between all recorded release dates.'},
 {id:'ema',name:'EMA',color:'#edfa57',min:1,description:'α = 0.20. The first gap starts the calculation. Older gaps can dominate when few intervals are available.'},
 {id:'rolling-mean',name:'Recent mean',color:'#88b8ff',min:1,description:'Mean of the last three gaps, or all available gaps if fewer.'},
 {id:'rolling-median',name:'Recent median',color:'#ffcb92',min:1,description:'Median of the last three gaps. Less sensitive to one unusually long interval.'},
 {id:'weighted',name:'Weighted mean',color:'#e2a5ff',min:1,description:'Last three gaps weighted 20%, 30%, 50%, oldest to newest. Available weights are renormalized.'},
 {id:'holt',name:'Holt trend',color:'#ff9ac0',min:3,description:'Interval level and trend. α = 0.50, β = 0.30. The starting level is the first gap. The starting trend is the second gap minus the first.'},
 {id:'damped-holt',name:'Damped Holt',color:'#a9dfa0',min:3,description:'Holt with damping φ = 0.80, including during level and trend updates. Projects a weaker continuation of the interval trend.'},
 {id:'regression',name:'Linear interval trend',color:'#ffd85b',min:3,description:'Fits a straight line to gap length against gap number and extends it by one step.'},
 {id:'renewal',name:'Lognormal renewal',color:'#81e2f4',min:3,description:'Fits a lognormal waiting-time distribution to the gaps. The point estimate is the median. The estimated window covers the 10th to 90th percentiles.'},
 {id:'bayesian',name:'Bayesian partial pooling',color:'#d3d8ef',min:1,description:'Uses exponential waiting times with a Gamma rate prior. Related types set the prior mean gap and shape is 2. The model\'s own gaps update the rate. The point estimate is the predictive mean. The window covers the 10th to 90th percentiles. The prior is estimated from related types.'}
];
function summarize(records,now=new Date()){
 const rows=[...records].sort((a,b)=>a.date.localeCompare(b.date)),dates=[...new Set(rows.map(r=>r.date))],gaps=dates.slice(1).map((d,i)=>(Date.parse(d)-Date.parse(dates[i]))/DAY);
 const mean=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null;
 const ema=gaps.reduce((value,gap)=>value===null?gap:ALPHA*gap+(1-ALPHA)*value,null),last=rows.at(-1)||null;
 const forecast=gap=>last&&gap!==null?addDays(last.date,gap):null;
 const emaDate=forecast(ema),meanDate=forecast(mean),today=new Date(now).toISOString().slice(0,10);
 const age=date=>date===null?null:Math.round((Date.parse(today)-Date.parse(date))/DAY);
 return {rows,dates,gaps,last,mean,ema,emaDate,meanDate,emaAge:age(emaDate),meanAge:age(meanDate),limited:gaps.length<3};
}
function addDays(date,days){if(!Number.isFinite(days)||days<=0)return null;const time=Date.parse(date)+Math.max(1,Math.round(days))*DAY;if(!Number.isFinite(time)||time>Date.parse('2100-12-31'))return null;return new Date(time).toISOString().slice(0,10)}
function types(records){const priority=['Generation','Max','Plus','Flash','27B','Coder','Coder Next','Next','Turbo'];return [...new Set(records.flatMap(r=>r.modelTypes||[]))].sort((a,b)=>{const x=priority.indexOf(a),y=priority.indexOf(b);return (x<0?999:x)-(y<0?999:y)||a.localeCompare(b,undefined,{numeric:true})})}
function median(values){const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function average(values){return values.reduce((a,b)=>a+b,0)/values.length}
function holt(gaps,phi=1){let level=gaps[0],trend=gaps[1]-gaps[0];for(const gap of gaps.slice(1)){const previous=level;level=.5*gap+.5*(level+phi*trend);trend=.3*(level-previous)+.7*phi*trend}return {gap:level+phi*trend,level,trend}}
function regression(gaps){const n=gaps.length,x=(n-1)/2,y=average(gaps),den=gaps.reduce((s,v,i)=>s+(i-x)**2,0),slope=gaps.reduce((s,v,i)=>s+(i-x)*(v-y),0)/den;return {gap:y+slope*(n-x),slope}}
function normalCDF(z){const t=1/(1+.2316419*Math.abs(z)),density=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),tail=density*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return z<0?tail:1-tail}
function normalQuantile(p){
 if(p<=0)return -Infinity;if(p>=1)return Infinity;
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];
 if(p<.02425||p>1-.02425){const q=Math.sqrt(-2*Math.log(p<.5?p:1-p)),v=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);return p<.5?v:-v}
 const q=p-.5,r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}
function peerPrior(records,type){
 let cohort;
 if(['Max','Plus','Flash','Turbo'].includes(type))cohort=['Max','Plus','Flash','Turbo'];
 else if(type.startsWith('Coder'))cohort=types(records).filter(t=>t.startsWith('Coder'));
 else if(type==='Generation')return null;
 else cohort=types(records).filter(t=>t!=='Generation'&&!t.startsWith('Coder')&&!['Max','Plus','Flash','Turbo','1M context'].includes(t));
 const seen=new Set(),gaps=[],peers=[];
 for(const peer of cohort){if(peer===type)continue;const rows=records.filter(r=>r.modelTypes?.includes(peer)&&!r.modelTypes?.includes(type)),s=summarize(rows);if(!s.gaps.length)continue;peers.push(peer);for(let i=0;i<s.gaps.length;i++){const key=s.dates[i]+'|'+s.dates[i+1];if(!seen.has(key)){seen.add(key);gaps.push(s.gaps[i])}}}
 return gaps.length>=3?{mean:average(gaps),count:gaps.length,peers}:null;
}
function rawForecast(summary,algorithm,options={}){
 const {gaps,last}=summary,n=gaps.length,id=algorithm.id;
 if(n<algorithm.min)return {reason:`Requires ${algorithm.min} ${algorithm.min===1?'gap':'gaps'}. This history has ${n}.`};
 let gap,low=null,high=null,note='',conditional=false;
 const recent=gaps.slice(-3);
 if(id==='mean')gap=summary.mean;
 if(id==='ema')gap=summary.ema;
 if(id==='rolling-mean')gap=average(recent);
 if(id==='rolling-median')gap=median(recent);
 if(id==='weighted'){const weights=[.2,.3,.5].slice(-recent.length);gap=recent.reduce((sum,v,i)=>sum+v*weights[i],0)/weights.reduce((a,b)=>a+b,0)}
 if(id==='holt'||id==='damped-holt'){const result=holt(gaps,id==='holt'?1:.8);gap=result.gap;note=`Fitted gap level: ${result.level.toFixed(1)} days. Change per interval: ${result.trend.toFixed(1)} days.`}
 if(id==='regression'){const result=regression(gaps);gap=result.gap;note=`Change per interval: ${result.slope.toFixed(1)} days.`}
 const today=new Date(options.now||new Date()).toISOString().slice(0,10),elapsed=last?Math.max(0,(Date.parse(today)-Date.parse(last.date))/DAY):0;
 if(id==='renewal'){
  const logs=gaps.map(Math.log),mu=average(logs),sigma=Math.sqrt(average(logs.map(v=>(v-mu)**2)));
  let probability=0;
  if(options.conditioned&&elapsed>0){if(sigma<1e-10){if(elapsed>=Math.exp(mu))return {reason:'Elapsed wait is outside the fitted constant-gap distribution.'}}else probability=normalCDF((Math.log(elapsed)-mu)/sigma);if(probability>1-1e-10)return {reason:'Elapsed wait is outside a numerically reliable fitted tail.'};conditional=true}
  const quantile=p=>Math.exp(mu+sigma*normalQuantile(probability+(1-probability)*p));gap=quantile(.5);low=quantile(.1);high=quantile(.9);note=`Log-gap fit μ = ${mu.toFixed(3)}, σ = ${sigma.toFixed(3)}. Window excludes parameter uncertainty.`;
 }
 if(id==='bayesian'){
  const prior=peerPrior(options.peers||[],options.type||'');if(!prior)return {reason:'Needs at least 3 non-overlapping intervals from related peer types.'};
  const shape=2+n,rate=prior.mean+gaps.reduce((a,b)=>a+b,0)+(options.conditioned?elapsed:0),base=options.conditioned?elapsed:0;
  gap=base+rate/(shape-1);low=base+rate*(Math.pow(.9,-1/shape)-1);high=base+rate*(Math.pow(.1,-1/shape)-1);conditional=!!options.conditioned&&elapsed>0;
  note=`Peers: ${prior.peers.join(', ')}; ${prior.count} distinct peer intervals. Prior shape 2, rate ${prior.mean.toFixed(1)}d. Posterior shape ${shape}, rate ${rate.toFixed(1)}d. Assumes a constant release rate.`;
 }
 if(!Number.isFinite(gap)||gap<=0)return {reason:'The fitted trend predicts a gap of zero or fewer days, so a date cannot be calculated.',rawGap:gap};
 const date=addDays(last.date,gap),lowDate=low===null?null:addDays(last.date,low),highDate=high===null?null:addDays(last.date,high);
 if(!date||(high!==null&&!highDate))return {reason:'Estimated date is outside the supported range through 2100.'};
 return {gap,date,lowDate,highDate,note,conditional,age:(Date.parse(today)-Date.parse(date))/DAY,limited:n<(algorithm.min>=3?6:3),sample:n};
}
function backtest(records,algorithm,options={}){
 const s=summarize(records),errors=[];let attempts=0;
 for(let i=algorithm.min+1;i<s.dates.length;i++){
  attempts++;const cutoff=s.dates[i-1],training=records.filter(r=>r.date<=cutoff),peers=(options.peers||[]).filter(r=>r.date<=cutoff);
  const forecast=rawForecast(summarize(training,new Date(cutoff)),algorithm,{...options,peers,now:new Date(cutoff),conditioned:false});
  if(forecast.date)errors.push(Math.abs((Date.parse(forecast.date)-Date.parse(s.dates[i]))/DAY));
 }
 return {mae:errors.length?average(errors):null,trials:errors.length,attempts,rejected:attempts-errors.length};
}
function forecasts(records,options={}){options={...options,peers:(options.peers||[]).filter(r=>r.date<=new Date(options.now||new Date()).toISOString().slice(0,10))};const s=summarize(records,options.now||new Date());return algorithms.map(algorithm=>({...algorithm,...rawForecast(s,algorithm,options),backtest:options.backtest===false?null:backtest(records,algorithm,options)}))}
const api={summarize,types,algorithms,forecasts,peerPrior};if(typeof module==='object'&&module.exports)module.exports=api;else root.CadenceForecast=api;
})(typeof globalThis==='object'?globalThis:this);
