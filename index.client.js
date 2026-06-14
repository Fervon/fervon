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
