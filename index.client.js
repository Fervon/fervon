(function(){
      var hm=document.querySelector('.hasmega'); if(!hm) return;
      var t, mq=window.matchMedia('(min-width:761px)');
      hm.addEventListener('mouseenter',function(){ if(!mq.matches) return; clearTimeout(t); hm.classList.add('open'); var bt=hm.querySelector('.navbtn'); if(bt)bt.setAttribute('aria-expanded','true'); });
      hm.addEventListener('mouseleave',function(){ clearTimeout(t); t=setTimeout(function(){ hm.classList.remove('open'); var bt=hm.querySelector('.navbtn'); if(bt)bt.setAttribute('aria-expanded','false'); },320); });
    })();

/* Mega menu — keyboard focus sync + Escape */
(function(){
  var hm=document.querySelector('.hasmega'); if(!hm) return;
  var bt=hm.querySelector('.navbtn');
  hm.addEventListener('focusin',function(){ if(bt)bt.setAttribute('aria-expanded','true'); });
  hm.addEventListener('focusout',function(e){ if(!hm.contains(e.relatedTarget)&&bt) bt.setAttribute('aria-expanded','false'); });
  hm.addEventListener('keydown',function(e){ if(e.key==='Escape'){ hm.classList.remove('open'); if(bt){ bt.setAttribute('aria-expanded','false'); bt.focus(); } } });
})();

/* Forge sparks — real particles emitted from the hot ingot on the home hero.
   The emitter is anchored to the ingot's position INSIDE hero-home.png and
   re-projected with the same math as background:cover (right-aligned X, centred
   Y), so it tracks the responsive crop at any width. Desktop only — the mobile
   hero swaps to a textured image with no anvil. Additive glow so the sparks
   read as embers and fuse with the page's ember background. Honors
   prefers-reduced-motion and pauses while the tab is hidden. */
