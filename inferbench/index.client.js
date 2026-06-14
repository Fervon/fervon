// ---- Descarga: detección de SO ----
    (function(){
      var bins = {
        win:   { name:"Windows",  file:".exe · Setup",          icon:"🪟", url:"https://github.com/JoniMartin27/inferbench/releases/latest" },
        mac:   { name:"macOS",    file:".dmg · Apple Silicon",  icon:"🍎", url:"https://github.com/JoniMartin27/inferbench/releases/latest" },
        linux: { name:"Linux",    file:".AppImage",             icon:"🐧", url:"https://github.com/JoniMartin27/inferbench/releases/latest" }
      };
      var p = (navigator.userAgent + " " + (navigator.platform||"")).toLowerCase();
      var os = p.indexOf("win")>-1 ? "win" : (p.indexOf("mac")>-1||p.indexOf("iphone")>-1||p.indexOf("ipad")>-1) ? "mac" : (p.indexOf("linux")>-1||p.indexOf("android")>-1) ? "linux" : null;
      if(os && bins[os]){
        var b = bins[os], main = document.getElementById("dlMain");
        main.href = b.url;
        document.getElementById("dlOsName").textContent = b.name;
        document.getElementById("dlFile").textContent = b.file;
        // resaltar el chip del SO actual y mover los otros (deja los 3 visibles)
        var chip = document.querySelector('.dlchip[data-os="'+os+'"]');
        if(chip) chip.style.display = "none";
      }
    })();

    // ---- Demo de benchmark animada ----
    var $ = function(id){ return document.getElementById(id); };
    var log=$("log"), bar=$("bar"), phaseLabel=$("phase-label"), phasePct=$("phase-pct"), mTps=$("m-tps"), mTtft=$("m-ttft"), mVram=$("m-vram");
    var sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
    function addLog(text,color){ if(!log)return; var l=document.createElement("div"); l.style.color=color||"var(--ash)"; l.textContent=text; log.appendChild(l); while(log.childNodes.length>6) log.removeChild(log.firstChild); log.scrollTop=log.scrollHeight; }
    function ramp(set,from,to,dur,fmt){ var start=performance.now(); return new Promise(function(res){ function frame(now){ var pr=Math.min(1,(now-start)/dur); var e=1-Math.pow(1-pr,3); set(fmt(from+(to-from)*e)); if(pr<1)requestAnimationFrame(frame); else res(); } requestAnimationFrame(frame); }); }
    function setPhase(label,target){ if(phaseLabel)phaseLabel.textContent=label; var cur=parseFloat((bar&&bar.style.width||"0").replace("%",""))||0; return ramp(function(v){ if(bar)bar.style.width=v+"%"; if(phasePct)phasePct.textContent=Math.round(v)+"%"; },cur,target,700,function(v){return v;}); }
    async function loop(){
      if(mTps)mTps.textContent="0.0"; if(mTtft)mTtft.innerHTML='— <span style="font-size:13px">ms</span>'; if(mVram)mVram.innerHTML='0.0 <span style="font-size:13px">GB</span>'; if(bar)bar.style.width="0%"; if(log)log.innerHTML='<div style="color:var(--dim)">$ inferbench run --auto</div>';
      addLog("→ Detectando hardware… RTX 4060 · 8 GB · 32 GB RAM","var(--dim)"); await sleep(700);
      addLog("→ Optimizando: Q4_K_M · ctx 8192 · MoE offload 27 capas","var(--ember)");
      await setPhase("Descargando binario llama.cpp…",22); addLog("✓ llama-server (CUDA) listo","#9FC979");
      await setPhase("Descargando GGUF desde Hugging Face…",70); addLog("✓ qwen3-30b-a3b-Q4_K_M.gguf · 18.6 GB","#9FC979");
      await setPhase("Arrancando motor…",85); await sleep(400);
      if(mTtft) await ramp(function(v){ mTtft.innerHTML=Math.round(v)+' <span style="font-size:13px">ms</span>'; },0,213,600,function(v){return v;});
      addLog("→ TTFT 213 ms · generando…","var(--ash)");
      await setPhase("Benchmark en vivo…",100);
      await Promise.all([
        mTps?ramp(function(v){ mTps.textContent=v.toFixed(1); },0,47.3,2200,function(v){return v;}):null,
        mVram?ramp(function(v){ mVram.innerHTML=v.toFixed(1)+' <span style="font-size:13px">GB</span>'; },0,7.4,2200,function(v){return v;}):null
      ]);
      addLog("✓ run completada · 47.3 tok/s · calidad 87/100","#9FC979");
      if(phaseLabel)phaseLabel.textContent="Completado ✓";
      await sleep(3200); loop();
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!reduce){ var obs=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); loop(); } }); if(log) obs.observe(log); }
    else { if(mTps)mTps.textContent="47.3"; if(mTtft)mTtft.innerHTML='213 <span style="font-size:13px">ms</span>'; if(mVram)mVram.innerHTML='7.4 <span style="font-size:13px">GB</span>'; if(bar)bar.style.width="100%"; if(phasePct)phasePct.textContent="100%"; if(phaseLabel)phaseLabel.textContent="Completado ✓"; }

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

