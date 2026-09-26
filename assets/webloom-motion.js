/* Shared, scroll-driven motion. Content and previews remain real DOM elements. */
(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const surfaces=[...document.querySelectorAll('[data-scrub],.form-card,.plan-card,.plan,.hero-row')];
  surfaces.forEach(el=>el.classList.add('wl-motion-surface'));
  const depth=[...document.querySelectorAll('[data-depth]')];
  let queued=false;
  function update(){
    queued=false;
    surfaces.forEach(el=>{
      const rect=el.getBoundingClientRect();
      const progress=reduce.matches?1:Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
      el.style.setProperty('--scrub',progress.toFixed(4));
    });
    depth.forEach(el=>{
      const rect=el.getBoundingClientRect();
      const offset=reduce.matches?0:Math.max(-12,Math.min(12,(rect.top+rect.height/2-innerHeight/2)*.025));
      el.style.setProperty('--depth-y',offset.toFixed(2)+'px');
    });
  }
  function request(){if(!queued){queued=true;requestAnimationFrame(update);}}
  addEventListener('scroll',request,{passive:true});addEventListener('resize',request);reduce.addEventListener('change',request);update();
  // Consistent page entry without hiding usable controls if JavaScript fails.
  document.body.classList.add('wl-ready');
})();
