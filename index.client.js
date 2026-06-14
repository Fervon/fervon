(function(){
      var hm=document.querySelector('.hasmega'); if(!hm) return;
      var t, mq=window.matchMedia('(min-width:761px)');
      hm.addEventListener('mouseenter',function(){ if(!mq.matches) return; clearTimeout(t); hm.classList.add('open'); var bt=hm.querySelector('.navbtn'); if(bt)bt.setAttribute('aria-expanded','true'); });
      hm.addEventListener('mouseleave',function(){ clearTimeout(t); t=setTimeout(function(){ hm.classList.remove('open'); var bt=hm.querySelector('.navbtn'); if(bt)bt.setAttribute('aria-expanded','false'); },320); });
    })();


/* Fervon mobile nav — universal, keep identical across all pages */
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

/* Mega menu — keyboard focus sync + Escape */
(function(){
  var hm=document.querySelector('.hasmega'); if(!hm) return;
  var bt=hm.querySelector('.navbtn');
  hm.addEventListener('focusin',function(){ if(bt)bt.setAttribute('aria-expanded','true'); });
  hm.addEventListener('focusout',function(e){ if(!hm.contains(e.relatedTarget)&&bt) bt.setAttribute('aria-expanded','false'); });
  hm.addEventListener('keydown',function(e){ if(e.key==='Escape'){ hm.classList.remove('open'); if(bt){ bt.setAttribute('aria-expanded','false'); bt.focus(); } } });
})();


/* Fervon bilingual toggle — keep identical across all Fervon pages */
(function(){
  var KEY="fervon-lang";
  var base=(document.documentElement.getAttribute("lang")||"es").slice(0,2).toLowerCase();
  var other=base==="es"?"en":"es";
  var nodes=[].slice.call(document.querySelectorAll("[data-"+other+"]"));
  nodes.forEach(function(n){
    var a=n.getAttribute("data-i18n-attr");
    n.setAttribute("data-"+base, a?(n.getAttribute(a)||""):n.innerHTML);
  });
  function apply(lang){
    document.documentElement.setAttribute("lang",lang);
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i], v=n.getAttribute("data-"+lang);
      if(v===null) continue;
      var a=n.getAttribute("data-i18n-attr");
      if(a) n.setAttribute(a,v); else n.innerHTML=v;
    }
    var b=document.getElementById("lang"); if(b) b.textContent=(lang==="es"?"EN":"ES");
  }
  var saved=null; try{saved=localStorage.getItem(KEY);}catch(e){}
  var initial=saved||(((navigator.language||"").toLowerCase().slice(0,2)==="es")?"es":"en");
  apply(initial);
  var b=document.getElementById("lang");
  if(b) b.addEventListener("click",function(){
    var nx=(document.documentElement.getAttribute("lang")==="es")?"en":"es";
    try{localStorage.setItem(KEY,nx);}catch(e){}
    apply(nx);
  });
})();
