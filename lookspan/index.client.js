// ---- Copiar comando / código (con anuncio aria-live) ----
    var cpStatus=document.createElement("span"); cpStatus.id="cp-status"; cpStatus.setAttribute("role","status"); cpStatus.setAttribute("aria-live","polite"); cpStatus.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap"; document.body.appendChild(cpStatus);
    function flash(btn){ var lbl=btn.querySelector(".lbl"); var prev=lbl?lbl.textContent:""; var en=document.documentElement.getAttribute("lang")==="en"; btn.classList.add("ok"); if(lbl)lbl.textContent=en?"Copied!":"¡Copiado!"; cpStatus.textContent=en?"Copied to clipboard":"Copiado al portapapeles"; setTimeout(function(){ btn.classList.remove("ok"); if(lbl)lbl.textContent=prev; cpStatus.textContent=""; },1400); }
    document.querySelectorAll(".copy[data-copy]").forEach(function(btn){
      btn.addEventListener("click",function(){ navigator.clipboard && navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function(){ flash(btn); }); });
    });
    document.querySelectorAll(".copy-code").forEach(function(btn){
      btn.addEventListener("click",function(){ var pre=document.querySelector("pre.on code"); if(pre&&navigator.clipboard){ navigator.clipboard.writeText(pre.innerText).then(function(){ flash(btn); }); } });
    });

    // ---- Tabs de código (ARIA + navegación por teclado) ----
    (function(){
      var tabs=[].slice.call(document.querySelectorAll(".tab"));
      if(!tabs.length) return;
      var list=document.querySelector(".tabs[role=tablist]");
      if(list) list.setAttribute("aria-label","Ejemplos de integración");
      function panelFor(name){ return document.querySelector('pre[data-panel="'+name+'"]'); }
      tabs.forEach(function(tab){
        var name=tab.getAttribute("data-tab"); var p=panelFor(name); var on=tab.classList.contains("on");
        tab.setAttribute("role","tab"); tab.id="tab-"+name; tab.setAttribute("aria-controls","panel-"+name);
        tab.setAttribute("aria-selected",on?"true":"false"); tab.setAttribute("tabindex",on?"0":"-1");
        if(p){ p.setAttribute("role","tabpanel"); p.id="panel-"+name; p.setAttribute("aria-labelledby","tab-"+name); p.setAttribute("tabindex","0"); }
      });
      function activate(tab,focus){
        var name=tab.getAttribute("data-tab");
        tabs.forEach(function(t){ var sel=t===tab; t.classList.toggle("on",sel); t.setAttribute("aria-selected",sel?"true":"false"); t.setAttribute("tabindex",sel?"0":"-1"); });
        document.querySelectorAll("pre[data-panel]").forEach(function(p){ p.classList.toggle("on",p.getAttribute("data-panel")===name); });
        if(focus) tab.focus();
      }
      tabs.forEach(function(tab,i){
        tab.addEventListener("click",function(){ activate(tab,false); });
        tab.addEventListener("keydown",function(e){
          var n=null;
          if(e.key==="ArrowRight"||e.key==="ArrowDown") n=tabs[(i+1)%tabs.length];
          else if(e.key==="ArrowLeft"||e.key==="ArrowUp") n=tabs[(i-1+tabs.length)%tabs.length];
          else if(e.key==="Home") n=tabs[0];
          else if(e.key==="End") n=tabs[tabs.length-1];
          if(n){ e.preventDefault(); activate(n,true); }
        });
      });
    })();

    // ---- Animaciones al entrar en viewport (waterfall + costes) ----
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function fillBars(root){ root.querySelectorAll("[data-w]").forEach(function(el){ el.style.width=el.getAttribute("data-w")+"%"; }); }
    // demo trace: cuenta duración + coste y rellena las barras
    var demo=document.querySelector(".demo");
    function runDemo(){
      if(!demo)return; fillBars(demo);
      var dur=document.getElementById("d-dur"), cost=document.getElementById("d-cost");
      if(reduce){ if(dur)dur.textContent="1,284"; if(cost)cost.textContent="$0.0241"; return; }
      var start=performance.now();
      (function frame(now){ var pr=Math.min(1,(now-start)/1100); var e=1-Math.pow(1-pr,3);
        if(dur)dur.textContent=Math.round(1284*e).toLocaleString("en-US");
        if(cost)cost.textContent="$"+(0.0241*e).toFixed(4);
        if(pr<1)requestAnimationFrame(frame); })(start);
    }
    var costPanel=document.querySelector(".cpanel");
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ if(en.target===demo)runDemo(); else fillBars(en.target); io.unobserve(en.target); } }); },{threshold:.3});
    if(demo)io.observe(demo); if(costPanel)io.observe(costPanel);

    // ---- Reveal on scroll ----
    var rev=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); rev.unobserve(en.target); } }); },{threshold:.12});
    document.querySelectorAll(".reveal").forEach(function(el){ rev.observe(el); });
  


/* Fervon bilingual toggle — keep identical across all Fervon pages */
(function(){
  var KEY="fervon-lang";
  var base=(document.documentElement.getAttribute("lang")||"es").slice(0,2).toLowerCase();
  var other=base==="es"?"en":"es";
  var nodes=[].slice.call(document.querySelectorAll("[data-"+other+"]"));
  nodes.forEach(function(n){ var a=n.getAttribute("data-i18n-attr"); n.setAttribute("data-"+base, a?(n.getAttribute(a)||""):n.innerHTML); });
  function apply(lang){
    document.documentElement.setAttribute("lang",lang);
    for(var i=0;i<nodes.length;i++){ var n=nodes[i], v=n.getAttribute("data-"+lang); if(v===null) continue; var a=n.getAttribute("data-i18n-attr"); if(a) n.setAttribute(a,v); else n.innerHTML=v; }
    var b=document.getElementById("lang"); if(b) b.textContent=(lang==="es"?"EN":"ES");
  }
  var saved=null; try{saved=localStorage.getItem(KEY);}catch(e){}
  var initial=saved||(((navigator.language||"").toLowerCase().slice(0,2)==="es")?"es":"en");
  apply(initial);
  var b=document.getElementById("lang");
  if(b) b.addEventListener("click",function(){ var nx=(document.documentElement.getAttribute("lang")==="es")?"en":"es"; try{localStorage.setItem(KEY,nx);}catch(e){} apply(nx); });
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
