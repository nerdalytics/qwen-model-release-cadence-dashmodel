document.addEventListener('DOMContentLoaded',()=>{
 const topButton=document.querySelector('#overview-nav'),main=document.querySelector('#main-content'),method=document.querySelector('#methodology'),heading=document.querySelector('#methodology-heading');
 function clearNavigation(){for(const link of document.querySelectorAll('.nav-link')){link.classList.remove('active');link.removeAttribute('aria-current')}}
 function visitMethodology(event){event?.preventDefault();method.scrollIntoView({behavior:'auto',block:'start'});heading.focus({preventScroll:true});setNavigation('method-nav')}
 methodology=visitMethodology;document.querySelector('#method-nav').onclick=visitMethodology;
 const releaseLink=document.querySelector('#log-nav'),visitReleases=releaseLink.onclick;releaseLink.onclick=event=>{event.preventDefault();visitReleases(event)};
 topButton.onclick=()=>{main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});clearNavigation();updateTopButton()};
 function updateTopButton(){const screenHeight=window.visualViewport?.height||window.innerHeight;const show=window.scrollY>=screenHeight;if(!show&&document.activeElement===topButton)main.focus({preventScroll:true});topButton.hidden=!show;}
 let scheduled=false;function scheduleUpdate(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;updateTopButton()})}
 window.addEventListener('scroll',scheduleUpdate,{passive:true});window.addEventListener('resize',scheduleUpdate,{passive:true});window.visualViewport?.addEventListener('resize',scheduleUpdate,{passive:true});window.addEventListener('pageshow',scheduleUpdate);document.querySelector('.brand').addEventListener('click',clearNavigation);updateTopButton();
});
