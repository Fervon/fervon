// ---- Hero: command-pipeline reveal animation (JS-controlled, no data-en) ----
    (function(){
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var qEl = document.getElementById("q");
      var rows = Array.prototype.slice.call(document.querySelectorAll("#res .rrow"));
      function queryFor(){ return (document.documentElement.getAttribute("lang")==="en") ? "govern the fleet — idea → reviewed code…" : "gobierna la flota — idea → código revisado…"; }
      function showAll(){ if(qEl)qEl.textContent=queryFor(); rows.forEach(function(r){ r.classList.add("in"); }); }
      if(reduce){ showAll(); return; }
      var done=false;
      function play(){
        if(done) return; done=true;
        var query=queryFor(), i=0;
        (function type(){
          if(!qEl) return;
          qEl.textContent = query.slice(0,i);
          i++;
          if(i<=query.length){ setTimeout(type, 36); }
          else { rows.forEach(function(r,k){ setTimeout(function(){ r.classList.add("in"); }, 260 + k*420); }); }
        })();
      }
      var obs=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); setTimeout(play,300); } },{threshold:.4});
      var host=document.getElementById("res"); if(host) obs.observe(host); else showAll();
    })();

    // ---- Waitlist form (Formspree, progressive enhancement) ----
    (function(){
      var form=document.getElementById("wl"); if(!form) return;
      var msg=document.getElementById("fmsg");
      var input=document.getElementById("email");
      var btn=form.querySelector("button[type=submit]");
      var btnText=btn?btn.textContent:"";
      var emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      function isEn(){ return document.documentElement.getAttribute("lang")==="en"; }
      function setMsg(t,cls){ if(!msg)return; msg.textContent=t; msg.className="fmsg"+(cls?" "+cls:""); }
      form.addEventListener("submit", function(ev){
        ev.preventDefault();
        var val=(input&&input.value||"").trim();
        if(!emailRe.test(val)){ setMsg(isEn()?"Please enter a valid email.":"Introduce un correo válido, por favor.","err"); if(input)input.focus(); return; }
        if(btn){ btn.disabled=true; btn.textContent=isEn()?"Sending…":"Enviando…"; }
        setMsg("","");
        fetch(form.action,{ method:"POST", body:new FormData(form), headers:{ "Accept":"application/json" } })
          .then(function(res){
            if(res.ok){ form.reset(); setMsg(isEn()?"🎉 You're on the list! Check your inbox to confirm.":"🎉 ¡Estás en la lista! Revisa tu bandeja para confirmar.","ok"); }
            else { return res.json().then(function(d){ throw new Error((d&&d.errors&&d.errors[0]&&d.errors[0].message)||"err"); }); }
          })
          .catch(function(){ setMsg(isEn()?"It didn't send. Please try again in a moment.":"Vaya, no se envió. Inténtalo de nuevo en un momento.","err"); })
          .finally(function(){ if(btn){ btn.disabled=false; btn.textContent=btnText; } });
      });
    })();

  

