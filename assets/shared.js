/* ============================================================
   Fervon — shared site script
   Loaded by every page AFTER its own client script.
   Currently: the universal accessible mobile navigation.
   ============================================================ */

/* Fervon mobile nav — builds an accessible hamburger + panel from the
   page's existing nav links; works for both the home mega-nav (.links)
   and the product/Trace breadcrumb nav (.menu). */
(function(){
  var bar=document.querySelector('.nav .bar')||document.querySelector('nav .bar');
  var src=document.querySelector('.nav .menu')||document.querySelector('nav .links');
  if(!bar||!src||bar.querySelector('.mnav-btn')) return;
  var links=[].slice.call(src.querySelectorAll('a[href]')).filter(function(a){ return !a.classList.contains('navbtn'); });
  if(!links.length) return;
  var btn=document.createElement('button');
  btn.type='button'; btn.className='mnav-btn';
  btn.setAttribute('aria-label','Menú'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-controls','mnav-panel');
  btn.innerHTML='<span></span><span></span><span></span>';
  var panel=document.createElement('nav');
  panel.className='mnav-panel'; panel.id='mnav-panel'; panel.setAttribute('aria-label','Menú');
  links.forEach(function(a){
    var c=document.createElement('a');
    c.href=a.getAttribute('href');
    c.textContent=((a.querySelector('.mi-n,.pname,.nm')||a).textContent||'').replace(/\s+/g,' ').trim();
    if(a.classList.contains('cta')||a.classList.contains('btn-fire')) c.className='hot';
    panel.appendChild(c);
  });
  var gh=bar.querySelector('.act a.btn-ghost, .act a[href*="github"]');
  if(gh){ var g=document.createElement('a'); g.href=gh.getAttribute('href'); g.textContent=(gh.textContent||'GitHub').replace(/\s+/g,' ').trim(); panel.appendChild(g); }
  var act=bar.querySelector('.act'); (act||bar).appendChild(btn); bar.appendChild(panel); bar.classList.add('mnav-on');
  function set(o){ btn.setAttribute('aria-expanded',o?'true':'false'); panel.classList.toggle('open',o); btn.classList.toggle('on',o); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); set(!panel.classList.contains('open')); });
  panel.addEventListener('click',function(e){ if(e.target.closest('a')) set(false); });
  document.addEventListener('click',function(e){ if(!bar.contains(e.target)) set(false); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') set(false); });
  window.addEventListener('resize',function(){ if(window.innerWidth>880) set(false); });
})();
