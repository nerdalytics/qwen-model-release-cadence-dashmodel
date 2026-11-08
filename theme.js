const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
function syncSystemTheme(){
 const theme=systemTheme.matches?'dark':'light';
 document.documentElement.dataset.theme=theme;
 document.documentElement.style.colorScheme=theme;
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=theme==='dark'?'#10151b':'#f6f6f3';
}
syncSystemTheme();
systemTheme.addEventListener('change',syncSystemTheme);
