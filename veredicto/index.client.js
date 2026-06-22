// ---- Hero: PR verdict reveal animation ----
(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rows = Array.prototype.slice.call(document.querySelectorAll("#vlist .vrow"));
  var verdict = document.getElementById("verdict");
  function showAll(){ rows.forEach(function(r){ r.classList.add("in"); }); if(verdict) verdict.classList.add("in"); }
  if(reduce){ showAll(); return; }
  var done=false;
  function play(){
    if(done) return; done=true;
    rows.forEach(function(r,k){ setTimeout(function(){ r.classList.add("in"); }, 220 + k*360); });
    setTimeout(function(){ if(verdict) verdict.classList.add("in"); }, 220 + rows.length*360 + 200);
  }
  var host=document.getElementById("vlist");
  if(host && "IntersectionObserver" in window){
    var obs=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); setTimeout(play,300); } },{threshold:.4});
    obs.observe(host);
  } else { showAll(); }
})();

// ---- Waitlist form (Formspree, progressive enhancement) ----
(function(){
  var form=document.getElementById("wl"); if(!form) return;
  var msg=document.getElementById("fmsg");
  var input=document.getElementById("email");
  var btn=form.querySelector("button[type=submit]");
  var btnText=btn?btn.textContent:"";
  var emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function setMsg(t,cls){ if(!msg)return; msg.textContent=t; msg.className="fmsg"+(cls?" "+cls:""); }
  form.addEventListener("submit", function(ev){
    ev.preventDefault();
    var val=(input&&input.value||"").trim();
    if(!emailRe.test(val)){ setMsg("Introduce un correo válido, por favor.","err"); if(input)input.focus(); return; }
    if(btn){ btn.disabled=true; btn.textContent="Uniéndote…"; }
    setMsg("","");
    fetch(form.action,{ method:"POST", body:new FormData(form), headers:{ "Accept":"application/json" } })
      .then(function(res){
        if(res.ok){ form.reset(); setMsg("🎉 ¡Estás en la lista! Revisa tu bandeja para confirmar.","ok"); }
        else { return res.json().then(function(d){ throw new Error((d&&d.errors&&d.errors[0]&&d.errors[0].message)||"err"); }); }
      })
      .catch(function(){ setMsg("Vaya, no se envió. Inténtalo de nuevo en un momento.","err"); })
      .finally(function(){ if(btn){ btn.disabled=false; btn.textContent=btnText; } });
  });
})();