(function(){
  var hero=document.querySelector('.hero'); if(!hero) return;
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SRC_W=1672, SRC_H=941;             // hero-home.png natural size
  var FORGE={x:0.74, y:0.43, w:0.15};    // ingot: bright-mass centre X, top-surface Y, mouth width
                                          // (measured from hero-home.png's glowing pixels)
  var DESKTOP=window.matchMedia('(min-width:900px)');

  var cv=document.createElement('canvas');
  cv.id='forge-sparks'; cv.setAttribute('aria-hidden','true');
  hero.insertBefore(cv, hero.firstChild);
  var ctx=cv.getContext('2d');
  var DPR=Math.min(window.devicePixelRatio||1, 2);
  var W=0, H=0, parts=[], raf=null, running=false;

  // Ember sprites tinted by temperature (white-hot → red), picked by age so embers
  // cool as they rise. Concentrated cores so micro-embers read as live points, not
  // blobs; centres aren't pure alpha-1 (except white) so additive 'lighter'
  // accumulates heat without blowing out.
  var SPR_R=32;
  var SPRITES=(function(){
    function make(c0,c1,c2,out){ var s=document.createElement('canvas'); s.width=s.height=SPR_R*2;
      var g=s.getContext('2d'); var rad=g.createRadialGradient(SPR_R,SPR_R,0,SPR_R,SPR_R,SPR_R);
      rad.addColorStop(0,c0); rad.addColorStop(0.22,c1); rad.addColorStop(0.55,c2); rad.addColorStop(1,out);
      g.fillStyle=rad; g.fillRect(0,0,SPR_R*2,SPR_R*2); return s; }
    return [
      make('rgba(255,255,255,1)',   'rgba(255,244,214,.95)', 'rgba(255,196,120,.45)', 'rgba(255,150,80,0)'), // 0 white-hot
      make('rgba(255,248,224,.98)', 'rgba(255,214,120,.92)', 'rgba(255,150,40,.42)',  'rgba(255,120,30,0)'), // 1 yellow
      make('rgba(255,226,170,.96)', 'rgba(255,150,54,.88)',  'rgba(232,86,16,.38)',   'rgba(210,60,12,0)'),  // 2 orange
      make('rgba(255,180,120,.92)', 'rgba(240,92,24,.78)',   'rgba(150,30,6,.34)',    'rgba(120,20,0,0)')    // 3 red ember
    ];
  })();

  // Source glow at the ingot mouth, drawn every frame BEFORE the embers, so the base
  // of the stream melts into the molten metal instead of looking pasted on.
  var GLOW_SPRITE=(function(){ var s=document.createElement('canvas'); s.width=s.height=256;
    var g=s.getContext('2d'); var rad=g.createRadialGradient(128,128,0,128,128,128);
    rad.addColorStop(0,'rgba(255,238,200,.90)'); rad.addColorStop(0.18,'rgba(255,184,92,.55)');
    rad.addColorStop(0.45,'rgba(255,120,30,.22)'); rad.addColorStop(0.75,'rgba(220,70,12,.07)');
    rad.addColorStop(1,'rgba(180,40,6,0)');
    g.fillStyle=rad; g.fillRect(0,0,256,256); return s; })();
  var glowPhase=0;

  function sourceGlow(){ var o=forge();
    glowPhase+=0.045;
    var pulse=0.82 + Math.sin(glowPhase)*0.13 + Math.sin(glowPhase*2.3)*0.05;     // irregular breathing
    var hw=o.w*2.6, hh=o.w*1.3;                                                   // soft flat halo → fuses with the dark bg
    ctx.globalAlpha=0.22*pulse; ctx.drawImage(GLOW_SPRITE, o.x-hw/2, o.y-hh*0.60, hw, hh);
    var cw=o.w*1.15, ch=o.w*0.75;                                                 // tight warm core → fuses the base with the metal
    ctx.globalAlpha=0.34*pulse; ctx.drawImage(GLOW_SPRITE, o.x-cw/2, o.y-ch*0.55, cw, ch);
    ctx.globalAlpha=1;
  }

  function resize(){ W=hero.clientWidth; H=hero.clientHeight; cv.width=W*DPR; cv.height=H*DPR; cv.style.width=W+'px'; cv.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }

  // project the ingot point: PNG fraction → hero px (cover scale, X aligned right, Y centred)
  function forge(){ var s=Math.max(W/SRC_W, H/SRC_H), dw=SRC_W*s, dh=SRC_H*s; var ox=W-dw, oy=(H-dh)/2;
    var r={ x:ox+FORGE.x*dw, y:oy+FORGE.y*dh, w:FORGE.w*dw };
    window.__fvForgeX=r.x;   // publish the ingot X so the page-wide ember field aligns its heat halo
    return r; }

  function spawn(n){ var o=forge();
    for(var i=0;i<n;i++){
      var u=(Math.random()+Math.random()-1);              // triangular [-1,1], denser at the mouth centre
      var px=o.x + u*o.w*0.55;
      var py=o.y + (Math.random()*5);                     // born at / just inside the molten surface
      var rs=Math.random();
      var size=0.4 + rs*rs*rs*4.6;                        // power-law: ~75% micro-embers, few large
      var big=size>2.2?1:0;
      var ang=-Math.PI/2 + (Math.random()-0.5)*0.55;      // narrow fan, mostly up (convection, not a shot)
      var sp=0.15 + Math.random()*0.40;                   // slow launch 0.15..0.55 px/frame
      var buoy=(0.020+Math.random()*0.018)/(0.6+size*0.7);// buoyancy: micro rise, large barely levitate
      var decay=(0.004+Math.random()*0.006)/(0.7+size*0.25); // long life ~1.7-4.5s
      parts.push({ x:px, y:py,
        vx:Math.cos(ang)*sp*0.45 + 0.06, vy:Math.sin(ang)*sp, buoy:buoy,
        life:1, decay:decay, size:size, big:big,
        lum:0.40+size*0.10,                               // micro glow less so 'lighter' doesn't burn
        flick:Math.random()*6.28, fspd:0.10+Math.random()*0.12,
        sway:Math.random()*6.28, swaySp:0.012+Math.random()*0.020, swayAmp:0.05+Math.random()*0.10,
        px:px, py:py });                                  // previous pos (trail for the large ones)
    }
  }

  function frame(){ if(!running) return;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';

    sourceGlow();                                          // 1) fuse the base of the stream with the ingot

    // 2) irregular bursts (not constant), low population cap
    if(parts.length<120){ var rr=Math.random();
      if(rr<0.55){ /* most frames: nothing → breathing */ }
      else if(rr<0.93) spawn(1);
      else spawn(3 + ((Math.random()*3)|0));               // micro-burst 3..5
    }

    for(var i=0;i<parts.length;i++){ var p=parts[i];
      p.vy-=p.buoy; p.vy*=0.96; p.vx*=0.94;                // buoyancy + strong air drag → convection, not a projectile
      p.sway+=p.swaySp; var swayX=Math.cos(p.sway)*p.swayAmp; // sideways thermal drift
      p.px=p.x; p.py=p.y;
      p.x+=p.vx+swayX; p.y+=p.vy;
      p.life-=p.decay; p.flick+=p.fspd;
      if(p.life<=0) continue;
      var life=p.life;

      var idx = life>0.80?0 : life>0.55?1 : life>0.30?2 : 3; // temperature by age: white→yellow→orange→red
      var spr = SPRITES[idx];

      var env = (life>0.88) ? (1-life)/0.12 : (life/0.88);   // fade-in (first 12%) + fade-out
      if(env>1) env=1;
      var flick=0.82+Math.sin(p.flick)*0.18;
      var tempCap=[0.50,0.62,0.74,0.85][idx];                // per-temperature alpha ceiling (lighter doesn't burn)
      var sizeDamp=1/(1+p.size*0.18);                        // large ones dimmer
      var a=env*p.lum*flick*tempCap*sizeDamp;
      if(a<=0) continue;

      var sz=p.size*4.4*(0.6+life*0.5);

      if(p.big){ var dx=p.x-p.px, dy=p.y-p.py;               // light motion-blur trail on the few large embers
        ctx.globalAlpha=a*0.28; ctx.drawImage(spr, p.x-dx*1.6-sz/2, p.y-dy*1.6-sz/2, sz*0.90, sz*0.90);
        ctx.globalAlpha=a*0.50; ctx.drawImage(spr, p.x-dx*0.8-sz/2, p.y-dy*0.8-sz/2, sz*0.95, sz*0.95);
      }

      ctx.globalAlpha=a; ctx.drawImage(spr, p.x-sz/2, p.y-sz/2, sz, sz);
    }

    ctx.globalAlpha=1;
    parts=parts.filter(function(p){ return p.life>0 && p.y>-25; });
    raf=requestAnimationFrame(frame);
  }

  function start(){ if(running||!DESKTOP.matches) return; running=true; resize(); forge(); raf=requestAnimationFrame(frame); }
  function stop(){ running=false; if(raf){ cancelAnimationFrame(raf); raf=null; } parts=[]; if(W) ctx.clearRect(0,0,W,H); }

  window.addEventListener('resize', function(){ if(running) resize(); else start(); });
  if(DESKTOP.addEventListener) DESKTOP.addEventListener('change', function(e){ e.matches?start():stop(); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else start(); });
  start();
})();

