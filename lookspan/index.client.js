// ---- Copiar comando / código ----
    function flash(btn){ var lbl=btn.querySelector(".lbl"); var prev=lbl?lbl.textContent:""; btn.classList.add("ok"); if(lbl)lbl.textContent="¡Copiado!"; setTimeout(function(){ btn.classList.remove("ok"); if(lbl)lbl.textContent=prev; },1400); }
    document.querySelectorAll(".copy[data-copy]").forEach(function(btn){
      btn.addEventListener("click",function(){ navigator.clipboard && navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function(){ flash(btn); }); });
    });
    document.querySelectorAll(".copy-code").forEach(function(btn){
      btn.addEventListener("click",function(){ var pre=document.querySelector("pre.on code"); if(pre&&navigator.clipboard){ navigator.clipboard.writeText(pre.innerText).then(function(){ flash(btn); }); } });
    });

    // ---- Tabs de código ----
    document.querySelectorAll(".tab").forEach(function(tab){
      tab.addEventListener("click",function(){
        var name=tab.getAttribute("data-tab");
        document.querySelectorAll(".tab").forEach(function(t){ t.classList.toggle("on", t===tab); });
        document.querySelectorAll("pre").forEach(function(p){ p.classList.toggle("on", p.getAttribute("data-panel")===name); });
      });
    });

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
