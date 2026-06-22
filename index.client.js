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

  // pre-rendered radial glow sprite: white-hot core → amber → transparent
  var sprite=(function(){ var s=document.createElement('canvas'); s.width=s.height=32;
    var g=s.getContext('2d'); var rad=g.createRadialGradient(16,16,0,16,16,16);
    rad.addColorStop(0,'rgba(255,255,255,1)'); rad.addColorStop(.28,'rgba(255,214,140,.95)');
    rad.addColorStop(.65,'rgba(255,123,26,.55)'); rad.addColorStop(1,'rgba(255,60,0,0)');
    g.fillStyle=rad; g.fillRect(0,0,32,32); return s; })();

  function resize(){ W=hero.clientWidth; H=hero.clientHeight; cv.width=W*DPR; cv.height=H*DPR; cv.style.width=W+'px'; cv.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }

  // project the ingot point: PNG fraction → hero px (cover scale, X aligned right, Y centred)
  function forge(){ var s=Math.max(W/SRC_W, H/SRC_H), dw=SRC_W*s, dh=SRC_H*s; var ox=W-dw, oy=(H-dh)/2; return { x:ox+FORGE.x*dw, y:oy+FORGE.y*dh, w:FORGE.w*dw }; }

  function spawn(n){ var o=forge();
    for(var i=0;i<n;i++){ var ang=-Math.PI/2 + (Math.random()-0.5)*0.7;   // mostly up, slight fan
      var sp=0.6+Math.random()*2.2;
      parts.push({ x:o.x+(Math.random()-0.5)*o.w, y:o.y+(Math.random()-0.5)*8,
        vx:Math.cos(ang)*sp + 0.5,                                        // drift right, like the real sparks
        vy:Math.sin(ang)*sp - (0.6+Math.random()*1.4),                    // launch upward
        life:1, decay:0.008+Math.random()*0.012, size:0.8+Math.random()*1.8,
        flick:Math.random()*6.28 }); }
  }

  function frame(){ if(!running) return;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    if(parts.length<130) spawn(2);
    for(var i=0;i<parts.length;i++){ var p=parts[i];
      p.vy+=0.012;                                                        // gentle gravity: they slow, arc, dim
      p.vx*=0.99; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay; p.flick+=0.3;
      var a=Math.max(0,p.life)*(0.7+Math.sin(p.flick)*0.3);               // flicker
      var sz=p.size*6*(0.5+p.life*0.5);
      ctx.globalAlpha=a; ctx.drawImage(sprite, p.x-sz/2, p.y-sz/2, sz, sz);
    }
    ctx.globalAlpha=1;
    parts=parts.filter(function(p){ return p.life>0 && p.y>-20; });
    raf=requestAnimationFrame(frame);
  }

  function start(){ if(running||!DESKTOP.matches) return; running=true; resize(); raf=requestAnimationFrame(frame); }
  function stop(){ running=false; if(raf){ cancelAnimationFrame(raf); raf=null; } parts=[]; if(W) ctx.clearRect(0,0,W,H); }

  window.addEventListener('resize', function(){ if(running) resize(); else start(); });
  if(DESKTOP.addEventListener) DESKTOP.addEventListener('change', function(e){ e.matches?start():stop(); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else start(); });
  start();
})();

