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
  var W,H,DPR=1,TAU=Math.PI*2,embers=[],sparks=[],running=true,i;

  function resize(){ W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+"px";cv.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0); }
  resize(); addEventListener("resize",resize);

  // depth: 0 = far (small, slow, dim) .. 1 = near (big, fast, bright)
  function spawn(reset){ var d=Math.random(); return {x:Math.random()*W,y:reset?H+Math.random()*60:Math.random()*H,depth:d,r:d*2.6+0.5,vy:d*1.4+0.25,vx:(Math.random()-0.5)*0.4,sway:Math.random()*TAU,swaySpeed:Math.random()*0.02+0.005,swayAmp:d*0.7+0.15,life:Math.random()*0.5+0.5,flick:Math.random()*TAU,hue:16+Math.random()*30}; }
  function spawnSpark(){ return {x:Math.random()*W,y:H+Math.random()*30,px:0,py:0,vy:Math.random()*3.5+2.2,vx:(Math.random()-0.5)*0.8,r:Math.random()*1.2+0.7,life:1,decay:Math.random()*0.008+0.004,hue:30+Math.random()*22}; }

  // pre-rendered glowing ember sprite (radial gradient) — cheap to draw many times
  function makeSprite(h){ var size=64,c=document.createElement("canvas");c.width=c.height=size;var g=c.getContext("2d");var rad=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);rad.addColorStop(0,"hsla("+(h+12)+",100%,88%,1)");rad.addColorStop(0.18,"hsla("+(h+6)+",100%,70%,0.95)");rad.addColorStop(0.45,"hsla("+h+",100%,55%,0.5)");rad.addColorStop(1,"hsla("+h+",100%,50%,0)");g.fillStyle=rad;g.fillRect(0,0,size,size);return c; }
  var SPRITES=[]; for(var sh=14;sh<=46;sh+=4) SPRITES.push(makeSprite(sh));
  function spriteFor(hue){ return SPRITES[Math.min(SPRITES.length-1,Math.max(0,Math.round((hue-14)/4)))]; }

  var big=innerWidth>=720, COUNT=big?150:75, NSP=big?12:6;
  for(i=0;i<COUNT;i++){ var e=spawn(false); e.img=spriteFor(e.hue); embers.push(e); }
  for(i=0;i<NSP;i++){ var s=spawnSpark(); s.y=Math.random()*H; sparks.push(s); }

  document.addEventListener("visibilitychange",function(){
    if(document.hidden){ running=false; }
    else if(!running){ running=true; requestAnimationFrame(tick); }
  });

  function tick(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation="lighter";

    // soft heat glow rising from the base
    var glow=ctx.createLinearGradient(0,H,0,H*0.5);
    glow.addColorStop(0,"rgba(255,106,0,0.12)"); glow.addColorStop(1,"rgba(255,106,0,0)");
    ctx.fillStyle=glow; ctx.fillRect(0,H*0.5,W,H*0.5);

    // embers (sprite-based glow — no per-particle shadowBlur)
    for(var k=0;k<embers.length;k++){
      var em=embers[k];
      em.sway+=em.swaySpeed; em.x+=em.vx+Math.sin(em.sway)*em.swayAmp*0.5; em.y-=em.vy; em.flick+=0.15;
      if(em.y<-12||em.x<-20||em.x>W+20){ Object.assign(em,spawn(true)); em.img=spriteFor(em.hue); }
      var fade=Math.min(1,em.y/H+0.15), flicker=0.72+Math.sin(em.flick)*0.28;
      ctx.globalAlpha=em.life*fade*flicker*(0.35+em.depth*0.65);
      var sz=em.r*(3.5+em.depth*3);
      ctx.drawImage(em.img,em.x-sz/2,em.y-sz/2,sz,sz);
    }
    ctx.globalAlpha=1;

    // sparks with streak trail
    for(var j=0;j<sparks.length;j++){
      var sp=sparks[j];
      if(sp.life<=0||sp.y<-10){ Object.assign(sp,spawnSpark()); continue; }
      sp.px=sp.x; sp.py=sp.y; sp.x+=sp.vx; sp.y-=sp.vy; sp.vy*=0.992; sp.life-=sp.decay;
      ctx.strokeStyle="hsla("+sp.hue+",100%,68%,"+(sp.life*0.9)+")"; ctx.lineWidth=sp.r; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(sp.px,sp.py); ctx.lineTo(sp.x,sp.y); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle="hsla("+(sp.hue+8)+",100%,80%,"+sp.life+")"; ctx.arc(sp.x,sp.y,sp.r*0.9,0,TAU); ctx.fill();
    }

    ctx.globalCompositeOperation="source-over";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
