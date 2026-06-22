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

/* Ember particles — shared animated forge background.
   Self-injects a fixed canvas behind all content (the static gradient backdrop
   lives in shared.css as body::before). Sprite-based glow + sparks with trails.
   Honors reduced-motion (canvas skipped, CSS backdrop remains) and pauses while
   the tab is hidden so it costs nothing in the background. */
(function(){
  if(!document.body || document.getElementById("fv-embers")) return;
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var cv=document.createElement("canvas");
  cv.id="fv-embers"; cv.setAttribute("aria-hidden","true");
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx=cv.getContext("2d");
  var W,H,DPR=1,TAU=Math.PI*2,running=true;

  function resize(){ W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+"px";cv.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0); }
  resize(); addEventListener("resize",resize);

  // 4 temperature-tinted sprites — IDENTICAL to the hero forge emitter, so the
  // page-wide field reads as the same fire. Centres aren't pure alpha-1 (except
  // white) so additive 'lighter' accumulates heat without blowing out.
  var SPR_R=32;
  var SPRITES=(function(){
    function make(c0,c1,c2,out){ var s=document.createElement("canvas"); s.width=s.height=SPR_R*2;
      var g=s.getContext("2d"); var rad=g.createRadialGradient(SPR_R,SPR_R,0,SPR_R,SPR_R,SPR_R);
      rad.addColorStop(0,c0); rad.addColorStop(0.22,c1); rad.addColorStop(0.55,c2); rad.addColorStop(1,out);
      g.fillStyle=rad; g.fillRect(0,0,SPR_R*2,SPR_R*2); return s; }
    return [
      make("rgba(255,255,255,1)",   "rgba(255,244,214,.95)", "rgba(255,196,120,.45)", "rgba(255,150,80,0)"), // 0 white-hot
      make("rgba(255,248,224,.98)", "rgba(255,214,120,.92)", "rgba(255,150,40,.42)",  "rgba(255,120,30,0)"), // 1 yellow
      make("rgba(255,226,170,.96)", "rgba(255,150,54,.88)",  "rgba(232,86,16,.38)",   "rgba(210,60,12,0)"),  // 2 orange
      make("rgba(255,180,120,.92)", "rgba(240,92,24,.78)",   "rgba(150,30,6,.34)",    "rgba(120,20,0,0)")    // 3 red ember
    ];
  })();
  var TEMP_CAP=[0.50,0.62,0.74,0.85];

  // Forge heat glow (a dome anchored to the TOP, near the hero ingot).
  var GLOW_SPRITE=(function(){ var s=document.createElement("canvas"); s.width=s.height=256;
    var g=s.getContext("2d"); var rad=g.createRadialGradient(128,128,0,128,128,128);
    rad.addColorStop(0,"rgba(255,232,190,.52)"); rad.addColorStop(0.20,"rgba(255,168,72,.28)");
    rad.addColorStop(0.50,"rgba(232,84,16,.11)"); rad.addColorStop(0.78,"rgba(200,52,10,.04)");
    rad.addColorStop(1,"rgba(180,40,6,0)");
    g.fillStyle=rad; g.fillRect(0,0,256,256); return s; })();

  // spawn: slow convection + temperature by age + density falloff.
  // reset=true → recycled: re-enters from below and rises. reset=false → seed:
  // quadratic bias to small y (dense near the forge at the top).
  function spawn(reset){
    var rs=Math.random();
    var size=0.4 + rs*rs*rs*4.6;                    // power-law: ~75% micro-embers
    var d=Math.random();                            // depth: 0 far/dim .. 1 near/bright
    var by=reset ? (H+Math.random()*60)             // enters from below and rises
                 : (Math.random()*Math.random()*H); // quadratic → visual weight UP (the forge)
    var ang=-Math.PI/2 + (Math.random()-0.5)*0.55;  // narrow upward fan
    var sp=0.15 + Math.random()*0.40;               // slow launch 0.15..0.55 px/frame
    return { x:Math.random()*W, y:by, depth:d, size:size, big:size>2.2?1:0,
      vx:Math.cos(ang)*sp*0.45, vy:Math.sin(ang)*sp,
      buoy:(0.018+Math.random()*0.016)/(0.6+size*0.7),
      life:1, decay:(0.0024+Math.random()*0.0034)/(0.7+size*0.25),  // ~2-4.5s
      lum:0.40+size*0.10,
      flick:Math.random()*TAU, fspd:0.10+Math.random()*0.12,
      sway:Math.random()*TAU, swaySp:0.012+Math.random()*0.020, swayAmp:0.05+Math.random()*0.10,
      px:0, py:0 };
  }

  var COUNT=(window.innerWidth>=720)?130:60;       // <=150
  var embers=[];
  for(var _i=0;_i<COUNT;_i++) embers.push(spawn(false));

  document.addEventListener("visibilitychange",function(){
    if(document.hidden){ running=false; }
    else if(!running){ running=true; requestAnimationFrame(tick); }
  });

  var glowPhase=0;
  function tick(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation="lighter";

    // Forge heat glow: a dome in the upper third + a halo aligned with the hero
    // ingot's X, fading out as you scroll (one fire, one source — not per viewport).
    var sy=(window.pageYOffset||document.documentElement.scrollTop||0);
    var heat=1 - sy/Math.max(1,H*0.9); if(heat<0) heat=0;
    if(heat>0.001){
      glowPhase+=0.018;
      var pulse=0.84 + Math.sin(glowPhase)*0.12 + Math.sin(glowPhase*2.3)*0.04;
      var top=ctx.createLinearGradient(0,0,0,H*0.42);          // the heat falls FROM the top
      top.addColorStop(0,"rgba(255,120,40,"+(0.10*pulse*heat).toFixed(3)+")");
      top.addColorStop(1,"rgba(255,120,40,0)");
      ctx.fillStyle=top; ctx.fillRect(0,0,W,H*0.42);
      var bigv=W>=720;
      var fx=(typeof window.__fvForgeX==="number")?window.__fvForgeX:(bigv?W*0.78:W*0.5);
      var hy=H*0.10, hw=Math.max(W*0.9,720), hh=hw*0.62;
      ctx.globalAlpha=0.5*pulse*heat;
      ctx.drawImage(GLOW_SPRITE, fx-hw/2, hy-hh*0.35, hw, hh);
      ctx.globalAlpha=1;
    }

    // Embers: convection / temperature / alpha-ceiling identical to #forge-sparks.
    for(var k=0;k<embers.length;k++){
      var p=embers[k];
      p.vy-=p.buoy; p.vy*=0.96; p.vx*=0.94;                    // buoyancy + drag → convection, not a projectile
      p.sway+=p.swaySp; var swayX=Math.cos(p.sway)*p.swayAmp;
      p.px=p.x; p.py=p.y;
      p.x+=p.vx+swayX; p.y+=p.vy;
      p.life-=p.decay; p.flick+=p.fspd;
      if(p.life<=0||p.y<-25||p.x<-30||p.x>W+30){ Object.assign(p,spawn(true)); continue; }

      var life=p.life;
      var idx = life>0.80?0 : life>0.55?1 : life>0.30?2 : 3;   // temperature by age
      var spr=SPRITES[idx];
      var env = (life>0.88) ? (1-life)/0.12 : (life/0.88);     // fade-in 12% + fade-out
      if(env>1) env=1;
      var flick=0.82+Math.sin(p.flick)*0.18;
      var sizeDamp=1/(1+p.size*0.18);
      var depthDim=0.45+p.depth*0.55;                          // falloff: far embers dimmer
      var a=env*p.lum*flick*TEMP_CAP[idx]*sizeDamp*depthDim;
      if(a<=0) continue;

      var sz=p.size*4.4*(0.6+life*0.5)*(0.7+p.depth*0.6);

      if(p.big){ var dx=p.x-p.px, dy=p.y-p.py;                 // subtle motion-blur (not lines)
        ctx.globalAlpha=a*0.28; ctx.drawImage(spr, p.x-dx*1.6-sz/2, p.y-dy*1.6-sz/2, sz*0.90, sz*0.90);
        ctx.globalAlpha=a*0.50; ctx.drawImage(spr, p.x-dx*0.8-sz/2, p.y-dy*0.8-sz/2, sz*0.95, sz*0.95);
      }
      ctx.globalAlpha=a; ctx.drawImage(spr, p.x-sz/2, p.y-sz/2, sz, sz);
    }

    ctx.globalAlpha=1;
    ctx.globalCompositeOperation="source-over";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
