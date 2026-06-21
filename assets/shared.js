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

/* Fervon bilingual toggle — ES/EN segmented control, persisted, used by every page */
(function(){
  var KEY="fervon-lang";
  var base=(document.documentElement.getAttribute("lang")||"es").slice(0,2).toLowerCase();
  var other=base==="es"?"en":"es";
  var nodes=[].slice.call(document.querySelectorAll("[data-"+other+"]"));
  nodes.forEach(function(n){ var a=n.getAttribute("data-i18n-attr"); n.setAttribute("data-"+base, a?(n.getAttribute(a)||""):n.innerHTML); });

  // Replace the legacy single #lang button with an ES/EN segmented control.
  var opts={};
  (function(){
    var old=document.getElementById("lang"); if(!old) return;
    var seg=document.createElement("div");
    seg.id="lang"; seg.className="langseg";
    seg.setAttribute("role","group"); seg.setAttribute("aria-label","Idioma / Language");
    ["es","en"].forEach(function(lg){
      var o=document.createElement("button");
      o.type="button"; o.className="langopt"; o.setAttribute("data-lang",lg);
      o.textContent=lg.toUpperCase();
      o.setAttribute("aria-label",lg==="es"?"Español":"English");
      o.addEventListener("click",function(){
        if(document.documentElement.getAttribute("lang")===lg) return;
        try{localStorage.setItem(KEY,lg);}catch(e){}
        apply(lg);
      });
      opts[lg]=o; seg.appendChild(o);
    });
    old.parentNode.replaceChild(seg,old);
  })();

  function apply(lang){
    document.documentElement.setAttribute("lang",lang);
    for(var i=0;i<nodes.length;i++){ var n=nodes[i], v=n.getAttribute("data-"+lang); if(v===null) continue; var a=n.getAttribute("data-i18n-attr"); if(a) n.setAttribute(a,v); else n.innerHTML=v; }
    if(opts.es&&opts.en){
      opts.es.classList.toggle("on",lang==="es"); opts.es.setAttribute("aria-pressed",lang==="es"?"true":"false");
      opts.en.classList.toggle("on",lang==="en"); opts.en.setAttribute("aria-pressed",lang==="en"?"true":"false");
    }
    document.dispatchEvent(new CustomEvent("fervon:lang",{detail:lang}));
  }
  var saved=null; try{saved=localStorage.getItem(KEY);}catch(e){}
  var initial=saved||(((navigator.language||"").toLowerCase().slice(0,2)==="es")?"es":"en");
  apply(initial);
})();

/* Reveal-on-scroll — fade/slide elements in as they enter the viewport.
   IO handles below-the-fold; a rAF pass reveals whatever is already on
   screen so content is never left hidden if the initial IO tick is missed. */
(function(){
  var pending=[].slice.call(document.querySelectorAll(".reveal")); if(!pending.length) return;
  function reveal(el){ el.classList.add("in"); }
  function check(){
    if(!pending.length) return;
    var vh=window.innerHeight||document.documentElement.clientHeight;
    pending=pending.filter(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<vh-40 && r.bottom>-40){ reveal(el); return false; }
      return true;
    });
    if(!pending.length){ window.removeEventListener("scroll",onScroll); window.removeEventListener("resize",onScroll); }
  }
  var ticking=false;
  function onScroll(){ if(ticking) return; ticking=true; requestAnimationFrame(function(){ ticking=false; check(); }); }
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll,{passive:true});
  // Initial passes as fonts/layout settle.
  requestAnimationFrame(check); setTimeout(check,120); setTimeout(check,500);
  // Final guard: never leave .reveal content stuck hidden, whatever happens.
  setTimeout(function(){ pending.forEach(reveal); pending=[]; },4000);
})();

/* Count-up — stat numbers tick from 0 to their value as they enter view.
   Parses an optional prefix ($) and suffix (×) around the integer. Respects
   reduced-motion (shows the final value immediately). No-ops if no .stats. */
(function(){
  var els=[].slice.call(document.querySelectorAll(".stats .v")); if(!els.length) return;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function parse(t){ var m=/^(\D*?)(\d[\d.,]*)(.*)$/.exec((t||"").trim()); if(!m) return null; return {pre:m[1],num:parseFloat(m[2].replace(/,/g,"")),suf:m[3],raw:(t||"").trim()}; }
  els.forEach(function(el){ var p=parse(el.textContent); if(!p) return; el._cu=p; if(!reduce) el.textContent=p.pre+"0"+p.suf; });
  function run(el){ var p=el._cu; if(!p) return; if(reduce){ el.textContent=p.raw; return; }
    var dur=1000,t0=null; (function step(ts){ if(!t0)t0=ts; var k=Math.min(1,(ts-t0)/dur); var e=1-Math.pow(1-k,3); el.textContent=p.pre+Math.round(p.num*e)+p.suf; if(k<1) requestAnimationFrame(step); else el.textContent=p.raw; })(); }
  if(!("IntersectionObserver" in window)){ els.forEach(function(el){ if(el._cu) el.textContent=el._cu.raw; }); return; }
  var io=new IntersectionObserver(function(ents){ ents.forEach(function(en){ if(en.isIntersecting){ run(en.target); io.unobserve(en.target); } }); },{threshold:.6});
  els.forEach(function(el){ if(el._cu) io.observe(el); });
})();
