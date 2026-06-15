// ---- Demo: compón → fan-out ----
    var $ = function(id){ return document.getElementById(id); };
    var canon = $("canon"), fanout = $("fanout");
    var sleep = function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
    var MSG = "🦋 Lookspan v0.4.1 ya disponible: observabilidad local-first para tus agentes de IA. Open source.";
    var STATES = [
      { id:"st-bsky", t:"✓ publicado" },
      { id:"st-mast", t:"✓ publicado" },
      { id:"st-red",  t:"✓ publicado" },
      { id:"st-x",    t:"abrir →" },
      { id:"st-hn",   t:"abrir →" }
    ];

    function typeMsg(){
      return new Promise(function(res){
        var i = 0;
        canon.innerHTML = '<span class="cur"></span>';
        (function tick(){
          if(i <= MSG.length){
            canon.innerHTML = MSG.slice(0,i).replace(/</g,"&lt;") + '<span class="cur"></span>';
            i++;
            setTimeout(tick, 22);
          } else { res(); }
        })();
      });
    }

    function resetRows(){
      document.querySelectorAll(".frow").forEach(function(r){ r.classList.remove("in"); });
      STATES.forEach(function(s){ var el=$(s.id); if(el) el.textContent="···"; });
      // bsky badge muestra el conteo adaptado
      var bs = $("ad-bsky"); if(bs) bs.textContent = "≤300";
    }

    async function loop(){
      resetRows();
      canon.innerHTML = '<span class="cur"></span>';
      await sleep(500);
      await typeMsg();
      await sleep(350);
      var rows = Array.prototype.slice.call(document.querySelectorAll(".frow"));
      for(var k=0;k<rows.length;k++){
        rows[k].classList.add("in");
        await sleep(230);
        var st = $(STATES[k].id);
        if(st){ await sleep(260); st.textContent = STATES[k].t; }
      }
      // muestra el recorte real de bluesky (300) como guiño al motor
      var bs = $("ad-bsky"); if(bs){ await sleep(300); bs.textContent = "96/300"; }
      await sleep(3600);
      loop();
    }

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!reduce){
      var obs = new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); loop(); } });
      if(canon) obs.observe(canon);
    } else {
      if(canon) canon.textContent = MSG;
      document.querySelectorAll(".frow").forEach(function(r){ r.classList.add("in"); });
      STATES.forEach(function(s){ var el=$(s.id); if(el) el.textContent = s.t; });
      var bs = $("ad-bsky"); if(bs) bs.textContent = "96/300";
    }

  

