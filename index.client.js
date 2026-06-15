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

