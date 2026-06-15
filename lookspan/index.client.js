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

  

