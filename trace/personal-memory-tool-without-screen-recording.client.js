// ---- Hero: search + timeline reveal animation ----
    (function(){
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var qEl = document.getElementById("q");
      var rows = Array.prototype.slice.call(document.querySelectorAll("#res .rrow"));
      function query(){ return (document.documentElement.getAttribute("lang")==="es") ? "esa doc de API que estaba leyendo el viernes…" : "that API doc I was reading on Friday…"; }
      function showAll(){ if(qEl)qEl.textContent=query(); rows.forEach(function(r){ r.classList.add("in"); }); }
      var _lb=document.getElementById("lang"); if(_lb)_lb.addEventListener("click",function(){ setTimeout(function(){ if(qEl&&qEl.textContent) qEl.textContent=query(); },0); });
      if(reduce){ showAll(); return; }
      var done=false;
      function play(){
        if(done) return; done=true;
        var q=query();
        var i=0;
        (function type(){
          if(!qEl) return;
          qEl.textContent = q.slice(0,i);
          i++;
          if(i<=q.length){ setTimeout(type, 38); }
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
      function es(){ return document.documentElement.getAttribute("lang")==="es"; }
      function setMsg(t,cls){ if(!msg)return; msg.textContent=t; msg.className="fmsg"+(cls?" "+cls:""); }
      form.addEventListener("submit", function(ev){
        ev.preventDefault();
        var val=(input&&input.value||"").trim();
        if(!emailRe.test(val)){ setMsg(es()?"Introduce un correo válido, por favor.":"Please enter a valid email.","err"); if(input)input.focus(); return; }
        if(btn){ btn.disabled=true; btn.textContent=es()?"Uniéndote…":"Joining…"; }
        setMsg("","");
        fetch(form.action,{ method:"POST", body:new FormData(form), headers:{ "Accept":"application/json" } })
          .then(function(res){
            if(res.ok){ form.reset(); setMsg(es()?"🎉 ¡Estás en la lista! Revisa tu bandeja para confirmar.":"🎉 You're on the list! Check your inbox to confirm.","ok"); }
            else { return res.json().then(function(d){ throw new Error((d&&d.errors&&d.errors[0]&&d.errors[0].message)||"err"); }); }
          })
          .catch(function(){ setMsg(es()?"Vaya, no se envió. Inténtalo de nuevo en un momento.":"Hmm, that didn't send. Please try again in a moment.","err"); })
          .finally(function(){ if(btn){ btn.disabled=false; btn.textContent=btnText; } });
      });
    })();

    // ---- Reveal on scroll ----
    var rev=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); rev.unobserve(en.target); } }); },{threshold:.12});
    document.querySelectorAll(".reveal").forEach(function(el){ rev.observe(el); });

/* Fervon bilingual toggle — keep identical across all Fervon pages */
(function(){
  var KEY="fervon-lang";
  var base=(document.documentElement.getAttribute("lang")||"es").slice(0,2).toLowerCase();
  var other=base==="es"?"en":"es";
  var nodes=[].slice.call(document.querySelectorAll("[data-"+other+"]"));
  nodes.forEach(function(n){
    var a=n.getAttribute("data-i18n-attr");
    n.setAttribute("data-"+base, a?(n.getAttribute(a)||""):n.innerHTML);
  });
  function apply(lang){
    document.documentElement.setAttribute("lang",lang);
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i], v=n.getAttribute("data-"+lang);
      if(v===null) continue;
      var a=n.getAttribute("data-i18n-attr");
      if(a) n.setAttribute(a,v); else n.innerHTML=v;
    }
    var b=document.getElementById("lang"); if(b) b.textContent=(lang==="es"?"EN":"ES");
  }
  var saved=null; try{saved=localStorage.getItem(KEY);}catch(e){}
  var initial=saved||(((navigator.language||"").toLowerCase().slice(0,2)==="es")?"es":"en");
  apply(initial);
  var b=document.getElementById("lang");
  if(b) b.addEventListener("click",function(){
    var nx=(document.documentElement.getAttribute("lang")==="es")?"en":"es";
    try{localStorage.setItem(KEY,nx);}catch(e){}
    apply(nx);
  });
})();


/* Fervon mobile nav — universal, keep identical across all pages */
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
