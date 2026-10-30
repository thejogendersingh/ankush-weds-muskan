/* Native equivalents of the supplied motion references for this static invitation. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function initGlowingCopy() {
    const titles = $$('.section-heading, .event-card-copy h3, .wardrobe-card-copy h3, .form-card-title');
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('glow-active');
        observer.unobserve(entry.target);
      }
    }, { threshold: .15, rootMargin: '0px 0px -25px 0px' }) : null;
    for (const title of titles) {
      splitCharacters(title, 0);
      if (observer) observer.observe(title); else title.classList.add('glow-active');
    }
  }
  function splitCharacters(element, startDelay) {
    const original = element.innerText || element.textContent || '';
    element.setAttribute('aria-label', original.trim().replace(/\s+/gu, ' '));
    // Connected calligraphy must remain a single text run for its joins and swashes.
    if (element.matches('.section-heading, .form-card-title')) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let index = 0;
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const token of (node.textContent || '').match(/\s+|\S+/gu) || []) {
        if (/^\s/u.test(token)) { fragment.append(document.createTextNode(token)); index += [...token].length; continue; }
        const word = document.createElement('span'); word.className = 'glow-word'; word.setAttribute('aria-hidden', 'true');
        const graphemes = typeof Intl.Segmenter === 'function'
          ? [...new Intl.Segmenter(document.documentElement.lang || 'en', { granularity: 'grapheme' }).segment(token)].map(part => part.segment)
          : [...token];
        for (const char of graphemes) {
          const span = document.createElement('span'); span.className = 'glow-char'; span.textContent = char;
          span.style.setProperty('--glow-delay', `${(startDelay + .2 + index * .045).toFixed(3)}s`);
          span.style.setProperty('--glow-duration', '.5s'); word.append(span); index++;
        }
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
  }

  window.v2GlowTitle = element => {
    if (!element) return;
    splitCharacters(element, 0);
    element.classList.remove('glow-active');
    requestAnimationFrame(() => element.classList.add('glow-active'));
  };
  window.v2SetTitle = (element, value) => {
    if (!element) return;
    const alreadyVisible = element.classList.contains('glow-active');
    element.textContent = value;
    splitCharacters(element, 0);
    if (alreadyVisible) {
      element.classList.remove('glow-active');
      void element.offsetWidth;
      element.classList.add('glow-active');
    }
  };

  function initLiquidGlass() {
    const card = $('#hero .hero-card');
    if (!card) return;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--glass-x', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glass-y', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--glass-x');
      card.style.removeProperty('--glass-y');
    });
  }

  function initRsvpGlassAndGuestCounter() {
    for (const card of $$('#rsvp-section .form-card')) {
      card.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--glass-x', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
        card.style.setProperty('--glass-y', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--glass-x');
        card.style.removeProperty('--glass-y');
      });
    }

    const input = $('#f-guests'), display = $('#guest-count-display');
    const minus = $('#guest-decrease'), plus = $('#guest-increase');
    if (!input || !display || !minus || !plus) return;
    const minimum = Number(input.dataset.min) || 1;
    const maximum = Number(input.dataset.max) || 20;
    let count = Number(input.value) || minimum;
    function setCount(next, animate = true) {
      const value = Math.min(maximum, Math.max(minimum, next));
      if (value !== count) {
        const old = display.querySelector('.guest-number-current');
        const fresh = document.createElement('span');
        fresh.className = 'guest-number-current';
        fresh.textContent = String(value);
        if (animate && !reduceMotion.matches) {
          old?.classList.remove('guest-number-current');
          old?.classList.add('guest-number-leaving');
          fresh.classList.add('guest-number-entering');
          display.append(fresh);
          setTimeout(() => old?.remove(), 320);
          setTimeout(() => fresh.classList.remove('guest-number-entering'), 320);
        } else {
          display.replaceChildren(fresh);
        }
      }
      count = value;
      input.value = String(value);
      display.setAttribute('aria-label', `${value} ${value === 1 ? (window.invitationT?.('guest') || 'guest') : (window.invitationT?.('guests') || 'guests')}`);
      minus.disabled = value <= minimum;
      plus.disabled = value >= maximum;
    }
    minus.addEventListener('click', () => setCount(count - 1));
    plus.addEventListener('click', () => setCount(count + 1));
    $('#rsvp-form')?.addEventListener('reset', () => requestAnimationFrame(() => setCount(Number(input.value) || minimum)));
    setCount(count, false);
    window.v2SyncGuestCount = () => setCount(count, false);
  }

  function initAnimatedNavAndAutoScroll() {
    const sections = [
      ['hero', 'Home'], ['scratch-reveal-section', 'Date'],
      ['memories-section', 'Photos'], ['events-section', 'Events'],
      ['family-section', 'Family'], ['rsvp-section', 'RSVP']
    ];
    const main = $('#main-content');
    const nav = document.createElement('nav');
    nav.className = 'v2-animated-nav';
    nav.setAttribute('aria-label', 'Invitation sections');
    const links = document.createElement('div');
    links.className = 'v2-nav-links';
    const linkMap = new Map();
    for (const [id, label] of sections) {
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = label;
      link.addEventListener('click', event => {
        event.preventDefault();
        pauseAutoScroll();
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
      });
      links.append(link);
      linkMap.set(id, link);
    }
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'v2-nav-theme';
    theme.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg><span class="v2-theme-text">Theme</span>';
    theme.addEventListener('click', () => $('#theme-btn')?.click());
    links.append(theme);
    const compact = document.createElement('button');
    compact.type = 'button';
    compact.className = 'v2-nav-compact';
    compact.setAttribute('aria-label', 'Open section navigation');
    compact.setAttribute('aria-expanded', 'false');
    compact.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    compact.addEventListener('click', event => {
      event.stopPropagation();
      setMenuOpen(!nav.classList.contains('is-menu-open'));
    });
    nav.append(links, compact);

    const autoButton = document.createElement('button');
    autoButton.type = 'button';
    autoButton.className = 'v2-auto-scroll';
    autoButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v14m-6-6 6 6 6-6"/><path d="M5 21h14"/></svg><span class="v2-auto-state" aria-hidden="true"></span>';
    autoButton.addEventListener('click', () => {
      if (autoPlaying) pauseAutoScroll();
      else {
        const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        if (scrollY >= maxY - 2) {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, 0);
        }
        startAutoScroll();
      }
    });
    document.body.append(nav, autoButton);

    let collapsed = false;
    let lastScrollY = scrollY;
    let directionStartY = scrollY;
    let direction = 0;
    function setMenuOpen(open) {
      const next = open && collapsed;
      nav.classList.toggle('is-menu-open', next);
      compact.setAttribute('aria-expanded', String(next));
      compact.setAttribute('aria-label', next ? (window.invitationT?.('closeNav') || 'Close section navigation') : (window.invitationT?.('openNav') || 'Open section navigation'));
      if (next) pauseAutoScroll();
    }
    function setCollapsed(next) {
      if (collapsed === next) return;
      const before = nav.getBoundingClientRect();
      collapsed = next;
      setMenuOpen(false);
      nav.classList.toggle('is-collapsed', next);
      if (!reduceMotion.matches && typeof nav.animate === 'function') {
        const after = nav.getBoundingClientRect();
        nav.getAnimations().forEach(animation => animation.cancel());
        nav.animate([
          { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})`, opacity: .88 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 }
        ], { duration: 460, easing: 'cubic-bezier(.2,.85,.25,1)' });
      }
    }
    function syncThemeLabel() {
      const label = document.body.classList.contains('light-theme') ? (window.invitationT?.('themeDark') || 'Switch to dark theme') : (window.invitationT?.('themeLight') || 'Switch to light theme');
      theme.setAttribute('aria-label', label);
      theme.title = label;
    }
    $('#theme-btn')?.addEventListener('click', () => setTimeout(syncThemeLabel, 0));
    syncThemeLabel();
    window.v2SyncThemeLabel = syncThemeLabel;

    let ready = false;
    let autoPlaying = false;
    let frameId = 0;
    let lastFrame = 0;
    let position = scrollY;
    let openTimer = 0;
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    function syncAutoButton() {
      autoButton.classList.toggle('is-playing', autoPlaying);
      autoButton.setAttribute('aria-pressed', String(autoPlaying));
      autoButton.setAttribute('aria-label', autoPlaying ? (window.invitationT?.('pauseScroll') || 'Pause auto-scroll') : (window.invitationT?.('startScroll') || 'Start auto-scroll'));
      autoButton.title = autoButton.getAttribute('aria-label');
    }
    function tick(now) {
      if (!autoPlaying || !ready || document.hidden) { frameId = 0; return; }
      if (lastFrame) {
        const elapsed = Math.min(64, now - lastFrame);
        const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        position = Math.min(maxY, Math.max(position, scrollY) + elapsed * .042);
        window.scrollTo(0, position);
        if (position >= maxY - 1) { pauseAutoScroll(); return; }
      }
      lastFrame = now;
      frameId = requestAnimationFrame(tick);
    }
    function startAutoScroll() {
      if (!ready || autoPlaying) return;
      autoPlaying = true;
      position = scrollY;
      lastFrame = 0;
      document.documentElement.style.scrollBehavior = 'auto';
      syncAutoButton();
      if (!document.hidden) frameId = requestAnimationFrame(tick);
    }
    function pauseAutoScroll() {
      clearTimeout(openTimer);
      if (!autoPlaying) return;
      autoPlaying = false;
      cancelAnimationFrame(frameId);
      frameId = 0;
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      syncAutoButton();
    }
    function syncOpen() {
      const isOpen = !!main?.classList.contains('visible');
      document.body.classList.toggle('v2-nav-ready', isOpen);
      if (isOpen && !ready) {
        ready = true;
        syncOnScroll();
        if (!reduceMotion.matches) openTimer = setTimeout(startAutoScroll, 1600);
      }
    }
    if (main) new MutationObserver(syncOpen).observe(main, { attributes: true, attributeFilter: ['class'] });
    syncOpen();
    syncAutoButton();
    window.v2SyncAutoButton = syncAutoButton;

    function syncOnScroll() {
      if (!ready) return;
      const y = scrollY;
      const delta = y - lastScrollY;
      const nextDirection = delta > 1 ? 1 : delta < -1 ? -1 : 0;
      if (nextDirection && nextDirection !== direction) { direction = nextDirection; directionStartY = lastScrollY; }
      if (!collapsed && y > 150 && nextDirection === 1) setCollapsed(true);
      else if (collapsed && nextDirection === -1 && directionStartY - y > 80) setCollapsed(false);
      lastScrollY = y;
      let active = sections[0][0];
      for (const [id] of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top < innerHeight * .42) active = id;
      }
      for (const [id, link] of linkMap) {
        if (id === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    window.addEventListener('scroll', syncOnScroll, { passive: true });
    document.addEventListener('pointerdown', event => { if (!nav.contains(event.target)) setMenuOpen(false); });
    syncOnScroll();
    window.addEventListener('wheel', pauseAutoScroll, { passive: true });
    window.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    main?.addEventListener('pointerdown', event => {
      if (event.target.closest('a, button, input, select, textarea, canvas, [role="button"]')) pauseAutoScroll();
    }, { passive: true });
    main?.addEventListener('focusin', pauseAutoScroll);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-menu-open')) setMenuOpen(false);
      else if (event.key === 'Escape' && !collapsed) setCollapsed(true);
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) pauseAutoScroll();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; lastFrame = 0; }
      else if (autoPlaying && !frameId) frameId = requestAnimationFrame(tick);
    });
    reduceMotion.addEventListener?.('change', event => { if (event.matches) pauseAutoScroll(); });
  }

  function initGlassGallery() {
    const slider=$('#memories-slider'), rim=$('#memory-glass-rim'), nav=$('#memory-nav');
    const previous=$('#memory-prev'), nextButton=$('#memory-next');
    if(!slider||!nav)return;
    if(window.v2GalleryCleanup) window.v2GalleryCleanup();
    rim?.classList.remove('is-active');
    const slides=$$('.memory-slide',slider), images=slides.map(slide=>$('img',slide)).filter(Boolean);
    if(images.length<2){previous?.setAttribute('hidden','');nextButton?.setAttribute('hidden','');return;}
    previous?.removeAttribute('hidden');nextButton?.removeAttribute('hidden');
    let current=0, timer=0, finishTimer=0, running=false, visible=true;
    const duration=1600, delay=5000;
    nav.textContent='';
    images.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Show memory ${i+1}`);b.addEventListener('click',()=>transition(i));nav.append(b);});
    function setActive(i){slides.forEach((slide,n)=>{slide.classList.toggle('is-active',n===i);slide.classList.remove('is-entering');});$$('button',nav).forEach((b,n)=>b.classList.toggle('is-active',n===i));}
    function schedule(){clearTimeout(timer);if(!document.hidden&&visible)timer=setTimeout(()=>transition((current+1)%images.length),delay);}
    function transition(next){if(next===current||running)return;clearTimeout(timer);
      if(!images[next].complete||!images[next].naturalWidth){schedule();return;}
      running=true;
      if(reduceMotion.matches){current=next;setActive(current);running=false;schedule();return;}
      slides[next].classList.add('is-entering');
      rim?.classList.remove('is-active'); if(rim){void rim.offsetWidth;rim.classList.add('is-active');}
      finishTimer=setTimeout(()=>{current=next;setActive(current);rim?.classList.remove('is-active');running=false;schedule();},duration);
    }
    if(previous)previous.onclick=()=>transition((current-1+images.length)%images.length);
    if(nextButton)nextButton.onclick=()=>transition((current+1)%images.length);
    const observer='IntersectionObserver' in window?new IntersectionObserver(([entry])=>{visible=!!entry?.isIntersecting;if(visible)schedule();else clearTimeout(timer);},{threshold:.05}):null;
    observer?.observe(slider);
    const onVisibility=()=>{if(document.hidden)clearTimeout(timer);else schedule();};document.addEventListener('visibilitychange',onVisibility);
    setActive(0);schedule();
    window.v2GalleryCleanup=()=>{clearTimeout(timer);clearTimeout(finishTimer);observer?.disconnect();document.removeEventListener('visibilitychange',onVisibility);if(previous)previous.onclick=null;if(nextButton)nextButton.onclick=null;};
  }
  function initClouds(){
    const canvas=$('#hero-cloud-canvas'),hero=$('#hero');if(!canvas||!hero)return;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false});
    if(!gl){initCloudFallback(canvas,hero);return;}
    const vert=`attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}`;
    const frag=`precision mediump float;
      varying vec2 v_uv;uniform vec2 u_res;uniform float u_time;uniform vec3 u_cloud,u_skyTop,u_skyBottom;
      float hash(vec2 p){return fract(sin(dot(p,vec2(41.31,289.17)))*26737.367);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03+19.19;a*=.5;}return s;}
      float billow(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*(1.-abs(2.*noise(p)-1.));p=mat2(.8,.6,-.6,.8)*p*2.11+13.37;a*=.5;}return s;}
      float density(vec2 p,vec2 c,vec2 r,float seed,float t){vec2 q=p-c;float ry=q.y>0.?r.y:r.y*.42;float env=1.-length(vec2(q.x/r.x,q.y/ry));if(env<-.35)return 0.;vec2 dp=q*(2.4/r.x)+seed;dp+=.6*vec2(fbm(dp*1.4+t*.04),fbm(dp*1.4+7.7-t*.03));return env+(billow(dp*1.6)-.62)*.62;}
      vec3 shade(vec3 color,vec3 sky,vec2 p,vec2 c,vec2 r,float seed,float t,float dist){float d=density(p,c,r,seed,t);if(d<.02)return color;float up=density(p+vec2(0.,r.y*.55),c,r,seed,t);float occ=clamp((up-d)*1.1+d*.55,0.,1.);vec3 cloud=mix(u_cloud*1.04,mix(u_cloud*.6,sky,.38),occ*.85);float alpha=smoothstep(.02,.38,d);float rim=smoothstep(.02,.14,d)*(1.-smoothstep(.14,.4,d));cloud+=rim*.1;cloud=mix(cloud,sky,dist*.35);alpha*=mix(1.,.8,dist);return mix(color,cloud,alpha);}
      vec3 pass(vec3 color,vec3 sky,vec2 p,float aspect,float t,float speed,float phase,float y,vec2 r,float seed,float dist){float cx=mix(-r.x-.25,aspect+r.x+.25,fract(t*speed+phase));float cy=y+sin(t*.05+phase*6.2831)*.012;return shade(color,sky,p,vec2(cx,cy),r,seed,t,dist);}
      void main(){float aspect=u_res.x/u_res.y;vec2 p=vec2(v_uv.x*aspect,v_uv.y);float t=u_time;vec3 sky=mix(u_skyBottom,u_skyTop,v_uv.y);vec3 col=sky;
        col=mix(col,u_skyBottom*1.06,(1.-smoothstep(0.,.35,v_uv.y))*.5);
        vec2 sun=vec2(aspect*.78,.92);float sd=length(p-sun);col+=vec3(1.,.95,.82)*exp(-sd*sd*5.)*.28;
        float band=smoothstep(.55,.8,v_uv.y)*(1.-smoothstep(.9,1.,v_uv.y));if(band>.01){float streak=fbm(vec2(p.x*1.6-t*.006,p.y*12.));col=mix(col,u_cloud*.98,smoothstep(.52,.78,streak)*band*.35);}
        col=pass(col,sky,p,aspect,t,.006,.10,.84,vec2(.20,.10),43.7,1.);
        col=pass(col,sky,p,aspect,t,.008,.62,.73,vec2(.24,.12),71.3,.85);
        col=pass(col,sky,p,aspect,t,.011,.33,.60,vec2(.34,.16),17.3,.55);
        col=pass(col,sky,p,aspect,t,.013,.80,.47,vec2(.30,.15),29.9,.45);
        col=pass(col,sky,p,aspect,t,.016,.05,.35,vec2(.46,.20),91.1,.15);
        col=pass(col,sky,p,aspect,t,.020,.48,.20,vec2(.56,.24),57.2,0.);
        gl_FragColor=vec4(col,1.);
      }`;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.warn('Cloud shader compile failed',gl.getShaderInfoLog(shader));return null;}return shader;};
    const vs=compile(gl.VERTEX_SHADER,vert),fs=compile(gl.FRAGMENT_SHADER,frag);if(!vs||!fs)return;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const loc={res:gl.getUniformLocation(program,'u_res'),time:gl.getUniformLocation(program,'u_time'),cloud:gl.getUniformLocation(program,'u_cloud'),top:gl.getUniformLocation(program,'u_skyTop'),bottom:gl.getUniformLocation(program,'u_skyBottom')};
    let visible=true,last=0;
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,.85);canvas.width=Math.max(1,Math.round(canvas.clientWidth*dpr));canvas.height=Math.max(1,Math.round(canvas.clientHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(loc.res,canvas.width,canvas.height);};
    new ResizeObserver(resize).observe(canvas);resize();
    if('IntersectionObserver' in window)new IntersectionObserver(([e])=>visible=!!e?.isIntersecting).observe(hero);
    const rgb=(color)=>color.map(v=>v/255);
    function frame(now){requestAnimationFrame(frame);if(!visible||document.hidden||now-last<32)return;last=now;const light=document.body.classList.contains('light-theme');const top=rgb(light?[102,153,200]:[33,55,82]),bottom=rgb(light?[180,201,218]:[75,76,93]),cloud=rgb(light?[252,246,233]:[197,190,180]);
      gl.useProgram(program);gl.uniform1f(loc.time,reduceMotion.matches?0:now/1000*.8);gl.uniform3f(loc.cloud,...cloud);gl.uniform3f(loc.top,...top);gl.uniform3f(loc.bottom,...bottom);gl.drawArrays(gl.TRIANGLES,0,3);
    }requestAnimationFrame(frame);
  }
  function initCloudFallback(canvas,hero){const ctx=canvas.getContext('2d');if(!ctx)return;let width=0,height=0;
    const resize=()=>{width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=width;canvas.height=height;};new ResizeObserver(resize).observe(canvas);resize();
    function draw(now){requestAnimationFrame(draw);if(document.hidden)return;ctx.clearRect(0,0,width,height);for(let i=0;i<6;i++){const x=(((now*.000006+i*.27)%1.4)-.2)*width,y=(.16+(i%3)*.25)*height,r=width*(.18+(i%3)*.05);const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(245,239,227,.24)');gradient.addColorStop(1,'rgba(245,239,227,0)');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);}}requestAnimationFrame(draw);
  }

  initGlowingCopy();initLiquidGlass();initRsvpGlassAndGuestCounter();initAnimatedNavAndAutoScroll();initClouds();
  initGlassGallery();document.addEventListener('v2-gallery-ready',initGlassGallery);
})();
