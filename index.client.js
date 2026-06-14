(function(){
      var hm=document.querySelector('.hasmega'); if(!hm) return;
      var t, mq=window.matchMedia('(min-width:761px)');
      hm.addEventListener('mouseenter',function(){ if(!mq.matches) return; clearTimeout(t); hm.classList.add('open'); });
      hm.addEventListener('mouseleave',function(){ clearTimeout(t); t=setTimeout(function(){ hm.classList.remove('open'); },320); });
    })();
