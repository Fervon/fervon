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

    /* Lo que aún no se ha tecleado se pinta igualmente, invisible: así la caja
       nace con su altura final y el mensaje no empuja la página hacia abajo a
       cada salto de línea. MEDIDO: sin esto, 21,6 px de desplazamiento en el
       móvil de /pregon/. El `min-height:42px` del CSS no llegaba — en 390 px el
       mensaje ocupa cuatro líneas, no dos, y el número depende del ancho, del
       idioma y de la fuente, así que la reserva la hace el propio texto.

       `pinta` vive aquí fuera y no dentro de typeMsg porque `loop()` también la
       necesita: la demo se repite cada ~10 s y vaciaba el canon al empezar cada
       vuelta, que es exactamente deshacer la reserva. MEDIDO en producción:
       0,0044 de desplazamiento POR VUELTA, indefinidamente, mientras la demo
       esté a la vista. */
    var esc = function(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;"); };
    var pinta = function(n){
      canon.innerHTML = esc(MSG.slice(0,n)) + '<span class="cur"></span>' +
        '<span class="fantasma" aria-hidden="true">' + esc(MSG.slice(n)) + '</span>';
    };

    function typeMsg(){
      return new Promise(function(res){
        var i = 0;
        pinta(0);
        (function tick(){
          if(i <= MSG.length){
            pinta(i);
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
      pinta(0);   /* no vaciar: la caja conserva su altura entre vueltas */
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

  

