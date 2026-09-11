

  const footerCopyLine = document.getElementById('footerCopyLine');
  const footerOfflineLine = document.getElementById('footerOfflineLine');
  function updateNetworkStatusUI(){
    const offline = !navigator.onLine;
    if (footerOfflineLine) footerOfflineLine.hidden = !offline;
    if (footerCopyLine) footerCopyLine.hidden = offline;
    document.body.classList.toggle('is-offline', offline);
  }

  const netConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  function updateConnectionTypeUI(){
    const dotEl = document.querySelector('.logo .dot');
    const connType = netConnection && netConnection.type;

    if (connType === 'cellular') {
      if (dotEl) dotEl.classList.add('conn-cellular');
      document.body.classList.add('conn-cellular');
    } else if (connType && connType !== 'none' && connType !== 'unknown') {
      if (dotEl) dotEl.classList.remove('conn-cellular');
      document.body.classList.remove('conn-cellular');
    }
  }
  if (netConnection && netConnection.addEventListener) {
    netConnection.addEventListener('change', updateConnectionTypeUI);
  }
  updateConnectionTypeUI();

  const OFFLINE_NOTE_HTML = '<span class="form-note-x" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="x-circle" cx="12" cy="12" r="10"/><path class="x-mark" d="M8 8L16 16M16 8L8 16"/></svg></span><span class="form-note-red">No internet connection</span> <span class="form-note-white">—</span> <span class="form-note-orange">please reconnect and try again,</span> <span class="form-note-white">or to be sure your message gets through, send it directly to</span> <a href="mailto:job@talebi.dev" class="form-note-offline-mail">job@talebi.dev</a><span class="form-note-white">.</span>';

  const ONLINE_TIP_HOLD_MS = 3000;
  const ONLINE_TIP_FADE_MS = 350;
  let onlineTipHoldTimer = null;
  let onlineTipFadeTimer = null;
  window.addEventListener('online', function(){
    updateNetworkStatusUI();
    updateConnectionTypeUI();
    clearTimeout(onlineTipHoldTimer);
    clearTimeout(onlineTipFadeTimer);
    document.body.classList.add('show-online-tip');
    document.body.classList.add('dot-hold');
    onlineTipHoldTimer = setTimeout(function(){
      document.body.classList.remove('show-online-tip');
      onlineTipFadeTimer = setTimeout(function(){
        document.body.classList.remove('dot-hold');
      }, ONLINE_TIP_FADE_MS);
    }, ONLINE_TIP_HOLD_MS);
    
    
    
    
    if (typeof reconcileFormNoteFreshness === 'function') reconcileFormNoteFreshness();
  });
  window.addEventListener('offline', function(){
    updateNetworkStatusUI();
    updateConnectionTypeUI();

    clearTimeout(onlineTipHoldTimer);
    clearTimeout(onlineTipFadeTimer);
    document.body.classList.remove('show-online-tip');
    document.body.classList.remove('dot-hold');

    if (sendAbortController) {
      if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
      sendAbortController.abort();
      sendAbortController = null;
      handleSendFailure(OFFLINE_NOTE_HTML, !!currentSendHasFile, { isOffline: true });
    }
  });
  updateNetworkStatusUI();

  (function(){
    const themeBtn = document.getElementById('themeBtn');
    if (!themeBtn) return;
    const THEME_KEY = 'site_theme';
    function autoThemeByClock(){
      const hour = new Date().getHours();
      return (hour >= 6 && hour < 19) ? 'light' : 'dark';
    }
    function applyTheme(theme){
      const isLight = theme === 'light';
      document.body.classList.toggle('light-theme', isLight);
      document.documentElement.classList.toggle('light-theme', isLight);
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#eef1f6' : '#0a0b0a');

      document.dispatchEvent(new CustomEvent('themechange', { detail: { isLight } }));

      themeBtn.setAttribute('data-tooltip', isLight ? 'Dark theme' : 'Light theme');
    }
    let savedTheme = null;
    try{ savedTheme = localStorage.getItem(THEME_KEY); }catch(e){}
    applyTheme(savedTheme || autoThemeByClock());
    themeBtn.addEventListener('click', ()=>{
      const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
      applyTheme(next);
      try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    });
  })();

  (function(){
    const wrap = document.querySelector('.devops-infinity');
    if (!wrap) return;
    if (!window.matchMedia('(max-width:640px)').matches) return;
    const animatedEls = wrap.querySelectorAll('.devops-infinity-path, .devops-infinity-comet');
    function restart(){

      animatedEls.forEach(el=>{ el.style.animation = 'none'; });
      void wrap.offsetWidth;
      animatedEls.forEach(el=>{ el.style.animation = ''; });
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          restart();
          wrap.classList.add('in-view');
        } else {
          wrap.classList.remove('in-view');
        }
      });
    }, { threshold: 0.4 });
    io.observe(wrap);
  })();

  (function(){
    const logoLink = document.querySelector('.logo');
    if(!logoLink) return;
    const mobileQuery = window.matchMedia('(max-width:640px)');

    logoLink.addEventListener('click', (e)=>{
      if(!mobileQuery.matches) return;
      if(!e.target.closest('.logo-text')) return;
      if(!logoLink.classList.contains('logo-active')){
        e.preventDefault();
        logoLink.classList.add('logo-active');
      }
    });

    document.addEventListener('click', (e)=>{
      if(!mobileQuery.matches) return;
      if(logoLink.contains(e.target)) return;
      logoLink.classList.remove('logo-active');
    });
  })();

  document.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q').addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i=> i.classList.remove('open'));
      if(!isOpen) item.classList.add('open');
    });
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburgerBtn.addEventListener('click', ()=>{
    const isOpen = mobileMenu.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', isOpen);
  });
  mobileMenu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=>{
      mobileMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  const siteNav = document.querySelector('nav');
  window.addEventListener('scroll', ()=>{
    siteNav.style.boxShadow = window.scrollY > 8 ? '0 8px 24px -16px rgba(0,0,0,0.6)' : 'none';
  }, { passive:true });

  const resumeBtn = document.getElementById('resumeBtn');
  const resumeMenu = document.getElementById('resumeMenu');
  resumeBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = resumeMenu.classList.toggle('open');
    resumeBtn.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', ()=>{
    resumeMenu.classList.remove('open');
    resumeBtn.setAttribute('aria-expanded', 'false');
  });

  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  langBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    langMenu.classList.toggle('open');
  });
  document.addEventListener('click', ()=> langMenu.classList.remove('open'));

  const i18n = (function(){
    const ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=nl&dt=t&q=';

    const SKIP_SELECTOR = 'script, style, noscript, svg, .notranslate, .chip, #copyYear, #langMenu, #roleText';
    const CACHE_KEY = 'site_translation_cache_nl_v1';
    let cache = {};
    try{ cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }catch(e){ cache = {}; }
    const saveCache = ()=>{ try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }catch(e){} };

    const hasLetters = (str)=> /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(str);
    const isSkipped = (el)=> !!(el && el.closest && el.closest(SKIP_SELECTOR));

    function collectTextNodes(){
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          const text = node.nodeValue;
          if(!text || !text.trim() || !hasLetters(text)) return NodeFilter.FILTER_REJECT;
          if(isSkipped(node.parentElement)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      let n;
      while(n = walker.nextNode()) nodes.push(n);
      return nodes;
    }

    function collectAttrEls(){
      const attrs = ['placeholder','aria-label','data-tooltip','title'];
      const found = [];
      document.querySelectorAll('body *').forEach(el=>{
        if(isSkipped(el)) return;
        attrs.forEach(attr=>{
          const v = el.getAttribute(attr);
          if(v && hasLetters(v)) found.push({ el, attr });
        });
      });
      return found;
    }

    const pending = {};

    async function fetchTranslation(key){
      if(cache[key]) return cache[key];
      if(pending[key]) return pending[key];
      const req = (async ()=>{
        const res = await fetch(ENDPOINT + encodeURIComponent(key));
        if(!res.ok) throw new Error('Translation request failed');
        const data = await res.json();
        const translated = data[0].map(part => part[0]).join('');
        cache[key] = translated;
        return translated;
      })();
      pending[key] = req;
      try{ return await req; }
      finally{ delete pending[key]; }
    }

    async function translateOne(text){
      const key = text.trim();
      if(!key) return text;
      return fetchTranslation(key);
    }

    async function runQueue(items, worker, limit){
      let idx = 0;
      async function pull(){
        const i = idx++;
        if(i >= items.length) return;
        await worker(items[i]);
        await pull();
      }
      await Promise.all(Array.from({ length: Math.min(limit, items.length) }, pull));
    }

    async function ensureCached(jobs){
      await runQueue(jobs, async (job)=>{
        try{ await translateOne(job.original); }
        catch(err){ console.warn('Translation failed, leaving original text:', job.original, err); }
      }, 8);
      saveCache();
    }

    const originalText = new Map();
    const originalAttrs = [];
    const originalTitle = document.title;

    const extraStrings = [];
    function registerExtraString(text){
      if(text && extraStrings.indexOf(text) === -1) extraStrings.push(text);
    }

    function captureOriginals(){
      const textNodes = collectTextNodes();
      textNodes.forEach(n => { if(!originalText.has(n)) originalText.set(n, n.nodeValue); });

      const attrEls = collectAttrEls();
      attrEls.forEach(({ el, attr }) => {
        if(!originalAttrs.some(o => o.el === el && o.attr === attr)){
          originalAttrs.push({ el, attr, value: el.getAttribute(attr) });
        }
      });

      return {
        textNodes: textNodes.map(node => ({ type:'text', node, original: originalText.get(node) })),
        attrEls: originalAttrs.map(o => ({ type:'attr', el:o.el, attr:o.attr, original:o.value }))
      };
    }

    async function warmUp(){
      const { textNodes, attrEls } = captureOriginals();
      const jobs = [
        ...textNodes,
        ...attrEls,
        { original: originalTitle },
        ...extraStrings.map(s => ({ original: s }))
      ];
      await ensureCached(jobs);
    }

    async function prepareDutch(){
      const { textNodes, attrEls } = captureOriginals();
      const jobs = [...textNodes, ...attrEls];
      await ensureCached(jobs);
      return jobs;
    }

    function applyDutch(jobs){
      jobs.forEach(job => {
        const key = job.original.trim();
        if(!key) return;
        const translated = cache[key];
        if(translated === undefined) return;
        if(job.type === 'text'){
          const lead = job.original.match(/^\s*/)[0];
          const trail = job.original.match(/\s*$/)[0];
          job.node.nodeValue = lead + translated + trail;
        } else {
          job.el.setAttribute(job.attr, translated);
        }
      });
      const titleKey = originalTitle.trim();
      if(cache[titleKey]) document.title = cache[titleKey];
    }

    function toEnglish(){
      originalText.forEach((text, node) => { node.nodeValue = text; });
      originalAttrs.forEach(({ el, attr, value }) => el.setAttribute(attr, value));
      document.title = originalTitle;
    }

    return { prepareDutch, applyDutch, toEnglish, translateOne, warmUp, registerExtraString };
  })();

  let currentLang = localStorage.getItem('site_lang') === 'nl' ? 'nl' : 'en';

  let langSwitchToken = 0;

  async function setLanguage(lang, persist){
    const myToken = ++langSwitchToken;
    document.documentElement.classList.add('translating');
    try{
      if(lang === 'nl'){

        const jobs = await i18n.prepareDutch();
        if(myToken !== langSwitchToken) return;

        document.documentElement.lang = 'nl';
        i18n.applyDutch(jobs);
        if(typeof translateRoleWord === 'function') await translateRoleWord();
        if(myToken !== langSwitchToken) return;
      } else {
        document.documentElement.lang = 'en';
        i18n.toEnglish();
        if(typeof restoreRoleWord === 'function') restoreRoleWord();
      }
      currentLang = lang;
      if(persist) localStorage.setItem('site_lang', lang);
      langMenu.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.lang === lang));
    } finally {
      if(myToken === langSwitchToken) document.documentElement.classList.remove('translating');
    }
  }

  langMenu.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      langMenu.classList.remove('open');
      const lang = btn.dataset.lang;
      if(lang !== currentLang) setLanguage(lang, true);
    });
  });

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach(link=>{
      link.classList.toggle('active', link.dataset.section === id);
    });
  };

  const SPY_LINE = 140;
  const contactSection = document.getElementById('contact');
  function updateActiveSection(){
    if(contactSection && contactSection.getBoundingClientRect().top <= SPY_LINE){
      setActive(null);
      return;
    }
    let current = sections[0];
    for(const sec of sections){
      if(sec.getBoundingClientRect().top <= SPY_LINE){
        current = sec;
      } else {
        break;
      }
    }
    if(current) setActive(current.id);
  }
  window.addEventListener('scroll', updateActiveSection, { passive:true });
  window.addEventListener('resize', updateActiveSection);
  updateActiveSection();

  (function(){
    const blogGrid = document.getElementById('blogGrid');
    const wrap = document.getElementById('blogMoreWrap');
    if(!blogGrid || !wrap) return;

    const cards = Array.from(blogGrid.querySelectorAll('.blog-card'));
    const collapsedCount = 4;
    const pageSize = 12;

    if(cards.length <= collapsedCount){
      wrap.style.display = 'none';
      return;
    }

    const pageCount = Math.ceil(cards.length / pageSize);
    let expanded = false;
    let page = 0;

    function goTo(p){
      page = p;
      render();
      blogGrid.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    function render(){
      cards.forEach((card, i) => {
        const visible = expanded
          ? (i >= page * pageSize && i < (page + 1) * pageSize)
          : (i < collapsedCount);
        card.classList.toggle('blog-card-hidden', !visible);
      });

      wrap.innerHTML = '';

      if(!expanded){
        const showAllBtn = document.createElement('button');
        showAllBtn.type = 'button';
        showAllBtn.className = 'btn show-more-btn';
        showAllBtn.textContent = 'Show all articles';
        showAllBtn.addEventListener('click', () => { expanded = true; goTo(0); });
        wrap.appendChild(showAllBtn);
        return;
      }

      if(pageCount > 1){
        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'projects-dots blog-dots';
        for(let p = 0; p < pageCount; p++){
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'projects-dot' + (p === page ? ' active' : '');
          dot.setAttribute('aria-label', `Go to articles page ${p + 1}`);
          dot.addEventListener('click', () => goTo(p));
          dotsWrap.appendChild(dot);
        }
        wrap.appendChild(dotsWrap);
      }

      if(page === 0){
        const showLessBtn = document.createElement('button');
        showLessBtn.type = 'button';
        showLessBtn.className = 'btn show-more-btn';
        showLessBtn.textContent = 'Show less';
        showLessBtn.addEventListener('click', () => { expanded = false; goTo(0); });
        wrap.appendChild(showLessBtn);

        if(page < pageCount - 1){
          const nextPageBtn = document.createElement('button');
          nextPageBtn.type = 'button';
          nextPageBtn.className = 'blog-page-btn';
          nextPageBtn.textContent = 'Next page';
          nextPageBtn.addEventListener('click', () => goTo(page + 1));
          wrap.appendChild(nextPageBtn);
        }
        return;
      }

      const firstPageBtn = document.createElement('button');
      firstPageBtn.type = 'button';
      firstPageBtn.className = 'blog-page-btn';
      firstPageBtn.textContent = 'Back to first page';
      firstPageBtn.addEventListener('click', () => goTo(0));
      wrap.appendChild(firstPageBtn);

      if(page > 1){
        const prevPageBtn = document.createElement('button');
        prevPageBtn.type = 'button';
        prevPageBtn.className = 'blog-page-btn';
        prevPageBtn.textContent = 'Previous page';
        prevPageBtn.addEventListener('click', () => goTo(page - 1));
        wrap.appendChild(prevPageBtn);
      }

      if(page < pageCount - 1){
        const nextPageBtn = document.createElement('button');
        nextPageBtn.type = 'button';
        nextPageBtn.className = 'blog-page-btn';
        nextPageBtn.textContent = 'Next page';
        nextPageBtn.addEventListener('click', () => goTo(page + 1));
        wrap.appendChild(nextPageBtn);
      }
    }

    render();
  })();

  (function(){
    const grid = document.querySelector('#projects .services-grid');
    if(!grid) return;
    const perPage = 3;
    const cards = Array.from(grid.querySelectorAll('.service-card'));
    if(cards.length <= perPage) return;

    const pageCount = Math.ceil(cards.length / perPage);
    cards.forEach((card, i) => { card.dataset.coursesPage = Math.floor(i / perPage); });

    const nav = document.createElement('div');
    nav.className = 'courses-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'courses-arrow courses-prev';
    prevBtn.setAttribute('aria-label', 'Previous projects');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>';

    const pagesWrap = document.createElement('div');
    pagesWrap.className = 'courses-pages';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'courses-arrow courses-next';
    nextBtn.setAttribute('aria-label', 'Next projects');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';

    nav.appendChild(prevBtn);
    nav.appendChild(pagesWrap);
    nav.appendChild(nextBtn);
    grid.insertAdjacentElement('afterend', nav);

    function visiblePageList(current, total){
      if(total <= 7) return Array.from({ length: total }, (_, i) => i);
      const list = new Set([0, total - 1, current]);
      if(current - 1 >= 0) list.add(current - 1);
      if(current + 1 <= total - 1) list.add(current + 1);
      const sorted = Array.from(list).sort((a, b) => a - b);
      const out = [];
      sorted.forEach((n, i) => {
        if(i > 0 && n - sorted[i - 1] > 1) out.push('…');
        out.push(n);
      });
      return out;
    }

    function lockHeight(){
      grid.style.minHeight = '0px';
      let max = 0;
      for(let p = 0; p < pageCount; p++){
        cards.forEach(card => {
          card.classList.toggle('course-page-hidden', Number(card.dataset.coursesPage) !== p);
        });
        const h = grid.getBoundingClientRect().height;
        if(h > max) max = h;
      }
      grid.style.minHeight = max + 'px';
      cards.forEach(card => {
        card.classList.toggle('course-page-hidden', Number(card.dataset.coursesPage) !== current);
      });
    }
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(lockHeight, 150);
    });

    let current = 0;
    function renderPageBtns(){
      pagesWrap.innerHTML = '';
      visiblePageList(current, pageCount).forEach(item => {
        if(item === '…'){
          const span = document.createElement('span');
          span.className = 'courses-page-ellipsis';
          span.textContent = '…';
          pagesWrap.appendChild(span);
          return;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'courses-page-btn' + (item === current ? ' active' : '');
        b.textContent = String(item + 1).padStart(2, '0');
        b.setAttribute('aria-label', `Go to projects page ${item + 1}`);
        b.addEventListener('click', () => goTo(item));
        pagesWrap.appendChild(b);
      });
    }
    function render(withAnim){
      cards.forEach(card => {
        const onPage = Number(card.dataset.coursesPage) === current;
        card.classList.toggle('course-page-hidden', !onPage);
        card.classList.remove('course-anim-in');
      });
      if(withAnim){
        cards
          .filter(c => Number(c.dataset.coursesPage) === current)
          .forEach((card, i) => {
            card.style.animationDelay = (i * 70) + 'ms';
            requestAnimationFrame(() => card.classList.add('course-anim-in'));
          });
      }
      renderPageBtns();
      prevBtn.classList.toggle('is-disabled', current === 0);
      nextBtn.classList.toggle('is-disabled', current === pageCount - 1);
    }
    function goTo(idx){
      const next = Math.max(0, Math.min(pageCount - 1, idx));
      if(next === current) return;
      current = next;
      render(true);
    }
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    render(false);
    lockHeight();
  })();

  document.querySelectorAll('.copy-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      const value = btn.getAttribute('data-copy-value');
      const feedback = btn.parentElement.parentElement.querySelector('.copy-feedback');

      function showFeedback(){
        if(!feedback) return;
        feedback.classList.add('show');
        clearTimeout(feedback._hideTimer);
        feedback._hideTimer = setTimeout(function(){
          feedback.classList.remove('show');
        }, 1600);
      }

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(value).then(showFeedback).catch(function(){
          fallbackCopy(value);
          showFeedback();
        });
      } else {
        fallbackCopy(value);
        showFeedback();
      }
    });
  });

  function fallbackCopy(text){
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try { document.execCommand('copy'); } catch(err){}
    document.body.removeChild(temp);
  }

  const phoneField = document.getElementById('phoneField');
  if (phoneField) {
    phoneField.addEventListener('input', function(){
      phoneField.value = phoneField.value.replace(/[^0-9+\-\s()]/g, '');
    });
  }
  const MAX_FILE_MB = 5;

  const ALLOWED_FILE_EXTENSIONS = ['jpg','jpeg','png','webp','pdf','doc','docx','txt'];
  const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg','image/png','image/webp'];
  const ALLOWED_FORMATS_LABEL = 'JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX or TXT';
  function allowedFormatsHtml(){
    return ALLOWED_FORMATS_LABEL.split(', ').join('<span class="form-note-punct">,</span> ');
  }
  const FORM_NOTE_X_ICON = '<span class="form-note-x" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="x-circle" cx="12" cy="12" r="10"/><path class="x-mark" d="M8 8L16 16M16 8L8 16"/></svg></span>';
  const attachmentField = document.getElementById('attachmentField');
  const fileField = document.getElementById('fileField');
  const fileLabelText = document.getElementById('fileLabelText');
  const fileRemoveBtn = document.getElementById('fileRemoveBtn');
  const fileNote = document.getElementById('fileNote');
  const defaultFileLabel = 'Attach a file — ' + ALLOWED_FORMATS_LABEL + ' (optional, max ' + MAX_FILE_MB + 'MB)';

  function formatFileSize(bytes){
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileExtension(filename){
    const parts = (filename || '').split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function isAllowedFile(file){
    if (!file) return false;
    if (file.type && ALLOWED_IMAGE_MIME_TYPES.indexOf(file.type) !== -1) return true;
    return ALLOWED_FILE_EXTENSIONS.indexOf(getFileExtension(file.name)) !== -1;
  }

  const uploadProgress = document.getElementById('uploadProgress');
  const uploadProgressName = document.getElementById('uploadProgressName');
  const uploadProgressPctNum = document.getElementById('uploadProgressPctNum');
  const uploadProgressFill = document.getElementById('uploadProgressFill');
  const uploadProgressSize = document.getElementById('uploadProgressSize');
  const uploadProgressSpeed = document.getElementById('uploadProgressSpeed');
  const uploadCancelBtn = document.getElementById('uploadCancelBtn');

  let uploadSpeedBps = 0;
  let uploadLastLoaded = 0;
  let uploadLastTime = 0;
  let uploadLastUiUpdate = 0;

  function setUploadProgressPct(pct){
    const clamped = Math.max(0, Math.min(100, pct));
    if (uploadProgressFill) uploadProgressFill.style.width = clamped + '%';
    if (uploadProgressPctNum) uploadProgressPctNum.textContent = Math.round(clamped);
  }

  function formatSpeed(bytesPerSec){
    if (!isFinite(bytesPerSec) || bytesPerSec <= 0) return '';
    if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
    if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(0) + ' KB/s';
    return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
  }

  function formatEta(seconds){
    if (!isFinite(seconds) || seconds <= 0) return '';
    if (seconds < 1) return 'less than 1s left';
    if (seconds < 60) return '~' + Math.ceil(seconds) + 's left';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return '~' + m + 'm ' + (s < 10 ? '0' : '') + s + 's left';
  }

  function setUploadMeta(sizeText, speedText){
    if (uploadProgressSize) uploadProgressSize.textContent = sizeText || '';
    if (uploadProgressSpeed) uploadProgressSpeed.textContent = speedText || '';
  }

  function resetUploadProgressInstant(){
    if (!uploadProgress) return;
    uploadProgress.classList.remove('show','done','error');
    uploadProgress.hidden = true;
    setUploadProgressPct(0);
    setUploadMeta('', '');
    uploadSpeedBps = 0;
    uploadLastLoaded = 0;
    uploadLastTime = 0;
    uploadLastUiUpdate = 0;
  }

  function startUploadProgress(file){
    if (!uploadProgress || !file) return;
    uploadProgress.classList.remove('done','error');
    uploadProgress.hidden = false;
    if (uploadProgressName) uploadProgressName.textContent = file.name;
    setUploadProgressPct(0);
    setUploadMeta(formatFileSize(0) + ' / ' + formatFileSize(file.size), 'Starting…');
    uploadSpeedBps = 0;
    uploadLastLoaded = 0;
    uploadLastTime = performance.now();
    uploadLastUiUpdate = 0;
    requestAnimationFrame(function(){ uploadProgress.classList.add('show'); });
  }

  function onUploadProgressEvent(evt){
    if (!uploadProgress || uploadProgress.hidden || !evt.lengthComputable) return;
    const now = performance.now();

    if (sendTimeoutId) {
      clearTimeout(sendTimeoutId);
      const elapsed = now - sendStartTime;
      const remaining = HARD_CAP_MS - elapsed;
      if (remaining <= 0) {
        if (sendAbortController) sendAbortController.abort();
      } else {
        const nextTimeout = Math.min(STALL_TIMEOUT_MS, remaining);
        sendTimeoutId = setTimeout(function(){ if (sendAbortController) sendAbortController.abort(); }, nextTimeout);
      }
    }

    if (now - uploadLastUiUpdate < 100 && evt.loaded < evt.total) return;
    uploadLastUiUpdate = now;

    const pct = (evt.loaded / evt.total) * 100;
    setUploadProgressPct(pct);

    const dt = (now - uploadLastTime) / 1000;
    const dBytes = evt.loaded - uploadLastLoaded;
    if (dt > 0.05 && dBytes >= 0) {
      const instantBps = dBytes / dt;
      uploadSpeedBps = uploadSpeedBps > 0
        ? (uploadSpeedBps * 0.7 + instantBps * 0.3)
        : instantBps;
      uploadLastLoaded = evt.loaded;
      uploadLastTime = now;
    }

    const sizeText = formatFileSize(evt.loaded) + ' / ' + formatFileSize(evt.total);
    let speedText = '';
    if (evt.loaded >= evt.total) {
      speedText = 'Finishing up…';
    } else if (uploadSpeedBps > 0) {
      const remainingBytes = evt.total - evt.loaded;
      const etaSeconds = remainingBytes / uploadSpeedBps;
      speedText = formatSpeed(uploadSpeedBps) + ' — ' + formatEta(etaSeconds);
    }
    setUploadMeta(sizeText, speedText);
  }

  function finishUploadProgress(){
    if (!uploadProgress || uploadProgress.hidden) return;
    setUploadProgressPct(100);
    uploadProgress.classList.add('done');
    setUploadMeta(uploadProgressSize ? uploadProgressSize.textContent : '', 'Sent');
    setTimeout(function(){
      uploadProgress.classList.remove('show');
      setTimeout(resetUploadProgressInstant, 250);
    }, 700);
  }

  function failUploadProgress(){
    if (!uploadProgress || uploadProgress.hidden) return;
    uploadProgress.classList.add('error');
    setUploadMeta(uploadProgressSize ? uploadProgressSize.textContent : '', 'Failed');
    setTimeout(function(){
      uploadProgress.classList.remove('show');
      setTimeout(resetUploadProgressInstant, 250);
    }, 1600);
  }

  let fileNoteClearTimer = null;
  function clearFileNoteTimer(){
    if (fileNoteClearTimer) {
      clearTimeout(fileNoteClearTimer);
      fileNoteClearTimer = null;
    }
  }

  function showFileNoteError(messageHtml){
    clearFileNoteTimer();
    fileNote.innerHTML = messageHtml;
    fileNote.classList.add('error','show');
    playErrorSound();
    fileNoteClearTimer = setTimeout(function(){
      fileNote.classList.remove('show');
      setTimeout(function(){ fileNote.textContent = ''; fileNote.classList.remove('error'); }, 250);
      fileNoteClearTimer = null;
    }, 5000);
  }

  function setFileFieldDisabled(disabled){
    if (fileField) fileField.classList.toggle('disabled', disabled);
  }

  const LOCKABLE_FIELD_IDS = ['nameField','emailField','phoneField','subjectField','messageField'];
  function setTextFieldsLocked(locked){
    LOCKABLE_FIELD_IDS.forEach(function(id){
      const field = document.getElementById(id);
      if (!field) return;
      field.readOnly = locked;
      const wrapper = field.closest('.form-field');
      if (wrapper) wrapper.classList.toggle('locked', locked);
    });
  }

  document.addEventListener('themechange', function(){
    ['nameField','emailField','phoneField','subjectField'].forEach(function(id){
      const field = document.getElementById(id);
      if (!field) return;
      const prevDisplay = field.style.display;
      field.style.display = 'none';
      void field.offsetHeight;
      field.style.display = prevDisplay;
    });
  });

  function resetFileField(){
    clearFileNoteTimer();
    attachmentField.value = '';
    fileField.classList.remove('has-file');
    fileLabelText.textContent = defaultFileLabel;
    fileRemoveBtn.hidden = true;
    fileNote.textContent = '';
    fileNote.classList.remove('error','show');
    clearFileRemindReminder();
  }

  function clearFileFieldKeepNote(){
    attachmentField.value = '';
    fileField.classList.remove('has-file');
    fileLabelText.textContent = defaultFileLabel;
    fileRemoveBtn.hidden = true;
    resetUploadProgressInstant();
    clearFileRemindReminder();
  }

  let userTouchedFileField = false;

  if (attachmentField) {
    attachmentField.addEventListener('change', function(){
      userTouchedFileField = true;
      const file = attachmentField.files && attachmentField.files[0];
      resetUploadProgressInstant();

      clearFileRemindReminder();
      if (!file) { resetFileField(); return; }
      if (!isAllowedFile(file)) {
        showFileNoteError(FORM_NOTE_X_ICON + 'Unsupported file format <span class="form-note-dash2">—</span> <span class="form-note-fileinfo">allowed formats<span class="form-note-punct">:</span> ' + allowedFormatsHtml() + '.</span>');
        clearFileFieldKeepNote();
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        showFileNoteError(FORM_NOTE_X_ICON + 'File is too large <span class="form-note-dash2">—</span> <span class="form-note-fileinfo form-note-size">max ' + MAX_FILE_MB + 'MB</span><span class="form-note-white">.</span>');
        clearFileFieldKeepNote();
        return;
      }
      clearFileNoteTimer();
      fileNote.textContent = '';
      fileNote.classList.remove('error','show');
      fileField.classList.add('has-file');
      fileLabelText.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
      fileRemoveBtn.hidden = false;
    });
    fileRemoveBtn.addEventListener('click', function(){
      resetUploadProgressInstant();
      resetFileField();
    });
  }

  const messageField = document.getElementById('messageField');
  const charCount = document.getElementById('charCount');
  let updateCharCount = function(){};
  if (messageField && charCount) {
    const maxLen = parseInt(messageField.getAttribute('maxlength'), 10) || 1000;
    updateCharCount = function(){
      const remaining = maxLen - messageField.value.length;
      charCount.textContent = remaining;
      charCount.classList.toggle('near-limit', remaining <= 50);
    };
    messageField.addEventListener('input', updateCharCount);
    updateCharCount();
  }

  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const sendBtn = document.getElementById('sendBtn');

  let turnstileVerified = false;

  function clearAutoFormNoteIfOwned(){
    if (!formNote.dataset.autoNote) return;
    cancelStuckRefreshCountdown();
    delete formNote.dataset.autoNote;
    formNote.classList.remove('show','error','notice');
    setTimeout(function(){

      if (!formNote.classList.contains('show')) formNote.textContent = '';
    }, 250);
  }

  window.onTurnstileVerified = function(){
    turnstileVerified = true;
    turnstileRecoveryInFlight = false;
    if (turnstileWaitNoteTimer) { clearTimeout(turnstileWaitNoteTimer); turnstileWaitNoteTimer = null; }
    turnstileWaitNoteActive = false;
    turnstileInteractivePending = false;
    clearTimeout(turnstileInteractiveAutoTimer);
    clearAutoFormNoteIfOwned();
    handleTurnstileRecovered();
  };
  window.onTurnstileExpired = function(){ turnstileVerified = false; };

  let turnstileInteractivePending = false;
  let turnstileInteractiveAutoTimer = null;

  let turnstileClickNoteActive = false;
  let turnstileClickNoteTimer = null;
  const TURNSTILE_CLICK_VERIFY_MSG = 'Please tick the "Verify you are human" checkbox above to continue.';

  function turnstileWarnNoteHtml(text){
    const highlighted = text.replace('Verify you are human', '<span class="form-note-verify-human">Verify you are human</span>');
    return '<span class="form-note-warn" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="warn-tri" d="M12 3L21 19H3Z"/><line class="warn-line" x1="12" y1="8.5" x2="12" y2="13"/><circle class="warn-dot" cx="12" cy="16" r="1"/></svg></span><span class="form-note-verify-o">' + highlighted + '</span>';
  }

  function showTurnstileClickVerifyNote(fromClick){
    if (turnstileClickNoteActive) return;

    if (!fromClick && formNote.classList.contains('show') && !formNote.dataset.autoNote) return;
    turnstileClickNoteActive = true;
    cancelStuckRefreshCountdown();
    formNote.innerHTML = turnstileWarnNoteHtml(TURNSTILE_CLICK_VERIFY_MSG);
    formNote.classList.remove('ok','notice');
    formNote.classList.add('error','show');
    formNote.dataset.autoNote = 'clickverify';
    if (fromClick) { scrollToFormNote(); playErrorSound(); }
    clearTimeout(turnstileClickNoteTimer);
    turnstileClickNoteTimer = setTimeout(function(){
      turnstileClickNoteActive = false;

      if (formNote.dataset.autoNote === 'clickverify') clearAutoFormNoteIfOwned();
    }, cfToastReadingMs(TURNSTILE_CLICK_VERIFY_MSG));
  }

  window.onTurnstileBeforeInteractive = function(){
    turnstileInteractivePending = true;
    clearTimeout(turnstileInteractiveAutoTimer);

    turnstileInteractiveAutoTimer = setTimeout(function(){
      if (turnstileInteractivePending && !turnstileVerified) showTurnstileClickVerifyNote(false);
    }, 3000);
  };
  window.onTurnstileAfterInteractive = function(){
    turnstileInteractivePending = false;
    clearTimeout(turnstileInteractiveAutoTimer);
  };

  let turnstileWaitNoteActive = false;
  let turnstileWaitNoteTimer = null;

  let turnstileRecoveryInFlight = false;
  function renderFreshTurnstileWidget(){
    const widgetEl = document.getElementById('turnstileWidget');
    if (!widgetEl || typeof turnstile === 'undefined') return;
    try { turnstile.remove('#turnstileWidget'); } catch (e) {}
    widgetEl.innerHTML = '';
    try {
      turnstile.render(widgetEl, {
        sitekey: widgetEl.getAttribute('data-sitekey'),
        theme: 'dark',
        callback: onTurnstileVerified,
        'expired-callback': onTurnstileExpired,
        'error-callback': window.onTurnstileError,
        'before-interactive-callback': onTurnstileBeforeInteractive,
        'after-interactive-callback': onTurnstileAfterInteractive
      });
    } catch (e) { if (window.onTurnstileError) window.onTurnstileError(); }
  }

  function resetTurnstileForRetry(){
    turnstileVerified = false;
    clearTimeout(turnstileInteractiveAutoTimer);
    turnstileInteractivePending = false;
    if (typeof turnstile !== 'undefined') { try { turnstile.reset('#turnstileWidget'); } catch (e) {} }
  }

  let turnstileEverRendered = false;

  function isTurnstileWidgetMissing(){
    const widgetEl = document.getElementById('turnstileWidget');
    const hasContent = !!widgetEl && widgetEl.children.length > 0;
    if (hasContent) turnstileEverRendered = true;
    return !turnstileEverRendered && !hasContent;
  }

  [300, 1000, 2500].forEach(function(delay){
    setTimeout(isTurnstileWidgetMissing, delay);
  });

  function attemptTurnstileRecovery(){
    if (turnstileVerified) return;
    if (turnstileRecoveryInFlight) return;

    if (!turnstileErrored && !isTurnstileWidgetMissing()) return;

    if (typeof turnstile !== 'undefined') {

      turnstileRecoveryInFlight = true;
      renderFreshTurnstileWidget();

      setTimeout(function(){ turnstileRecoveryInFlight = false; }, 8000);
      return;
    }

    if (document.getElementById('turnstileScriptRetry')) return;
    turnstileRecoveryInFlight = true;
    const retryScript = document.createElement('script');
    retryScript.id = 'turnstileScriptRetry';
    retryScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    retryScript.async = true;
    retryScript.defer = true;
    retryScript.onload = function(){
      turnstileRecoveryInFlight = false;
      renderFreshTurnstileWidget();
    };
    retryScript.onerror = function(){
      turnstileRecoveryInFlight = false;
      if (window.onTurnstileError) window.onTurnstileError();
    };
    document.head.appendChild(retryScript);
  }

  window.addEventListener('online', attemptTurnstileRecovery);

  const TURNSTILE_RETRY_INTERVAL_MS = 20000;

  const TURNSTILE_STUCK_MS = 60000;
  let turnstileStuckSince = null;
  let turnstileStuckNoteShown = false;

  let stuckRefreshInterval = null;
  let stuckRefreshSecondsLeft = 0;

  function cancelStuckRefreshCountdown(){
    if (stuckRefreshInterval) {
      clearInterval(stuckRefreshInterval);
      stuckRefreshInterval = null;

      if (!turnstileVerified) {
        turnstileStuckSince = Date.now();
        turnstileStuckNoteShown = false;
      }
    }
  }

  function stuckNoteHtml(secondsLeft){
    return '<span class="form-note-warn" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="warn-tri" d="M12 3L21 19H3Z"/><line class="warn-line" x1="12" y1="8.5" x2="12" y2="13"/><circle class="warn-dot" cx="12" cy="16" r="1"/></svg></span><span class="form-note-stuck-white">Cloudflare verification is taking a moment</span><span class="form-note-stuck-dash"> — </span><span class="form-note-verify-o">refreshing in ' + secondsLeft + 's<span class="sending-dots" aria-hidden="true"><span></span><span></span><span></span></span></span>';
  }

  function showTurnstileStuckFormNote(){

    if (formNote.classList.contains('show') && !formNote.dataset.autoNote) return;
    cancelStuckRefreshCountdown();
    stuckRefreshSecondsLeft = 9;
    formNote.innerHTML = stuckNoteHtml(stuckRefreshSecondsLeft);
    formNote.classList.remove('ok','notice');
    formNote.classList.add('error','show');
    formNote.dataset.autoNote = 'stuck';

    stuckRefreshInterval = setInterval(function(){

      if (!contactFormInView) {
        cancelStuckRefreshCountdown();
        clearAutoFormNoteIfOwned();
        return;
      }
      stuckRefreshSecondsLeft -= 1;
      if (stuckRefreshSecondsLeft <= 0) {
        cancelStuckRefreshCountdown();
        saveDraftForRetry(true);

        const fileToCarry = attachmentField && attachmentField.files && attachmentField.files[0];
        const reloadNow = function(){ location.reload(); };
        if (fileToCarry) {
          Promise.race([
            storeDraftFile(fileToCarry),
            new Promise(function(resolve){ setTimeout(resolve, 1200); })
          ]).catch(function(){}).then(reloadNow);
        } else {
          clearDraftFile().catch(function(){}).then(reloadNow);
        }
        return;
      }

      if (formNote.dataset.autoNote === 'stuck') formNote.innerHTML = stuckNoteHtml(stuckRefreshSecondsLeft);
    }, 1000);
  }

  function checkTurnstileStuck(){
    if (turnstileVerified) {
      turnstileStuckSince = null;
      turnstileStuckNoteShown = false;
      return;
    }

    if (!isVisitorAtForm()) { turnstileStuckSince = null; return; }
    if (turnstileStuckSince === null) { turnstileStuckSince = Date.now(); return; }
    if (!turnstileStuckNoteShown && (Date.now() - turnstileStuckSince) >= TURNSTILE_STUCK_MS) {
      turnstileStuckNoteShown = true;
      showTurnstileStuckFormNote();
    }
  }

  setInterval(function(){
    attemptTurnstileRecovery();
    checkTurnstileStuck();
  }, TURNSTILE_RETRY_INTERVAL_MS);

  const cfToastEl = document.getElementById('cfToast');
  let cfToastClearTimer = null;

  function cfToastReadingMs(text){
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const readingMs = (words / 180) * 60000;
    return Math.max(6000, Math.min(16000, readingMs + 1800));
  }

  const CF_TOAST_TICK_MS = 250;
  let cfToastTicker = null;
  let cfToastElapsedMs = 0;

  function stopCfToastTicker(){
    if (cfToastTicker) { clearInterval(cfToastTicker); cfToastTicker = null; }
    cfToastElapsedMs = 0;
  }

  function startCfToastTicker(displayMs, onComplete){
    stopCfToastTicker();
    cfToastTicker = setInterval(function(){
      const tabVisible = (typeof document.hidden === 'undefined') || !document.hidden;
      if (!tabVisible) return;
      cfToastElapsedMs += CF_TOAST_TICK_MS;
      if (cfToastElapsedMs >= displayMs) {
        stopCfToastTicker();
        onComplete();
      }
    }, CF_TOAST_TICK_MS);
  }

  let cfErrorShowCount = 0;

  let cfErrorToastVisible = false;

  function cfEscapeHtml(text){
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cfCardHtml(status, badgeText, bodyHtml){
    return (
      '<div class="cf-toast-card ' + status + '">' +
        '<div class="cf-toast-head">' +
          '<span class="cf-toast-dots"><i></i><i></i><i></i></span>' +
          '<span class="cf-toast-title">Cloudflare check</span>' +
          '<span class="cf-toast-badge"><span class="cf-toast-badge-dot"></span>' + badgeText + '</span>' +
        '</div>' +
        '<div class="cf-toast-body">' + bodyHtml + '</div>' +
      '</div>'
    );
  }

  function buildCfErrorMessageHtml(message, showCount){
    let escaped = cfEscapeHtml(message);
    if (showCount >= 2) {
      escaped = escaped
        .replace('internet', '<span class="cf-toast-underline">internet</span>')
        .replace('OFF', '<strong class="cf-toast-blink cf-toast-blink-off">OFF</strong>')
        .replace('ON', '<strong class="cf-toast-blink cf-toast-blink-on">ON</strong>')
        .replace('Refresh', '<span class="cf-toast-wavy">Refresh</span>');
    }

    escaped = escaped.replace(/\n/g, '<br>');
    return cfCardHtml('error', 'Needs a retry', escaped);
  }

  function showCloudflareErrorToast(message){
    if (!cfToastEl) return;
    stopCfToastTicker();
    if (cfToastClearTimer) { clearTimeout(cfToastClearTimer); cfToastClearTimer = null; }
    const alreadyOnScreen = cfErrorToastVisible;
    cfErrorShowCount++;
    cfToastEl.classList.remove('success');
    cfToastEl.innerHTML = buildCfErrorMessageHtml(message, cfErrorShowCount);

    void cfToastEl.offsetWidth;
    cfToastEl.classList.add('show');
    cfErrorToastVisible = true;

    if (!alreadyOnScreen) playCfErrorSound();
    const displayMs = cfToastReadingMs(message);
    startCfToastTicker(displayMs, function(){
      cfToastEl.classList.remove('show');
      cfErrorToastVisible = false;
      cfToastClearTimer = setTimeout(function(){ cfToastEl.innerHTML = ''; cfToastClearTimer = null; }, 550);
    });
  }

  function wrapCfToastArrows(escapedText){
    return escapedText
      .replace(/\u2192/g, '<span class="cf-toast-arrow">\u2192</span>')
      .replace(/\u2190/g, '<span class="cf-toast-arrow">\u2190</span>');
  }

  function showCloudflareSuccessToast(message){
    if (!cfToastEl) return;
    stopCfToastTicker();
    if (cfToastClearTimer) { clearTimeout(cfToastClearTimer); cfToastClearTimer = null; }
    cfErrorToastVisible = false;
    cfToastEl.innerHTML = cfCardHtml('success', 'Verified', wrapCfToastArrows(cfEscapeHtml(message)).replace(/\n/g, '<br>'));
    void cfToastEl.offsetWidth;
    cfToastEl.classList.add('show', 'success');
    const displayMs = cfToastReadingMs(message);
    startCfToastTicker(displayMs, function(){
      cfToastEl.classList.remove('show');
      cfToastClearTimer = setTimeout(function(){
        cfToastEl.innerHTML = '';
        cfToastEl.classList.remove('success');
        cfToastClearTimer = null;
      }, 550);
    });
  }

  function hideCloudflareErrorToast(){
    if (!cfToastEl) return;
    stopCfToastTicker();
    if (cfToastClearTimer) { clearTimeout(cfToastClearTimer); cfToastClearTimer = null; }
    cfToastEl.classList.remove('show');
    cfErrorToastVisible = false;
    cfToastClearTimer = setTimeout(function(){ cfToastEl.innerHTML = ''; cfToastEl.classList.remove('success'); cfToastClearTimer = null; }, 550);
  }

  const CF_ERROR_MESSAGE = "Cloudflare verification stuck.\nPlease wait or toggle your internet OFF and ON or Refresh the page.";
  const CF_SUCCESS_MESSAGE = "\u2192 Cloudflare verified you successfully \u2190\nyou're all set to send your message.";

  let turnstileErrored = false;
  let cfErrorToastShown = false;
  let successPending = false;

  let pendingCfConfirmationAfterReload = false;
  let reachedContactForm = false;
  let contactFormInView = false;

  function isVisitorAtForm(){
    const tabVisible = (typeof document.hidden === 'undefined') || !document.hidden;
    return tabVisible && contactFormInView;
  }

  const STALE_AUTO_NOTE_TAGS = ['wait', 'stuck', 'clickverify'];

  function reconcileFormNoteFreshness(){
    if (!formNote) return;

    
    
    
    if (formNote.dataset.readTimer === 'offline' && navigator.onLine) {
      stopErrorNoteAutoHide();
      clearErrorNoteIfOwned('offline');
    }

    
    
    
    if (formNote.dataset.autoNote &&
        STALE_AUTO_NOTE_TAGS.indexOf(formNote.dataset.autoNote) !== -1 &&
        turnstileVerified) {
      clearAutoFormNoteIfOwned();
    }
  }

  function handleVisitorMaybeBack(){
    markContactFormReached();
    reconcileFormNoteFreshness();
    if (successPending && isVisitorAtForm()) {
      successPending = false;
      showCloudflareSuccessToast(CF_SUCCESS_MESSAGE);
    }
  }

  function markContactFormReached(){
    if (reachedContactForm) return;
    reachedContactForm = true;
    if (turnstileErrored) {
      showCloudflareErrorToast(CF_ERROR_MESSAGE);
      cfErrorToastShown = true;
    }
  }

  if (contactForm && typeof IntersectionObserver !== 'undefined') {
    const contactReachIO = new IntersectionObserver(function(entries){
      const entry = entries[entries.length - 1];
      contactFormInView = !!(entry && entry.isIntersecting);
      if (contactFormInView) handleVisitorMaybeBack();
    }, { threshold: 0.1 });
    contactReachIO.observe(contactForm);
  } else {

    reachedContactForm = true;
    contactFormInView = true;
  }

  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible') handleVisitorMaybeBack();
  });

  window.onTurnstileError = function(){
    turnstileVerified = false;
    turnstileErrored = true;
    turnstileRecoveryInFlight = false;
    turnstileEverRendered = false;
    successPending = false;
    if (reachedContactForm) {
      showCloudflareErrorToast(CF_ERROR_MESSAGE);
      cfErrorToastShown = true;
    }

  };

  function handleTurnstileRecovered(){
    const owesConfirmation = (turnstileErrored && cfErrorToastShown) || pendingCfConfirmationAfterReload;
    turnstileErrored = false;
    cfErrorToastShown = false;
    cfErrorShowCount = 0;
    pendingCfConfirmationAfterReload = false;
    if (!owesConfirmation) {
      hideCloudflareErrorToast();
      return;
    }

    playCfSuccessSound();
    if (isVisitorAtForm()) {
      showCloudflareSuccessToast(CF_SUCCESS_MESSAGE);
    } else {
      successPending = true;
      hideCloudflareErrorToast();
    }
  }

  
  
  
  
  
  
  window.addEventListener('beforeunload', function(){
    if (turnstileErrored || cfErrorToastVisible) {
      saveDraftForRetry();
    }
  });

  
  
  
  
  
  
  if (cfToastEl) {
    cfToastEl.addEventListener('click', function(e){
      const wavyRefresh = e.target.closest && e.target.closest('.cf-toast-wavy');
      if (!wavyRefresh) return;
      location.reload();
    });
  }

  let successClearTimer = null;

  const SUCCESS_NOTE_DISPLAY_MS = 18000;
  const SUCCESS_TICK_MS = 250;
  let successTicker = null;
  let successVisibleElapsed = 0;
  let successNoteIntersecting = false;
  let successIO = null;

  function ensureSuccessObserver(){
    if (successIO || !formNote || typeof IntersectionObserver === 'undefined') return;
    successIO = new IntersectionObserver(function(entries){
      const entry = entries[entries.length - 1];

      successNoteIntersecting = !!(entry && entry.isIntersecting && entry.intersectionRatio >= 0.6);
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
  }

  function stopSuccessAutoHide(){
    if (successTicker) { clearInterval(successTicker); successTicker = null; }
    if (successIO && formNote) { try { successIO.unobserve(formNote); } catch (e) {} }
    successNoteIntersecting = false;
    successVisibleElapsed = 0;
  }

  function startSuccessAutoHide(){
    ensureSuccessObserver();
    if (successIO) successIO.observe(formNote);
    successVisibleElapsed = 0;
    if (successTicker) clearInterval(successTicker);
    successTicker = setInterval(function(){
      const tabVisible = (typeof document.hidden === 'undefined') || !document.hidden;
      if (tabVisible && successNoteIntersecting) {
        successVisibleElapsed += SUCCESS_TICK_MS;
        if (successVisibleElapsed >= SUCCESS_NOTE_DISPLAY_MS) {
          stopSuccessAutoHide();
          clearSuccessNote();
        }
      }

    }, SUCCESS_TICK_MS);
  }

  const ERROR_NOTE_TICK_MS = 250;
  let errorNoteTicker = null;
  let errorNoteVisibleElapsed = 0;
  let errorNoteIntersecting = false;
  let errorNoteIO = null;

  function ensureErrorNoteObserver(){
    if (errorNoteIO || !formNote || typeof IntersectionObserver === 'undefined') return;
    errorNoteIO = new IntersectionObserver(function(entries){
      const entry = entries[entries.length - 1];
      errorNoteIntersecting = !!(entry && entry.isIntersecting && entry.intersectionRatio >= 0.6);
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
  }

  function stopErrorNoteAutoHide(){
    if (errorNoteTicker) { clearInterval(errorNoteTicker); errorNoteTicker = null; }
    if (errorNoteIO && formNote) { try { errorNoteIO.unobserve(formNote); } catch (e) {} }
    errorNoteIntersecting = false;
    errorNoteVisibleElapsed = 0;
  }

  function startErrorNoteAutoHide(displayMs, onComplete){
    ensureErrorNoteObserver();
    stopErrorNoteAutoHide();
    if (errorNoteIO) errorNoteIO.observe(formNote);
    errorNoteTicker = setInterval(function(){
      const tabVisible = (typeof document.hidden === 'undefined') || !document.hidden;
      if (tabVisible && errorNoteIntersecting) {
        errorNoteVisibleElapsed += ERROR_NOTE_TICK_MS;
        if (errorNoteVisibleElapsed >= displayMs) {
          stopErrorNoteAutoHide();
          onComplete();
        }
      }

    }, ERROR_NOTE_TICK_MS);
  }

  function stripHtmlForReading(html){
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function clearErrorNoteIfOwned(tag){
    if (formNote.dataset.readTimer !== tag) return;
    delete formNote.dataset.readTimer;
    formNote.classList.remove('show','error','notice','ok');
    setTimeout(function(){
      if (!formNote.classList.contains('show')) { formNote.textContent = ''; }
    }, 250);
  }

  if (sendBtn) {
    sendBtn.addEventListener('mousemove', function(e){
      const rect = sendBtn.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      sendBtn.style.setProperty('--mx', mx + '%');
      sendBtn.style.setProperty('--my', my + '%');
    });
    sendBtn.addEventListener('mouseleave', function(){
      sendBtn.style.setProperty('--mx', '50%');
      sendBtn.style.setProperty('--my', '50%');
    });
  }

  ['nameField','emailField','phoneField','subjectField'].forEach(function(id){
    const field = document.getElementById(id);
    if (!field) return;
    const wrapper = field.closest('.form-field');
    const clearBtn = wrapper.querySelector('.field-clear');
    function syncClearBtn(){
      wrapper.classList.toggle('has-value', field.value.length > 0);
    }
    field.addEventListener('input', syncClearBtn);
    field.addEventListener('keydown', function(e){
      if (e.key === 'Enter') {
        e.preventDefault();
        if (contactForm.requestSubmit) contactForm.requestSubmit(sendBtn);
        else sendBtn.click();
      }
    });
    clearBtn.addEventListener('click', function(){
      field.value = '';
      field.focus();
      syncClearBtn();
      field.dispatchEvent(new Event('input', { bubbles:true }));
    });
    syncClearBtn();
  });

  function clearSuccessNote(){
    if (successClearTimer) {
      clearTimeout(successClearTimer);
      successClearTimer = null;
    }
    stopSuccessAutoHide();
    if (formNote.classList.contains('ok')) {
      formNote.classList.remove('show','ok');
      setTimeout(function(){ formNote.textContent = ''; }, 250);
    }
  }

  ['name','email','phone','subject','message'].forEach(function(fieldName){
    const field = contactForm.elements[fieldName];
    if (field) field.addEventListener('input', clearSuccessNote);
  });
  if (attachmentField) attachmentField.addEventListener('change', clearSuccessNote);

  const WORKER_URL = 'https://contact-relay.talebi-dev.workers.dev';
  let sendAbortController = null;
  let sendTimeoutId = null;
  let currentSendHasFile = false;
  let sendStartTime = 0;

  const STALL_TIMEOUT_MS = 20000;
  const CONNECT_GRACE_MS = 20000;
  const NO_FILE_TIMEOUT_MS = 15000;
  const HARD_CAP_MS = 10 * 60 * 1000;

  let audioCtx = null;
  function getAudioCtx(){
    if (audioCtx) return audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function playTone(ctx, freq, startTime, duration, type, volume){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  function playSuccessSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    playTone(ctx, 587.33, t, 0.12, 'sine', 0.12);
    playTone(ctx, 739.99, t + 0.1, 0.12, 'sine', 0.12);
    playTone(ctx, 987.77, t + 0.2, 0.2, 'sine', 0.14);
  }

  function playErrorSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    playTone(ctx, 330, t, 0.1, 'sawtooth', 0.07);
    playTone(ctx, 196, t + 0.1, 0.22, 'sawtooth', 0.08);
  }

  function playNoticeSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    playTone(ctx, 523.25, t, 0.14, 'sine', 0.09);
    playTone(ctx, 659.25, t + 0.1, 0.16, 'sine', 0.09);
  }

  function playSendingSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    playTone(ctx, 494, t, 0.07, 'sine', 0.07);
  }

  function playCfSuccessSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    playTone(ctx, 660, t, 0.09, 'triangle', 0.1);
    playTone(ctx, 880, t + 0.1, 0.14, 'triangle', 0.11);
  }

  function playTurnstileWaitSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    playTone(ctx, 740, t, 0.05, 'square', 0.045);
    playTone(ctx, 740, t + 0.09, 0.05, 'square', 0.045);
  }

  function playCfErrorSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    playTone(ctx, 440, t, 0.13, 'sine', 0.35);
    playTone(ctx, 349.23, t + 0.11, 0.22, 'sine', 0.4);
  }

  function scrollToFormNote(){
    if (!formNote) return;
    formNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cancelActiveSend(){
    cancelStuckRefreshCountdown();
    stopErrorNoteAutoHide();
    delete formNote.dataset.readTimer;
    if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
    if (sendAbortController) {

      const controllerToAbort = sendAbortController;
      sendAbortController = null;
      controllerToAbort.abort();
    }

    resetUploadProgressInstant();
    if (currentSendHasFile) resetFileField();
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);
    clearDraft();
    clearDraftFile();

    formNote.classList.remove('ok','error','notice','show','sending');
    formNote.textContent = '';
    delete formNote.dataset.autoNote;
    sendBtn.disabled = false;

    resetTurnstileForRetry();
  }

  function handleSendSuccess(){
    cancelStuckRefreshCountdown();
    stopErrorNoteAutoHide();
    delete formNote.dataset.readTimer;
    formNote.innerHTML = '<span class="form-note-check" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="check-circle" cx="12" cy="12" r="10"/><path class="check-mark" d="M7 12.5l3 3 7-7"/></svg></span><span class="form-note-success">Message sent</span> <span class="form-note-white">—</span> <span class="form-note-blue">thanks! I\'ll get back to you soon.</span><span class="form-note-divider"></span><span class="form-note-white form-note-dim">Don\'t hear back in a couple of days?</span><br><span class="form-note-yellow">Please email</span> <a href="mailto:job@talebi.dev" class="form-note-mail-success">job@talebi.dev</a> <span class="form-note-yellow">directly just to be safe.</span>';
    formNote.classList.remove('error','notice','sending');
    formNote.classList.add('ok','show');
    delete formNote.dataset.autoNote;
    scrollToFormNote();
    playSuccessSound();
    contactForm.reset();
    contactForm.querySelectorAll('.form-field.clearable').forEach(function(wrapper){
      wrapper.classList.remove('has-value');
    });
    if (messageField) updateCharCount();
    finishUploadProgress();
    resetFileField();
    clearDraft();
    clearDraftFile();
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);
    sendBtn.disabled = false;

    resetTurnstileForRetry();
    if (successClearTimer) { clearTimeout(successClearTimer); successClearTimer = null; }
    startSuccessAutoHide();
  }

  const DRAFT_KEY = 'talebidev_contact_draft';

  const DRAFT_FILE_DB = 'talebidev_draft_file_db';
  const DRAFT_FILE_STORE = 'files';
  const DRAFT_FILE_KEY = 'pending';

  function openDraftFileDb(){
    return new Promise(function(resolve, reject){
      if (!window.indexedDB) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(DRAFT_FILE_DB, 1);
      req.onupgradeneeded = function(){ req.result.createObjectStore(DRAFT_FILE_STORE); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
  }

  function storeDraftFile(file){
    return openDraftFileDb().then(function(db){
      return new Promise(function(resolve, reject){
        const tx = db.transaction(DRAFT_FILE_STORE, 'readwrite');
        tx.objectStore(DRAFT_FILE_STORE).put({ name:file.name, type:file.type, data:file }, DRAFT_FILE_KEY);
        tx.oncomplete = function(){ db.close(); resolve(); };
        tx.onerror = function(){ db.close(); reject(tx.error); };
      });
    });
  }

  function loadDraftFile(){
    return openDraftFileDb().then(function(db){
      return new Promise(function(resolve, reject){
        const tx = db.transaction(DRAFT_FILE_STORE, 'readonly');
        const req = tx.objectStore(DRAFT_FILE_STORE).get(DRAFT_FILE_KEY);
        req.onsuccess = function(){ resolve(req.result || null); };
        req.onerror = function(){ reject(req.error); };
        tx.oncomplete = function(){ db.close(); };
      });
    });
  }

  function clearDraftFile(){
    return openDraftFileDb().then(function(db){
      return new Promise(function(resolve){
        const tx = db.transaction(DRAFT_FILE_STORE, 'readwrite');
        tx.objectStore(DRAFT_FILE_STORE).delete(DRAFT_FILE_KEY);
        tx.oncomplete = function(){ db.close(); resolve(); };
        tx.onerror = function(){ db.close(); resolve(); };
      });
    }).catch(function(){});
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  function saveDraftForRetry(isAutoRefresh){
    try {
      const draft = {};
      ['name','email','phone','subject','message'].forEach(function(fieldName){
        const field = contactForm.elements[fieldName];
        if (field && field.value) draft[fieldName] = field.value;
      });
      const file = attachmentField && attachmentField.files && attachmentField.files[0];
      if (file) {
        draft.fileName = file.name;
        draft.fileSize = file.size;
      }
      if (isAutoRefresh) draft.autoRefresh = true;
      if (Object.keys(draft).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {   }
  }

  function clearDraft(){
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  let fileRestoredFromAutoRefresh = false;

  function hardClearStaleFileValue(){
    if (userTouchedFileField || fileRestoredFromAutoRefresh) return;
    if (attachmentField && attachmentField.value) attachmentField.value = '';
  }
  window.addEventListener('load', hardClearStaleFileValue);
  window.addEventListener('pageshow', hardClearStaleFileValue);
  setTimeout(hardClearStaleFileValue, 0);
  setTimeout(hardClearStaleFileValue, 300);
  setTimeout(hardClearStaleFileValue, 1000);

  function restoreDraftIfAny(){

    if (attachmentField) resetFileField();

    let draft = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) draft = JSON.parse(raw);
    } catch (e) { draft = null; }
    if (!draft) return;
    clearDraft();

    if (draft.autoRefresh) {
      pendingCfConfirmationAfterReload = true;

      cfErrorShowCount = 1;
    }
    ['name','email','phone','subject','message'].forEach(function(fieldName){
      const field = contactForm.elements[fieldName];
      if (field && draft[fieldName]) {
        field.value = draft[fieldName];
        field.dispatchEvent(new Event('input', { bubbles:true }));
      }
    });
    if (draft.fileName) {
      if (draft.autoRefresh) {

        if (fileField && fileLabelText) {
          fileLabelText.textContent = draft.fileName + (typeof draft.fileSize === 'number' ? ' (' + formatFileSize(draft.fileSize) + ')' : '');
          fileField.classList.add('has-file');
        }
        loadDraftFile().then(function(record){
          clearDraftFile();
          if (!record || !record.data || !attachmentField) return;
          const dt = new DataTransfer();
          dt.items.add(new File([record.data], record.name || draft.fileName, { type: record.type || record.data.type || '' }));
          attachmentField.files = dt.files;
          fileRestoredFromAutoRefresh = true;
          if (fileRemoveBtn) fileRemoveBtn.hidden = false;
        }).catch(function(){

          clearDraftFile();
        });
      } else {
        formNote.innerHTML = '<span class="form-note-warn" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="warn-tri" d="M12 3L21 19H3Z"/><line class="warn-line" x1="12" y1="8.5" x2="12" y2="13"/><circle class="warn-dot" cx="12" cy="16" r="1"/></svg></span>Your message text was restored after the connection issue <span class="form-note-white">—</span> please re-attach <span class="form-note-white">' + escapeHtml(draft.fileName) + '</span> and hit Send again.';
        formNote.classList.remove('ok','error','sending');
        formNote.classList.add('notice','show');
        formNote.dataset.autoNote = 'draft';
        playNoticeSound();

        const restoredNoteMs = cfToastReadingMs(
          'Your message text was restored after the connection issue — please re-attach ' + draft.fileName + ' and hit Send again.'
        ) + 2500;
        setTimeout(function(){
          const stillOurs = formNote.dataset.autoNote === 'draft';
          if (stillOurs) clearAutoFormNoteIfOwned();

          const fileStillMissing = !attachmentField || !attachmentField.files || !attachmentField.files[0];
          if (fileStillMissing) remindFileFieldAfterRestore();
        }, restoredNoteMs);
      }
    }
  }

  function remindFileFieldAfterRestore(){
    if (!fileField) return;
    fileField.classList.remove('file-remind-settled', 'file-remind');
    void fileField.offsetWidth;
    fileField.classList.add('file-remind');
  }

  function clearFileRemindReminder(){
    if (!fileField) return;
    fileField.classList.remove('file-remind', 'file-remind-settled');
  }

  if (fileField) {
    fileField.addEventListener('animationend', function(e){
      if (e.animationName !== 'fileRemindBlink') return;
      fileField.classList.remove('file-remind');
      fileField.classList.add('file-remind-settled');
    });
  }

  function handleSendFailure(message, fileStillAttached, opts){
    opts = opts || {};

    const tag = opts.isOffline ? 'offline' : 'sendfail';
    if (formNote.dataset.readTimer === tag && formNote.classList.contains('show')) return;
    cancelStuckRefreshCountdown();
    saveDraftForRetry();
    clearDraftFile();
    formNote.innerHTML = message;
    formNote.classList.remove('ok','notice','sending');
    formNote.classList.add('error','show');
    delete formNote.dataset.autoNote;
    scrollToFormNote();
    playErrorSound();
    failUploadProgress();
    sendBtn.disabled = false;
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);

    if (fileStillAttached) fileRemoveBtn.hidden = false;

    if (navigator.onLine) resetTurnstileForRetry();

    formNote.dataset.readTimer = tag;
    const readingMs = cfToastReadingMs(stripHtmlForReading(message));
    startErrorNoteAutoHide(readingMs, function(){ clearErrorNoteIfOwned(tag); });
  }

  contactForm.addEventListener('submit', function(e){
    e.preventDefault();

    cancelStuckRefreshCountdown();
    stopErrorNoteAutoHide();
    delete formNote.dataset.readTimer;

    if (!navigator.onLine) {
      handleSendFailure(OFFLINE_NOTE_HTML, !!(attachmentField && attachmentField.files && attachmentField.files[0]), { isOffline: true });
      return;
    }

    if (!turnstileVerified) {

      if (turnstileInteractivePending) {
        showTurnstileClickVerifyNote(true);
        return;
      }

      if (turnstileWaitNoteActive) return;
      turnstileWaitNoteActive = true;

      formNote.innerHTML = '<span class="form-note-warn" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="warn-tri" d="M12 3L21 19H3Z"/><line class="warn-line" x1="12" y1="8.5" x2="12" y2="13"/><circle class="warn-dot" cx="12" cy="16" r="1"/></svg></span><span class="form-note-verify-o">Please wait for <span class="form-note-green">Cloudflare verification to complete</span> before sending.</span>';
      formNote.classList.remove('ok','notice');
      formNote.classList.add('error','show');
      formNote.dataset.autoNote = 'wait';
      scrollToFormNote();
      playTurnstileWaitSound();

      attemptTurnstileRecovery();

      clearTimeout(turnstileWaitNoteTimer);
      turnstileWaitNoteTimer = setTimeout(function(){
        turnstileWaitNoteActive = false;

        if (formNote.dataset.autoNote === 'wait') clearAutoFormNoteIfOwned();
      }, cfToastReadingMs('Please wait for Cloudflare verification to complete before sending.'));
      return;
    }

    const fileToSend = attachmentField && attachmentField.files && attachmentField.files[0];
    if (fileToSend && !isAllowedFile(fileToSend)) {

      if (formNote.dataset.readTimer === 'unsupported' && formNote.classList.contains('show')) return;
      const unsupportedHtml = FORM_NOTE_X_ICON + 'Message not sent <span class="form-note-dash2">—</span> file format not supported. <span class="form-note-fileinfo">Allowed formats<span class="form-note-punct">:</span> ' + allowedFormatsHtml() + '.</span>';
      formNote.innerHTML = unsupportedHtml;
      formNote.classList.remove('ok','notice');
      formNote.classList.add('error','show');
      delete formNote.dataset.autoNote;
      scrollToFormNote();
      playErrorSound();
      formNote.dataset.readTimer = 'unsupported';
      startErrorNoteAutoHide(cfToastReadingMs(stripHtmlForReading(unsupportedHtml)), function(){ clearErrorNoteIfOwned('unsupported'); });
      return;
    }
    if (fileToSend && fileToSend.size > MAX_FILE_MB * 1024 * 1024) {

      if (formNote.dataset.readTimer === 'toolarge' && formNote.classList.contains('show')) return;
      const tooLargeHtml = FORM_NOTE_X_ICON + 'Message not sent <span class="form-note-dash2">—</span> file is too large <span class="form-note-fileinfo">(max ' + MAX_FILE_MB + 'MB)</span><span class="form-note-white">.</span>';
      formNote.innerHTML = tooLargeHtml;
      formNote.classList.remove('ok','notice');
      formNote.classList.add('error','show');
      delete formNote.dataset.autoNote;
      scrollToFormNote();
      playErrorSound();
      formNote.dataset.readTimer = 'toolarge';
      startErrorNoteAutoHide(cfToastReadingMs(stripHtmlForReading(tooLargeHtml)), function(){ clearErrorNoteIfOwned('toolarge'); });
      return;
    }

    if (!navigator.onLine) {
      handleSendFailure(OFFLINE_NOTE_HTML, !!fileToSend, { isOffline: true });
      return;
    }

    currentSendHasFile = !!fileToSend;
    sendBtn.disabled = true;
    setFileFieldDisabled(true);
    setTextFieldsLocked(true);
    formNote.innerHTML = '<span class="sending-wrap"><span class="sending-label">Sending</span><span class="sending-dots" aria-hidden="true"><span></span><span></span><span></span></span></span><button type="button" class="form-note-cancel" id="sendCancelBtn">Cancel</button>';
    formNote.classList.remove('ok','error','notice');
    formNote.classList.add('show','sending');
    delete formNote.dataset.autoNote;
    playSendingSound();
    if (fileToSend) {
      startUploadProgress(fileToSend);

      fileRemoveBtn.hidden = true;
    }

    if (sendTimeoutId) clearTimeout(sendTimeoutId);
    if (sendAbortController) sendAbortController.abort();

    const xhr = new XMLHttpRequest();
    sendAbortController = xhr;
    const thisXhr = xhr;

    sendStartTime = performance.now();
    sendTimeoutId = setTimeout(function(){ thisXhr.abort(); }, fileToSend ? CONNECT_GRACE_MS : NO_FILE_TIMEOUT_MS);

    const formData = new FormData(contactForm);

    if (fileToSend && xhr.upload) {
      xhr.upload.addEventListener('progress', onUploadProgressEvent);
    }

    xhr.addEventListener('load', function(){
      if (thisXhr !== sendAbortController) return;
      if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (ok && data && data.success) {
        handleSendSuccess();
      } else {
        const usingDefaultErrMsg = !(data && data.error);
        const errMsg = usingDefaultErrMsg
          ? 'Message not sent <span class="form-note-dash2">—</span> <span class="form-note-yellow">please try again.</span> <span class="form-note-white">If this keeps happening</span>'
          : data.error;
        handleSendFailure(FORM_NOTE_X_ICON + errMsg + (usingDefaultErrMsg ? ',' : ' If this keeps happening,') + ' <span class="form-note-white">please email it directly to</span> <a href="mailto:job@talebi.dev" class="form-note-mail">job@talebi.dev</a>.', !!fileToSend);
      }
    });

    xhr.addEventListener('error', function(){
      if (thisXhr !== sendAbortController) return;
      if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
      handleSendFailure(FORM_NOTE_X_ICON + 'Couldn\'t reach the server <span class="form-note-dash2">—</span> <span class="form-note-yellow">please check your internet connection and try again,</span> <span class="form-note-white">or to be sure your message gets through,</span> <span class="form-note-white">send it directly to</span> <a href="mailto:job@talebi.dev" class="form-note-mail">job@talebi.dev</a>.', !!fileToSend);
    });

    xhr.addEventListener('abort', function(){
      if (thisXhr !== sendAbortController) return;
      if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
      handleSendFailure(FORM_NOTE_X_ICON + '<span class="form-note-red">Sending is taking too long</span> <span class="form-note-white">—</span> <span class="form-note-red">your connection may be too weak right now.</span> <span class="form-note-yellow">Please try sending again or refresh the page.</span> <span class="form-note-white">Or skip the wait and email it directly to</span> <a href="mailto:job@talebi.dev" class="form-note-mail">job@talebi.dev</a><span class="form-note-white">.</span>', !!fileToSend);
    });

    xhr.open('POST', WORKER_URL, true);
    xhr.send(formData);
  });

  if (uploadCancelBtn) {
    uploadCancelBtn.addEventListener('click', cancelActiveSend);
  }

  formNote.addEventListener('click', function(e){
    if (e.target.closest('#sendCancelBtn')) cancelActiveSend();
  });

  restoreDraftIfAny();

  const scrollToggle = document.getElementById('scrollToggle');
  const scrollContactSection = document.getElementById('contact');
  function updateScrollToggle(){
    const atBottom = scrollContactSection
      ? scrollContactSection.getBoundingClientRect().top <= 140
      : (window.innerHeight + window.scrollY >= document.body.scrollHeight - 60);
    scrollToggle.classList.toggle('at-bottom', atBottom);
  }
  window.addEventListener('scroll', updateScrollToggle, { passive:true });
  window.addEventListener('resize', updateScrollToggle);
  updateScrollToggle();
  scrollToggle.addEventListener('click', ()=>{
    if(scrollToggle.classList.contains('at-bottom')){
      window.scrollTo({ top:0, behavior:'smooth' });
    } else if(scrollContactSection){
      scrollContactSection.scrollIntoView({ behavior:'smooth', block:'start' });
    } else {
      window.scrollTo({ top:document.body.scrollHeight, behavior:'smooth' });
    }
  });

  const dotRed = document.getElementById('dotRed');
  const dotYellow = document.getElementById('dotYellow');
  const dotGreen = document.getElementById('dotGreen');
  const terminalBox = document.getElementById('terminalBox');
  const terminalPre = document.getElementById('terminalPre');

  let terminalBusy = false;
  let cooldownActive = false;
  let terminalClosed = false;

  function delay(ms){ return new Promise(resolve=> setTimeout(resolve, ms)); }

  function typeInto(el, text, speed){
    return new Promise(resolve=>{
      let i = 0;
      el.textContent = '';
      const iv = setInterval(()=>{
        el.textContent = text.slice(0, i+1);
        i++;
        if(i >= text.length){
          clearInterval(iv);
          resolve();
        }
      }, speed);
    });
  }

  async function runTerminalSequence({ commandText, checklines, speed = 40, checkSpeed = speed, dotsDuration = 1800, lineGap = 420, lineClass = 'g', onFirstCheck = null }){
    terminalPre.innerHTML = '';

    const line1 = document.createElement('div');
    line1.className = 'term-line';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'g';
    promptSpan.textContent = '$';
    const cmdSpan = document.createElement('span');
    cmdSpan.className = 'w';
    line1.append(promptSpan, ' ', cmdSpan);
    terminalPre.appendChild(line1);

    await typeInto(cmdSpan, commandText, speed);

    const dotsSpan = document.createElement('span');
    dotsSpan.className = 'term-dots';
    dotsSpan.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    cmdSpan.appendChild(dotsSpan);

    await delay(dotsDuration);
    dotsSpan.querySelectorAll('span').forEach(s=> s.style.animation = 'none');

    for(let i = 0; i < checklines.length; i++){
      const text = checklines[i];
      await delay(lineGap);
      const lineEl = document.createElement('div');
      lineEl.className = 'term-line ' + lineClass;
      const checkSpan = document.createElement('span');
      checkSpan.className = 'term-check-pop';
      checkSpan.textContent = '✓';
      const textSpan = document.createElement('span');
      lineEl.append(checkSpan, ' ');
      lineEl.appendChild(textSpan);
      terminalPre.appendChild(lineEl);
      if(i === 0 && onFirstCheck) onFirstCheck();
      await typeInto(textSpan, text, checkSpeed);
    }
  }

  async function typeFullLine(text, cls, speed = 28, gapBefore = 450, onStart = null){
    if(gapBefore) await delay(gapBefore);
    const lineEl = document.createElement('div');
    lineEl.className = 'term-line' + (cls ? ' ' + cls : '');
    terminalPre.appendChild(lineEl);
    if(onStart) onStart();
    await typeInto(lineEl, text, speed);
    return lineEl;
  }

  async function typePromptLine(text, cls = 'w', speed = 26, gapBefore = 450){
    if(gapBefore) await delay(gapBefore);
    const lineEl = document.createElement('div');
    lineEl.className = 'term-line';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'g';
    promptSpan.textContent = '$';
    const body = document.createElement('span');
    body.className = cls;
    lineEl.append(promptSpan, ' ', body);
    terminalPre.appendChild(lineEl);
    await typeInto(body, text, speed);
    return lineEl;
  }

  async function typeCommentLine(segments, speed = 32, gapBefore = 450){
    if(gapBefore) await delay(gapBefore);
    const lineEl = document.createElement('div');
    lineEl.className = 'term-line';
    const hashSpan = document.createElement('span');
    hashSpan.className = 'term-comment';
    hashSpan.textContent = '#';
    lineEl.append(hashSpan, ' ');
    terminalPre.appendChild(lineEl);
    for(const seg of segments){
      const span = document.createElement('span');
      if(seg.className) span.className = seg.className;
      lineEl.appendChild(span);
      await typeInto(span, seg.text, speed);
    }
    return lineEl;
  }

  async function askYesNo(question, timeoutMs){
    const lineEl = document.createElement('div');
    lineEl.className = 'term-line w';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'g';
    promptSpan.textContent = '$';
    const qSpan = document.createElement('span');
    lineEl.append(promptSpan, ' ', qSpan);
    terminalPre.appendChild(lineEl);

    await typeInto(qSpan, question, 48);

    const isMobile = window.matchMedia('(max-width: 640px)').matches;

    return new Promise(resolve=>{
      const ansSpan = document.createElement('span');
      ansSpan.className = 'term-cursor';
      ansSpan.textContent = ' _';
      lineEl.appendChild(ansSpan);

      let settled = false;
      let timer = null;
      let mobileInput = null;

      function cleanup(){
        document.removeEventListener('keydown', keyHandler);
        if(timer) clearTimeout(timer);
        if(mobileInput){
          mobileInput.removeEventListener('input', mobileHandler);
          mobileInput.blur();
          mobileInput.remove();
        }
      }

      function finish(result, key){
        if(settled) return;
        settled = true;
        ansSpan.classList.remove('term-cursor');
        ansSpan.textContent = key ? (' ' + key) : '';
        cleanup();
        resolve(result);
      }

      function keyHandler(e){
        const k = e.key.toLowerCase();
        if(k === 'y' || k === 'n') finish(k === 'y', k);
      }
      document.addEventListener('keydown', keyHandler);

      function mobileHandler(){
        const k = mobileInput.value.toLowerCase().slice(-1);
        if(k === 'y' || k === 'n') finish(k === 'y', k);
        else mobileInput.value = '';
      }

      if(isMobile){
        mobileInput = document.createElement('input');
        mobileInput.type = 'text';
        mobileInput.inputMode = 'text';
        mobileInput.autocomplete = 'off';
        mobileInput.autocapitalize = 'off';
        mobileInput.spellcheck = false;
        mobileInput.maxLength = 1;
        mobileInput.placeholder = 'y / n';
        mobileInput.className = 'yn-mobile-input';
        mobileInput.setAttribute('aria-label', question);
        terminalBox.appendChild(mobileInput);
        mobileInput.addEventListener('input', mobileHandler);
        requestAnimationFrame(()=> mobileInput.focus());
      }

      if(timeoutMs) timer = setTimeout(()=> finish(null), timeoutMs);
    });
  }

  let firstAction = null;
  let yellowRun = false;
  let deployed = false;
  let successGlowToken = 0;

  function beginGlow(cls){
    const myToken = ++successGlowToken;
    cooldownActive = true;
    terminalBox.classList.remove('success');
    terminalBox.classList.remove('warn-glow');
    terminalBox.classList.add(cls);
    return myToken;
  }
  function endGlow(myToken, cls){
    if(myToken === successGlowToken){
      terminalBox.classList.remove(cls);
      cooldownActive = false;
    }
  }

  function setDotPulse(dot, on){
    if(!dot) return;
    dot.classList.toggle('guide-pulse', on);
  }

  function warnDot(dot){
    if(!dot) return;
    dot.classList.remove('dot-warn');
    void dot.offsetWidth;
    dot.classList.add('dot-warn');
    setTimeout(()=> dot.classList.remove('dot-warn'), 450);
  }

  function isLocked(){
    return terminalBusy || cooldownActive || terminalClosed || terminalBox.classList.contains('closing');
  }

  function startCooldown(){
    return new Promise(resolve=>{
      cooldownActive = true;
      setTimeout(()=>{
        cooldownActive = false;
        resolve();
      }, 5000);
    });
  }

  async function runResetSequence(){
    terminalPre.innerHTML = '';

    const line1 = document.createElement('div');
    line1.className = 'term-line';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'g';
    promptSpan.textContent = '$';
    const cmdSpan = document.createElement('span');
    cmdSpan.className = 'w';
    line1.append(promptSpan, ' ', cmdSpan);
    terminalPre.appendChild(line1);
    await typeInto(cmdSpan, './deploy.sh', 70);

    await delay(400);
    const line2 = document.createElement('div');
    line2.className = 'term-line';
    terminalPre.appendChild(line2);
    await typeInto(line2, 'docker build -t app:latest .', 32);

    await delay(400);
    const line3 = document.createElement('div');
    line3.className = 'term-line';
    terminalPre.appendChild(line3);
    await typeInto(line3, 'kubectl apply -f deploy.yaml', 32);

    await delay(700);
    const line4 = document.createElement('div');
    line4.className = 'term-line g';
    terminalPre.appendChild(line4);
    await typeInto(line4, '✓ Deployment ready', 48);
  }

  async function runGreenBlockedScreen(){
    terminalPre.innerHTML = '';
    await typePromptLine('./deploy.sh --env=production', 'w', 60, 0);
    let glowToken = null;
    await typeFullLine('⚠ Production target not confirmed yet', 'term-warn', 34, 900, ()=>{ glowToken = beginGlow('warn-glow'); });
    setDotPulse(dotYellow, true);
    await typeCommentLine([
      { text: 'Please click the ', className: 'w' },
      { text: 'yellow', className: 'term-yellow' },
      { text: ' button first to run the safety check', className: 'w' }
    ], 32, 500);
    endGlow(glowToken, 'warn-glow');
  }

  async function runYellowScreen(){
    terminalPre.innerHTML = '';
    await typePromptLine('./deploy.sh --env=production', 'w', 60, 0);
    let glowToken = null;
    await typeFullLine('⚠ Warning: Production target detected', 'term-warn', 34, 500, ()=>{ glowToken = beginGlow('warn-glow'); });

    await typeFullLine('✓ Dry-run completed successfully', 'g', 58, 500);
    setDotPulse(dotGreen, true);
    await typeCommentLine([
      { text: 'To continue the deployment, press the ', className: 'w' },
      { text: 'green', className: 'term-green' },
      { text: ' button', className: 'w' }
    ], 32, 500);
    endGlow(glowToken, 'warn-glow');
  }

  if(dotRed){
    dotRed.addEventListener('click', async ()=>{
      if(isLocked()){ warnDot(dotRed); return; }

      const pulseToRestore = (dotGreen && dotGreen.classList.contains('guide-pulse')) ? dotGreen
        : (dotYellow && dotYellow.classList.contains('guide-pulse')) ? dotYellow
        : null;
      setDotPulse(dotGreen, false);
      setDotPulse(dotYellow, false);
      dotRed.classList.add('dot-off');
      terminalBusy = true;
      terminalBox.classList.add('danger-glow');
      const snapshot = terminalPre.innerHTML;
      const answer = await askYesNo('Close this session? (y/n)', 7000);
      terminalBox.classList.remove('danger-glow');
      if(answer === null){

        terminalPre.innerHTML = snapshot;
        terminalBusy = false;
        dotRed.classList.remove('dot-off');
        if(pulseToRestore) setDotPulse(pulseToRestore, true);
        return;
      }
      if(!answer){
        terminalPre.innerHTML = snapshot;
        terminalBusy = false;
        dotRed.classList.remove('dot-off');
        if(pulseToRestore) setDotPulse(pulseToRestore, true);
        return;
      }
      await runTerminalSequence({
        commandText:'closing session',
        checklines:['Session terminated'],
        speed:56,
        lineClass:'g'
      });
      terminalBusy = false;
      setTimeout(()=>{
        terminalBox.classList.add('closing');
        setTimeout(()=>{
          terminalBox.style.display = 'none';
          terminalClosed = true;

          setTimeout(reopenTerminal, 5000);
        }, 650);
      }, 1500);
    });
  }

  if(dotGreen){
    dotGreen.addEventListener('click', async ()=>{
      if(isLocked()){ warnDot(dotGreen); return; }
      setDotPulse(dotGreen, false);
      setDotPulse(dotYellow, false);
      dotGreen.classList.add('dot-off');
      terminalBusy = true;
      successGlowToken++;
      terminalBox.classList.remove('success');
      terminalBox.classList.remove('warn-glow');
      if(firstAction === null) firstAction = 'green';

      if(!yellowRun){
        await runGreenBlockedScreen();
        terminalBusy = false;
        dotGreen.classList.remove('dot-off');
        return;
      }

      let glowToken = null;
      const onFirstCheck = ()=>{ glowToken = beginGlow('success'); };

      if(firstAction === 'green'){

        await runTerminalSequence({
          commandText:'Deploying to production',
          checklines:['Dry-run verified', 'Health checks passed', 'Zero-downtime rollout completed', 'Live and stable – nice work'],
          lineClass:'term-green',
          onFirstCheck
        });
      } else {

        await runTerminalSequence({
          commandText:'Deploying to production',
          checklines:['Health checks passed', 'Zero-downtime rollout', 'All pods healthy', 'Live and stable – nice work'],
          checkSpeed: 24,
          lineClass:'term-green',
          onFirstCheck
        });
      }
      deployed = true;
      terminalBusy = false;
      endGlow(glowToken, 'success');
      dotGreen.classList.remove('dot-off');
    });
  }

  if(dotYellow){
    dotYellow.addEventListener('click', async ()=>{
      if(isLocked()){ warnDot(dotYellow); return; }
      setDotPulse(dotGreen, false);
      setDotPulse(dotYellow, false);
      dotYellow.classList.add('dot-off');
      terminalBusy = true;
      successGlowToken++;
      terminalBox.classList.remove('success');
      terminalBox.classList.remove('warn-glow');
      if(firstAction === null) firstAction = 'yellow';

      await runYellowScreen();
      yellowRun = true;
      deployed = false;
      terminalBusy = false;
      dotYellow.classList.remove('dot-off');
    });
  }

  async function reopenTerminal(){
    firstAction = null;
    yellowRun = false;
    deployed = false;
    terminalClosed = false;
    terminalBox.classList.remove('closing');
    terminalBox.classList.remove('success');
    terminalBox.classList.remove('warn-glow');
    terminalBox.classList.remove('danger-glow');
    setDotPulse(dotGreen, false);
    setDotPulse(dotYellow, false);
    if(dotRed) dotRed.classList.remove('dot-off');
    if(dotYellow) dotYellow.classList.remove('dot-off');
    if(dotGreen) dotGreen.classList.remove('dot-off');
    terminalBox.style.display = '';
    terminalBusy = true;
    await runResetSequence();
    terminalBusy = false;
  }

  if(terminalPre){
    terminalBusy = true;
    runResetSequence().then(()=>{ terminalBusy = false; });
  }

  document.querySelectorAll('.exp-item').forEach(item=>{
    const dot = item.querySelector('.status-dot');
    const text = item.querySelector('.exp-text');
    if(!dot || !text) return;
    text.addEventListener('mouseenter', ()=>{
      if(!item.classList.contains('open')) dot.classList.add('blinking');
    });
    text.addEventListener('mouseleave', ()=>{
      dot.classList.remove('blinking');
    });
    text.addEventListener('click', ()=>{
      dot.classList.remove('blinking');
      const isOpen = item.classList.toggle('open');
      if(isOpen){
        dot.classList.remove('idle');
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
        dot.classList.add('idle');
      }
    });
  });

  (function(){
    const section = document.getElementById('courses');
    if(!section) return;
    const grid = section.querySelector('.courses-grid');
    if(!grid) return;
    const perPage = 3;
    const cards = Array.from(grid.children).filter(el => el.classList.contains('course-card'));
    if(cards.length <= perPage) return;

    const viewport = document.createElement('div');
    viewport.className = 'projects-viewport';
    const track = document.createElement('div');
    track.className = 'projects-track';

    const pages = [];
    for(let i=0; i<cards.length; i+=perPage){
      const page = document.createElement('div');
      page.className = 'courses-grid projects-page';
      cards.slice(i, i+perPage).forEach(card => page.appendChild(card));
      track.appendChild(page);
      pages.push(page);
    }
    viewport.appendChild(track);
    grid.replaceWith(viewport);

    const nav = document.createElement('div');
    nav.className = 'projects-nav';
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'projects-dots';
    const dots = pages.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'projects-dot';
      dot.setAttribute('aria-label', `Go to certificates page ${i + 1}`);
      dotsWrap.appendChild(dot);
      return dot;
    });
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'projects-next';
    nextBtn.setAttribute('aria-label', 'Show next certificates');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';

    nav.appendChild(dotsWrap);
    nav.appendChild(nextBtn);
    viewport.insertAdjacentElement('afterend', nav);

    let current = 0;
    let direction = 1;
    function goTo(idx){
      current = Math.max(0, Math.min(pages.length - 1, idx));
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));

      if(current === pages.length - 1) direction = -1;
      else if(current === 0) direction = 1;
      nextBtn.classList.toggle('reversed', direction === -1);
      nextBtn.setAttribute('aria-label', direction === 1 ? 'Show next certificates' : 'Show previous certificates');
    }
    dots.forEach((dot, i) => dot.addEventListener('click', () => { direction = i >= current ? 1 : -1; goTo(i); }));
    nextBtn.addEventListener('click', () => goTo(current + direction));
    goTo(0);
  })();

  (function(){
    const cards = document.querySelectorAll('#projects .service-card');
    if(!cards.length) return;
    const stepMs = 4000;
    let current = 0;
    cards[current].classList.add('proj-active');
    setInterval(()=>{
      cards[current].classList.remove('proj-active');
      current = (current + 1) % cards.length;
      cards[current].classList.add('proj-active');
    }, stepMs);
  })();

  const roleText = document.getElementById('roleText');
  const roleWordOriginal = 'DevOps Engineer';
  let roleWord = roleWordOriginal;
  if(roleText) roleText.textContent = roleWord;
  i18n.registerExtraString(roleWordOriginal);

  async function translateRoleWord(){
    try{ roleWord = await i18n.translateOne(roleWordOriginal); }catch(e){ roleWord = roleWordOriginal; }
    if(roleText) roleText.textContent = roleWord;
  }
  function restoreRoleWord(){
    roleWord = roleWordOriginal;
    if(roleText) roleText.textContent = roleWord;
  }

  (function(){
    const eyebrowText = document.getElementById('eyebrowText');
    const eyebrowCheck = document.getElementById('eyebrowCheck');
    const caretEl = document.querySelector('.intro-eyebrow .caret');
    if(!eyebrowText) return;
    const phrases = [
      { text: 'Hey, welcome' },
      { text: "Glad you're here." },
      { text: "Let's automate everything." },
      { text: 'Building better systems.', color: '#45e08c', lightColor: '#0f9d4a', final: true }
    ];
    const typeSpeed = 85;
    const eraseSpeed = 55;
    let phraseIndex = 0;
    let onFinalPhrase = false;

    document.addEventListener('themechange', (e)=>{
      if(!onFinalPhrase) return;
      const finalPhrase = phrases[phrases.length - 1];
      const isLight = e.detail.isLight;
      eyebrowText.style.color = (isLight && finalPhrase.lightColor) ? finalPhrase.lightColor : (finalPhrase.color || '');
    });

    function setCaretBlinking(isBlinking){
      if(caretEl) caretEl.classList.toggle('blinking', isBlinking);
    }

    function typePhrase(){
      const phrase = phrases[phraseIndex];

      function startTyping(){
        setCaretBlinking(false);
        if(phrase.final) onFinalPhrase = true;
        const isLight = document.body.classList.contains('light-theme');
        eyebrowText.style.color = (isLight && phrase.lightColor) ? phrase.lightColor : (phrase.color || '');
        let i = 0;
        const timer = setInterval(()=>{
          eyebrowText.textContent = phrase.text.slice(0, i+1);
          i++;
          if(i === phrase.text.length){
            clearInterval(timer);
            if(phrase.final){
              setCaretBlinking(true);
              if(caretEl){

                setTimeout(()=>{ caretEl.style.display = 'none'; }, 5 * 1100);
              }
              return;
            }
            setCaretBlinking(true);
            const holdTime = Math.max(1300, phrase.text.length * 130);
            setTimeout(erasePhrase, holdTime);
          }
        }, typeSpeed);
      }

      if(phrase.final && eyebrowCheck){

        eyebrowCheck.classList.add('show');
        if(caretEl) caretEl.classList.add('final-caret');
        setTimeout(startTyping, 600);
      } else {
        startTyping();
      }
    }

    function erasePhrase(){
      setCaretBlinking(false);
      const phrase = phrases[phraseIndex];
      let i = phrase.text.length;
      const timer = setInterval(()=>{
        eyebrowText.textContent = phrase.text.slice(0, i-1);
        i--;
        if(i === 0){
          clearInterval(timer);
          phraseIndex++;
          setTimeout(typePhrase, 350);
        }
      }, eraseSpeed);
    }

    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if(isMobile && 'IntersectionObserver' in window){
      const eyebrowEl = document.querySelector('.intro-eyebrow');
      const observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            typePhrase();
            observer.disconnect();
          }
        });
      }, { threshold: 0.4 });
      observer.observe(eyebrowEl);
    } else {
      typePhrase();
    }
  })();

  const discordItem = document.querySelector('.discord-item');
  if(discordItem){
    const discordDefaultTooltip = discordItem.getAttribute('data-tooltip');
    let discordCopyTimer = null;
    const copyDiscordUsername = ()=>{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText('TalebiDev').catch(()=>{});
      }
      clearTimeout(discordCopyTimer);
      discordItem.setAttribute('data-tooltip', 'Username Copied..!');
      discordItem.classList.add('discord-clicked');
      discordCopyTimer = setTimeout(()=>{
        discordItem.setAttribute('data-tooltip', discordDefaultTooltip);
        discordItem.classList.remove('discord-clicked');
      }, 2000);
    };
    discordItem.addEventListener('click', (e)=>{
      e.preventDefault();
      copyDiscordUsername();
    });
    discordItem.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        copyDiscordUsername();
      }
    });
  }

  const copyYear = document.getElementById('copyYear');
  if(copyYear) copyYear.textContent = new Date().getFullYear();

  const avatarImg = document.querySelector('.avatar img');
  if(avatarImg){
    avatarImg.addEventListener('contextmenu', e=> e.preventDefault());
    avatarImg.addEventListener('dragstart', e=> e.preventDefault());
  }

  if(currentLang === 'nl'){
    setLanguage('nl', false);
  } else {

    i18n.warmUp().catch(()=>{});
  }

  (function(){
    const DEVOPS_START = new Date(2025, 7, 9);
    const YEAR_WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];

    function yearsSinceStart(){
      const now = new Date();
      let years = now.getFullYear() - DEVOPS_START.getFullYear();
      const hadAnniversaryThisYear =
        (now.getMonth() > DEVOPS_START.getMonth()) ||
        (now.getMonth() === DEVOPS_START.getMonth() && now.getDate() >= DEVOPS_START.getDate());
      if(!hadAnniversaryThisYear) years -= 1;
      return Math.max(1, years);
    }

    function yearWord(n){ return YEAR_WORDS[n] || String(n); }

    const years = yearsSinceStart();
    const plural = years !== 1;

    const statNum = document.getElementById('yearsStatNum');
    const statLabel = document.getElementById('yearsStatLabel');
    if(statNum) statNum.textContent = years;
    if(statLabel) statLabel.textContent = plural ? 'Years in DevOps' : 'Year in DevOps';

    const heroPhrase = document.getElementById('heroYearsPhrase');
    if(heroPhrase){
      heroPhrase.textContent = plural
        ? `${yearWord(years)} years in, still hooked.`
        : 'one year in, still hooked.';
    }

    const bioPhrase = document.getElementById('bioYearsPhrase');
    if(bioPhrase){
      const w = yearWord(years);
      bioPhrase.textContent = plural
        ? `${w.charAt(0).toUpperCase()}${w.slice(1)} years into DevOps`
        : 'A year into DevOps';
    }

    const aboutPhrase = document.getElementById('aboutYearsPhrase');
    if(aboutPhrase){
      aboutPhrase.textContent = plural ? `${yearWord(years)} years in` : 'A year in';
    }

    const expPhrase = document.getElementById('expYearsPhrase');
    if(expPhrase){
      const w = yearWord(years);
      expPhrase.textContent = plural
        ? `${w.charAt(0).toUpperCase()}${w.slice(1)} years into DevOps`
        : 'A year into DevOps';
    }

    const faqPhrase = document.getElementById('faqYearsPhrase');
    if(faqPhrase){
      faqPhrase.textContent = plural ? `about ${yearWord(years)} years into DevOps` : 'about a year into DevOps';
    }
  })();

  (function(){
    const statsEl = document.querySelector('.stats');
    const labels = ['ciStatLabel', 'cloudStatLabel', 'yearsStatLabel']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    if(!statsEl || !labels.length) return;

    function syncWrap(){

      statsEl.classList.remove('sync-wrap');
      const wrapped = labels.some(function(label){
        const lineHeight = parseFloat(getComputedStyle(label).lineHeight) || 16;
        return label.scrollHeight > lineHeight * 1.5;
      });
      statsEl.classList.toggle('sync-wrap', wrapped);
    }

    syncWrap();
    window.addEventListener('resize', syncWrap);
    window.addEventListener('load', syncWrap);
    if(window.ResizeObserver){
      const ro = new ResizeObserver(syncWrap);
      labels.forEach(label => ro.observe(label));
    }
  })();

  (function(){
    const lightbox = document.getElementById('courseLightbox');
    const backdrop = document.getElementById('courseLightboxBackdrop');
    const closeBtn = document.getElementById('courseLightboxClose');
    const contentEl = document.getElementById('courseLightboxContent');
    const titleEl = document.getElementById('courseLightboxTitle');
    const thumbs = document.querySelectorAll('[data-course-zoom]');
    if(!lightbox || !thumbs.length) return;

    let lastFocused = null;

    function openLightbox(thumb){
      const title = thumb.dataset.title || '';
      const fullSrc = thumb.dataset.full;
      contentEl.innerHTML = fullSrc
        ? '<img src="' + fullSrc + '" alt="' + title + '">'
        : thumb.innerHTML.replace(/<div class="course-zoom-btn"[\s\S]*?<\/div>/, '');
      titleEl.textContent = title;
      lastFocused = document.activeElement;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox(){
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      contentEl.innerHTML = '';
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    }

    thumbs.forEach(thumb=>{
      thumb.addEventListener('click', ()=> openLightbox(thumb));
      thumb.setAttribute('tabindex','0');
      thumb.setAttribute('role','button');
      thumb.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLightbox(thumb); }
      });
    });

    backdrop.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });

    document.querySelectorAll('.course-download, .course-visit').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        if(btn.getAttribute('href') === '#') e.preventDefault();
        e.stopPropagation();
      });
    });
  })();

  (function(){
    const carousel = document.getElementById('testiCarousel');
    const track = document.getElementById('testiTrack');
    const dotsWrap = document.getElementById('testiDots');
    if(!carousel || !track || !dotsWrap) return;

    const realSlides = Array.from(track.children);
    if(!realSlides.length) return;

    const loopClone = realSlides[0].cloneNode(true);
    loopClone.setAttribute('aria-hidden', 'true');
    loopClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    loopClone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
    track.appendChild(loopClone);
    const slides = Array.from(track.children);
    const cloneIndex = slides.length - 1;

    const dots = realSlides.map((_, i)=>{
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to recommendation ${i + 1}`);
      dotsWrap.appendChild(dot);
      return dot;
    });

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const STROKE = 1.6;
    function computeReadMs(slide){
      const text = (slide.querySelector('.testi-text')?.textContent || '').trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      const ms = Math.round((words / 90) * 60000);
      return Math.max(6000, Math.min(14000, ms));
    }
    function setupTrace(slide){
      const card = slide.querySelector('.testi-card');
      if(!card) return null;
      card.style.setProperty('--read-ms', computeReadMs(slide) + 'ms');
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('class', 'testi-trace');
      svg.setAttribute('aria-hidden', 'true');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', 'testi-trace-rect');
      rect.setAttribute('pathLength', '100');
      svg.appendChild(rect);
      card.appendChild(svg);
      function sizeToCard(){
        const w = card.clientWidth, h = card.clientHeight;
        if(!w || !h) return;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        rect.setAttribute('x', STROKE / 2);
        rect.setAttribute('y', STROKE / 2);
        rect.setAttribute('width', Math.max(0, w - STROKE));
        rect.setAttribute('height', Math.max(0, h - STROKE));
        rect.setAttribute('rx', 19);
      }
      sizeToCard();
      if(window.ResizeObserver) new ResizeObserver(sizeToCard).observe(card);
      else window.addEventListener('resize', sizeToCard);
      return rect;
    }
    const traceRects = slides.map(setupTrace);

    let active = 0;
    function setActive(i){
      active = i;
      const dotIndex = Math.min(i, dots.length - 1);
      dots.forEach((d, idx)=> d.classList.toggle('active', idx === dotIndex));
    }
    function goTo(i, behavior){
      const slide = slides[i];
      if(!slide) return;
      carousel.scrollTo({ left: slide.offsetLeft, behavior: behavior || 'smooth' });
      setActive(i);
    }
    setActive(0);

    let scrollTimer = null;
    carousel.addEventListener('scroll', ()=>{
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(()=>{
        let closest = 0, closestDist = Infinity;
        slides.forEach((slide, i)=>{
          const dist = Math.abs(slide.offsetLeft - carousel.scrollLeft);
          if(dist < closestDist){ closestDist = dist; closest = i; }
        });
        if(closest === cloneIndex){
          carousel.scrollTo({ left: slides[0].offsetLeft, behavior: 'auto' });
          closest = 0;
        }
        setActive(closest);
      }, 100);
    }, { passive:true });

    window.addEventListener('resize', ()=> goTo(active, 'auto'));

    const AUTOPLAY_MS = 6500;
    let remaining = AUTOPLAY_MS;
    let timerId = null;
    let timerStartedAt = 0;

    function armTimer(ms){
      clearTimeout(timerId);
      timerStartedAt = Date.now();
      timerId = setTimeout(()=>{

        goTo(Math.min(active + 1, cloneIndex));
        remaining = AUTOPLAY_MS;
        armTimer(remaining);
      }, ms);
    }
    function pauseAutoplay(){
      if(timerId === null) return;
      clearTimeout(timerId);
      timerId = null;
      remaining -= (Date.now() - timerStartedAt);
      if(remaining < 250) remaining = 250;
    }
    function resumeAutoplay(){
      if(timerId !== null) return;
      armTimer(remaining);
    }
    function restartAutoplay(){
      pointerActive = false;
      clearReadingClasses();
      remaining = AUTOPLAY_MS;
      armTimer(remaining);
    }
    armTimer(remaining);

    let pointerActive = false;
    function clearReadingClasses(){ slides.forEach(s => s.classList.remove('is-reading')); }
    function onTraceEnd(){
      clearReadingClasses();
      if(!pointerActive) return;
      goTo((active + 1) % realSlides.length);
      startReadingCurrent();
    }
    function startReadingCurrent(){
      clearReadingClasses();
      const slide = slides[active];
      const rect = traceRects[active];
      if(!slide || !rect) return;
      slide.classList.add('is-reading');
      rect.removeEventListener('animationend', onTraceEnd);
      rect.addEventListener('animationend', onTraceEnd, { once:true });
    }
    function beginReadThrough(){
      if(pointerActive) return;
      pointerActive = true;
      pauseAutoplay();
      startReadingCurrent();
    }
    function endReadThrough(){
      if(!pointerActive) return;
      pointerActive = false;
      clearReadingClasses();
      resumeAutoplay();
    }

    carousel.addEventListener('mouseenter', beginReadThrough);
    carousel.addEventListener('mouseleave', endReadThrough);

    dotsWrap.addEventListener('mouseenter', pauseAutoplay);
    dotsWrap.addEventListener('mouseleave', resumeAutoplay);

    dots.forEach((dot, i)=>{
      dot.addEventListener('click', ()=>{
        goTo(i);
        restartAutoplay();
      });
    });

    let isDragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    carousel.addEventListener('mousedown', (e)=>{
      isDragging = true;
      dragMoved = false;
      pauseAutoplay();
      carousel.classList.add('dragging');
      dragStartX = e.pageX;
      dragStartScroll = carousel.scrollLeft;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e)=>{
      if(!isDragging) return;
      const dx = e.pageX - dragStartX;
      if(Math.abs(dx) > 3) dragMoved = true;
      carousel.scrollLeft = dragStartScroll - dx;
    });
    function endDrag(){
      if(!isDragging) return;
      isDragging = false;
      carousel.classList.remove('dragging');

      let closest = 0, closestDist = Infinity;
      slides.forEach((slide, i)=>{
        const dist = Math.abs(slide.offsetLeft - carousel.scrollLeft);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      goTo(closest);

      if(carousel.matches(':hover') || dotsWrap.matches(':hover')){
        beginReadThrough();
      } else {
        resumeAutoplay();
      }
    }
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mouseleave', endDrag);

    carousel.addEventListener('click', (e)=>{
      if(dragMoved){ e.preventDefault(); e.stopPropagation(); dragMoved = false; }
    }, true);

    let mobileHoverPaused = false;
    carousel.addEventListener('touchstart', ()=>{
      beginReadThrough();
      mobileHoverPaused = true;
    }, { passive:true });
    document.addEventListener('touchstart', (e)=>{
      if(!mobileHoverPaused) return;
      if(carousel.contains(e.target) || dotsWrap.contains(e.target)) return;
      mobileHoverPaused = false;
      endReadThrough();
    }, { passive:true });

    carousel.addEventListener('touchcancel', ()=>{
      mobileHoverPaused = false;
      endReadThrough();
    }, { passive:true });
  })();

  document.querySelectorAll('.softskills-list li').forEach(function(item){
    const dot = item.querySelector('.ss-dot');
    if(!dot) return;
    item.addEventListener('mouseenter', function(){
      if(dot.classList.contains('ss-checked')) return;
      dot.classList.add('ss-checked');
    });
  });
