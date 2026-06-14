// ---- Copiar comandos de arranque ----
    (function(){
      var btn = document.getElementById("copyBtn");
      if(!btn) return;
      var cmds = [
        "git clone https://github.com/JoniMartin27/launchpad",
        "cd launchpad",
        "npm install",
        "npm run build",
        "npm start"
      ].join("\n");
      btn.addEventListener("click", function(){
        var done = function(){ var t=btn.textContent; btn.textContent="✓ Copiado"; btn.style.color="var(--amber)"; setTimeout(function(){ btn.innerHTML="⧉ Copiar"; btn.style.color=""; },1600); };
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(cmds).then(done).catch(function(){ fallback(); }); }
        else { fallback(); }
        function fallback(){ var ta=document.createElement("textarea"); ta.value=cmds; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); done(); }catch(e){} document.body.removeChild(ta); }
      });
    })();

    // ---- Demo de la rejilla animada ----
    var $ = function(id){ return document.getElementById(id); };
    var log=$("log"), runCount=$("run-count");
    var sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
    function addLog(text,color){ if(!log)return; var l=document.createElement("div"); l.style.color=color||"var(--ash)"; l.textContent=text; log.appendChild(l); while(log.childNodes.length>6) log.removeChild(log.firstChild); log.scrollTop=log.scrollHeight; }
    function setDot(id,cls){ var el=$(id); if(el) el.className="sdot "+cls; }
    function setCount(n){ if(runCount) runCount.textContent=n; }
    async function loop(){
      // reset
      setDot("d0","s-idle"); setDot("d1","s-idle"); setDot("d2","s-idle"); setDot("d3","s-idle"); setCount(0);
      if(log) log.innerHTML='<div style="color:var(--dim)">$ mission-control · escaneando ~/code …</div>';
      await sleep(650);
      addLog("✓ 4 proyectos detectados · puertos 4000–4003 asignados","#9FC979");
      await sleep(700);
      addLog("→ api-server  · express  · npm run dev · :4000","var(--ember)"); setDot("d0","s-start");
      await sleep(700); setDot("d0","s-run"); setCount(1); addLog("✓ api-server listening on http://127.0.0.1:4000","#9FC979");
      await sleep(650);
      addLog("→ web-app     · vite     · npm run dev · :4001","var(--ember)"); setDot("d1","s-start");
      await sleep(750); setDot("d1","s-run"); setCount(2); addLog("✓ web-app ready in 612 ms · Local: :4001","#9FC979");
      await sleep(650);
      addLog("→ docs-site   · astro    · npm run dev · :4002","var(--ember)"); setDot("d2","s-start");
      await sleep(800); setDot("d2","s-run"); setCount(3); addLog("✓ docs-site running at :4002","#9FC979");
      await sleep(700);
      addLog("· worker-bot  · telegram · en reposo (no lanzado)","var(--dim)");
      await sleep(900);
      addLog("✓ 3 en marcha · sin choques de puerto","#9FC979");
      await sleep(3400); loop();
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!reduce){ var obs=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); loop(); } }); if(log) obs.observe(log); }
    else { setDot("d0","s-run"); setDot("d1","s-run"); setDot("d2","s-run"); setDot("d3","s-idle"); setCount(3); if(log){ log.innerHTML=''; addLog("✓ 3 en marcha · sin choques de puerto","#9FC979"); } }

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

