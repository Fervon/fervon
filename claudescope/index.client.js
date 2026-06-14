var $ = function(id){ return document.getElementById(id); };

    // ---- Copiar comando (CTA principal) ----
    function wireCopy(btnId){
      var btn = $(btnId); if(!btn) return;
      btn.addEventListener("click", function(){
        var txt = "npx claudescope-cli";
        var done = function(){ var o=btn.innerHTML; btn.classList.add("ok"); btn.innerHTML="✓ Copiado"; setTimeout(function(){ btn.classList.remove("ok"); btn.innerHTML=o; },1600); };
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done).catch(done); }
        else { try{ var t=document.createElement("textarea"); t.value=txt; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); }catch(e){} done(); }
      });
    }
    ["copyBtn","copyBtn2","copyBtn3"].forEach(wireCopy);

    // ---- Heatmap (patrón ilustrativo, determinista) ----
    (function(){
      var heat = $("heat"); if(!heat) return;
      var cells = 24*7;
      for(var i=0;i<cells;i++){
        var h=i%24, d=Math.floor(i/24);
        // intensidad: días laborables + horas de tarde/noche más activas
        var work = (d<5)?1:0.45;
        var hourCurve = Math.max(0, Math.sin((h-7)/15*Math.PI));
        var v = work*hourCurve;
        var s=document.createElement("span");
        var a = v<=0.04?0 : Math.min(1, 0.12 + v);
        s.style.background = a<=0 ? "var(--line)" : "rgba(255,"+Math.round(106+73*a)+","+Math.round(46*a)+","+(0.18+0.8*a).toFixed(2)+")";
        heat.appendChild(s);
      }
    })();

    // ---- Demo: tipea la query, revela resultados, sube contadores ----
    var q=$("q"), hits=$("hits"), res=$("res"), mSes=$("m-ses"), mMsg=$("m-msg"), mCache=$("m-cache");
    var sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
    function ramp(set,from,to,dur,fmt){ var start=performance.now(); return new Promise(function(res){ function frame(now){ var pr=Math.min(1,(now-start)/dur); var e=1-Math.pow(1-pr,3); set(fmt(from+(to-from)*e)); if(pr<1)requestAnimationFrame(frame); else res(); } requestAnimationFrame(frame); }); }
    var QUERY = "driver de postgres";
    async function typeQuery(){
      if(!q) return;
      q.textContent=""; var car=document.createElement("span"); car.className="car";
      var txt=document.createElement("span"); q.appendChild(txt); q.appendChild(car);
      for(var i=0;i<QUERY.length;i++){ txt.textContent=QUERY.slice(0,i+1); await sleep(58); }
      return;
    }
    async function loop(){
      // reset
      if(hits) hits.innerHTML="&nbsp;";
      res && res.querySelectorAll(".hit").forEach(function(h){ h.classList.remove("show"); });
      if(mSes) mSes.textContent="0"; if(mMsg) mMsg.textContent="0"; if(mCache) mCache.textContent="$0";
      await sleep(500);
      await typeQuery();
      await sleep(280);
      if(hits) hits.textContent="3 resultados";
      var hs = res ? res.querySelectorAll(".hit") : [];
      for(var i=0;i<hs.length;i++){ hs[i].classList.add("show"); await sleep(260); }
      await Promise.all([
        mSes?ramp(function(v){ mSes.textContent=Math.round(v); },0,342,1400,function(v){return v;}):null,
        mMsg?ramp(function(v){ mMsg.textContent=(Math.round(v)).toLocaleString("es-ES"); },0,34812,1400,function(v){return v;}):null,
        mCache?ramp(function(v){ mCache.textContent="$"+v.toFixed(0); },0,128,1400,function(v){return v;}):null
      ]);
      await sleep(3400); loop();
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!reduce){ var obs=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); loop(); } }); if(res) obs.observe(res); }
    else {
      if(q){ q.textContent=""; var t=document.createElement("span"); t.textContent=QUERY; q.appendChild(t); }
      if(hits) hits.textContent="3 resultados";
      res && res.querySelectorAll(".hit").forEach(function(h){ h.classList.add("show"); });
      if(mSes) mSes.textContent="342"; if(mMsg) mMsg.textContent=(34812).toLocaleString("es-ES"); if(mCache) mCache.textContent="$128";
    }

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
