  // --- Network status: reflect connectivity in the footer, and let the
  // contact form check it before/while sending. navigator.onLine only
  // reflects the network adapter (it can still be true on a dead wifi that's
  // technically "connected" but has no route out), so it isn't a perfect
  // signal — but it reliably catches airplane mode / wifi off / cable
  // unplugged, and the 'online'/'offline' events fire the moment that changes.
  const footerCopyLine = document.getElementById('footerCopyLine');
  const footerOfflineLine = document.getElementById('footerOfflineLine');
  function updateNetworkStatusUI(){
    const offline = !navigator.onLine;
    if (footerOfflineLine) footerOfflineLine.hidden = !offline;
    if (footerCopyLine) footerCopyLine.hidden = offline;
  }
  window.addEventListener('online', updateNetworkStatusUI);
  window.addEventListener('offline', updateNetworkStatusUI);
  updateNetworkStatusUI();

  // --- Theme toggle (dark <-> light glass) ---
  // Auto-picks light/dark from the visitor's own device clock (no
  // permission prompts, no geolocation) so someone landing at 3pm gets the
  // light theme and someone landing at 3am gets the dark theme, wherever
  // they are in the world. A tiny inline script in <head> (see index.html,
  // right after <body>) already applies this same logic synchronously
  // before first paint, so there's no flash of the wrong theme — this
  // block just takes over for the toggle button and re-applies the result
  // (cheap and idempotent) so the button's icon/tooltip start in sync.
  // Once the visitor manually toggles, that explicit choice is saved and
  // wins over the clock on every later visit.
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
      // Let other modules (e.g. the "Building better systems." typewriter,
      // which sets an inline text color once and needs to re-sync it
      // whenever the theme flips afterwards) react to the change.
      document.dispatchEvent(new CustomEvent('themechange', { detail: { isLight } }));
      // Tooltip always names the destination theme: showing the moon icon
      // (currently light) offers "Dark theme"; showing the sun icon
      // (currently dark) offers "Light theme".
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

  // --- Infinity-loop symbol: replay its draw-in on phones every time it
  // scrolls into view. On desktop it's visible with the hero right away
  // so it just plays once on load as usual (see CSS); this only kicks in
  // under the 640px mobile breakpoint used elsewhere in this file.
  (function(){
    const wrap = document.querySelector('.devops-infinity');
    if (!wrap) return;
    if (!window.matchMedia('(max-width:640px)').matches) return;
    const animatedEls = wrap.querySelectorAll('.devops-infinity-path, .devops-infinity-comet');
    function restart(){
      // Dropping to animation:none and forcing a reflow makes the browser
      // forget the previous run entirely, so handing it back to the
      // stylesheet (still paused, per the CSS) starts the next play from
      // frame zero instead of resuming wherever it last stopped.
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

  // --- FAQ accordion ---
  document.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q').addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i=> i.classList.remove('open'));
      if(!isOpen) item.classList.add('open');
    });
  });

  // --- Mobile hamburger menu ---
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

  // --- Subtle shadow on nav once the page is scrolled ---
  const siteNav = document.querySelector('nav');
  window.addEventListener('scroll', ()=>{
    siteNav.style.boxShadow = window.scrollY > 8 ? '0 8px 24px -16px rgba(0,0,0,0.6)' : 'none';
  }, { passive:true });

  // --- Resume dropdown (PDF / JPG) ---
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

  // --- Language dropdown + automatic translation (EN <-> NL) ---
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  langBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    langMenu.classList.toggle('open');
  });
  document.addEventListener('click', ()=> langMenu.classList.remove('open'));

  // Auto-translation engine. Nothing here needs to be edited by hand: whenever
  // page text changes, a fresh translation is fetched (and cached) the next
  // time Dutch is selected — there is no manual translation dictionary to keep in sync.
  const i18n = (function(){
    const ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=nl&dt=t&q=';
    // Elements matching this selector (or inside one) are never auto-translated:
    // brand name, icons, the animated role text (handled separately below),
    // the Dutch/English menu labels themselves, tech-stack chips, and the year.
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

    async function translateOne(text){
      const key = text.trim();
      if(!key) return text;
      if(cache[key]) return cache[key];
      const res = await fetch(ENDPOINT + encodeURIComponent(key));
      if(!res.ok) throw new Error('Translation request failed');
      const data = await res.json();
      const translated = data[0].map(part => part[0]).join('');
      cache[key] = translated;
      return translated;
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

    // Original English is captured the first time a node/attribute is seen,
    // so switching back to English is instant and lossless, and any brand-new
    // text added to the page later is picked up automatically too.
    const originalText = new Map();
    const originalAttrs = [];
    const originalTitle = document.title;

    async function toDutch(){
      const textNodes = collectTextNodes();
      textNodes.forEach(n => { if(!originalText.has(n)) originalText.set(n, n.nodeValue); });

      const attrEls = collectAttrEls();
      attrEls.forEach(({ el, attr }) => {
        if(!originalAttrs.some(o => o.el === el && o.attr === attr)){
          originalAttrs.push({ el, attr, value: el.getAttribute(attr) });
        }
      });

      const jobs = [
        ...textNodes.map(node => ({ type:'text', node, original: originalText.get(node) })),
        ...originalAttrs.map(o => ({ type:'attr', el:o.el, attr:o.attr, original:o.value }))
      ];

      await runQueue(jobs, async (job)=>{
        try{
          const translated = await translateOne(job.original);
          if(job.type === 'text'){
            const lead = job.original.match(/^\s*/)[0];
            const trail = job.original.match(/\s*$/)[0];
            job.node.nodeValue = lead + translated + trail;
          } else {
            job.el.setAttribute(job.attr, translated);
          }
        }catch(err){
          console.warn('Translation failed, leaving original text:', job.original, err);
        }
      }, 6);

      saveCache();
      try{ document.title = await translateOne(originalTitle); }catch(e){}
    }

    function toEnglish(){
      originalText.forEach((text, node) => { node.nodeValue = text; });
      originalAttrs.forEach(({ el, attr, value }) => el.setAttribute(attr, value));
      document.title = originalTitle;
    }

    return { toDutch, toEnglish, translateOne };
  })();

  let currentLang = localStorage.getItem('site_lang') === 'nl' ? 'nl' : 'en';

  async function setLanguage(lang, persist){
    document.documentElement.classList.add('translating');
    try{
      if(lang === 'nl'){
        await i18n.toDutch();
        if(typeof translateRoleWord === 'function') await translateRoleWord();
        document.documentElement.lang = 'nl';
      } else {
        i18n.toEnglish();
        if(typeof restoreRoleWord === 'function') restoreRoleWord();
        document.documentElement.lang = 'en';
      }
      currentLang = lang;
      if(persist) localStorage.setItem('site_lang', lang);
      langMenu.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.lang === lang));
    } finally {
      document.documentElement.classList.remove('translating');
    }
  }

  langMenu.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      langMenu.classList.remove('open');
      const lang = btn.dataset.lang;
      if(lang !== currentLang) setLanguage(lang, true);
    });
  });

  // --- Scrollspy: highlight nav link for section in view ---
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach(link=>{
      link.classList.toggle('active', link.dataset.section === id);
    });
  };

  const SPY_LINE = 140; // px from top of viewport, just below the sticky nav
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

  // --- Copy phone/email to clipboard ---
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

  // --- Contact form: sends the message directly to job@talebi.dev via FormSubmit ---
  const phoneField = document.getElementById('phoneField');
  if (phoneField) {
    phoneField.addEventListener('input', function(){
      phoneField.value = phoneField.value.replace(/[^0-9+\-\s()]/g, '');
    });
  }
  const MAX_FILE_MB = 5;
  // Whitelist of attachment formats the form actually supports. Anything else
  // is rejected client-side (extension check backed up by a MIME check for images),
  // since the <input accept> attribute is only a picker hint and doesn't block
  // files chosen via "All files" or drag & drop.
  const ALLOWED_FILE_EXTENSIONS = ['jpg','jpeg','png','webp','pdf','doc','docx','txt'];
  const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg','image/png','image/webp'];
  const ALLOWED_FORMATS_LABEL = 'JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX or TXT';
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

  // --- Upload progress bar ---
  // The contact form is submitted as a real (non-AJAX) POST into a hidden
  // iframe (see the note above the <iframe> below) — that's the only way
  // FormSubmit reliably accepts the file attachment, but it also means the
  // browser never exposes real byte-level upload progress for it (no XHR,
  // no fetch). To still give visual feedback, this drives a progress bar off
  // a time estimate scaled to the file's size, holds it just shy of 100%
  // once it gets there, and only completes it once the iframe actually
  // reports the submission is done (or fails it on error/timeout).
  const uploadProgress = document.getElementById('uploadProgress');
  const uploadProgressName = document.getElementById('uploadProgressName');
  const uploadProgressPctNum = document.getElementById('uploadProgressPctNum');
  const uploadProgressFill = document.getElementById('uploadProgressFill');
  const uploadCancelBtn = document.getElementById('uploadCancelBtn');
  let uploadProgressRAF = null;

  function setUploadProgressPct(pct){
    const clamped = Math.max(0, Math.min(100, pct));
    if (uploadProgressFill) uploadProgressFill.style.width = clamped + '%';
    if (uploadProgressPctNum) uploadProgressPctNum.textContent = Math.round(clamped);
  }

  function stopUploadProgressLoop(){
    if (uploadProgressRAF) {
      cancelAnimationFrame(uploadProgressRAF);
      uploadProgressRAF = null;
    }
  }

  // Instantly hides/resets the bar with no animation — used when a file is
  // swapped/removed rather than when a send actually completes or fails.
  function resetUploadProgressInstant(){
    if (!uploadProgress) return;
    stopUploadProgressLoop();
    uploadProgress.classList.remove('show','done','error');
    uploadProgress.hidden = true;
    setUploadProgressPct(0);
  }

  function startUploadProgress(file){
    if (!uploadProgress || !file) return;
    stopUploadProgressLoop();
    uploadProgress.classList.remove('done','error');
    uploadProgress.hidden = false;
    if (uploadProgressName) uploadProgressName.textContent = file.name;
    setUploadProgressPct(0);
    requestAnimationFrame(function(){ uploadProgress.classList.add('show'); });

    // Rough duration estimate scaled by file size — small files feel near
    // instant, larger ones take proportionally longer, clamped to sane bounds.
    const kb = file.size / 1024;
    const duration = Math.max(900, Math.min(9000, kb * 12));
    const start = performance.now();

    // Two-phase animation: a normal ease-out ramp up to RAMP_PCT, then a slow
    // asymptotic crawl that keeps inching toward CRAWL_MAX for as long as the
    // real upload takes. The crawl never actually reaches CRAWL_MAX (or 100) —
    // finishUploadProgress() jumps it to 100 once the request truly completes.
    // This keeps the bar visibly moving instead of appearing to freeze at a
    // fixed number like 92 while FormSubmit is still working.
    const RAMP_PCT = 96;
    const CRAWL_MAX = 99;
    const crawlTau = Math.max(6000, duration * 2.2); // long, slow crawl toward 99

    function tick(now){
      const elapsed = now - start;
      if (elapsed < duration) {
        const t = elapsed / duration;
        const eased = 1 - Math.pow(1 - t, 3); // ease-out
        setUploadProgressPct(eased * RAMP_PCT);
      } else {
        const crawlElapsed = elapsed - duration;
        const pct = CRAWL_MAX - (CRAWL_MAX - RAMP_PCT) * Math.exp(-crawlElapsed / crawlTau);
        setUploadProgressPct(pct);
      }
      uploadProgressRAF = requestAnimationFrame(tick);
    }
    uploadProgressRAF = requestAnimationFrame(tick);
  }

  function finishUploadProgress(){
    if (!uploadProgress || uploadProgress.hidden) return;
    stopUploadProgressLoop();
    setUploadProgressPct(100);
    uploadProgress.classList.add('done');
    setTimeout(function(){
      uploadProgress.classList.remove('show');
      setTimeout(resetUploadProgressInstant, 250);
    }, 700);
  }

  function failUploadProgress(){
    if (!uploadProgress || uploadProgress.hidden) return;
    stopUploadProgressLoop();
    uploadProgress.classList.add('error');
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
  // Shows an error under the attach box, then auto-hides it 5s later.
  function showFileNoteError(message){
    clearFileNoteTimer();
    fileNote.textContent = message;
    fileNote.classList.add('error','show');
    fileNoteClearTimer = setTimeout(function(){
      fileNote.classList.remove('show');
      setTimeout(function(){ fileNote.textContent = ''; fileNote.classList.remove('error'); }, 250);
      fileNoteClearTimer = null;
    }, 5000);
  }

  // Turns the whole attach-file box on/off as a unit — used to lock it while
  // a send is actually in flight, so the user can't open the file picker or
  // trigger a change mid-send.
  // IMPORTANT: never set attachmentField.disabled here — a disabled form
  // control is excluded entirely from form submission, which would silently
  // drop the attachment from the POST while every other field still went
  // through. The .file-field.disabled CSS (pointer-events:none) is enough on
  // its own to block clicks on the label/remove button during a send.
  function setFileFieldDisabled(disabled){
    if (fileField) fileField.classList.toggle('disabled', disabled);
  }

  // Locks/unlocks name, email, phone, subject and message while a send is in
  // flight. Uses readOnly (not disabled) so the values still get posted with
  // the form — same reasoning as the file field above. Also hides each
  // field's "x" clear button so nothing in the form looks editable while
  // sending, only unlocking again on success, failure/timeout, or cancel.
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

  // Chrome/Safari cache the browser-autofill highlight (the
  // -webkit-autofill inset box-shadow) at the color it had when autofill
  // was applied, and don't repaint it just because a CSS variable (like
  // --card, used for the theme colors) changes elsewhere — so switching
  // theme while an autofilled name/email/phone/subject field is on screen
  // can leave it showing the old theme's dark box behind pale text. A
  // brief remove-from-layout/reflow forces the browser to repaint it with
  // the current theme's colors.
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
  }

  // Same as resetFileField() but leaves the note alone, so a validation
  // message (wrong format / too large) stays visible after the field clears.
  function clearFileFieldKeepNote(){
    attachmentField.value = '';
    fileField.classList.remove('has-file');
    fileLabelText.textContent = defaultFileLabel;
    fileRemoveBtn.hidden = true;
    resetUploadProgressInstant();
  }

  if (attachmentField) {
    attachmentField.addEventListener('change', function(){
      const file = attachmentField.files && attachmentField.files[0];
      resetUploadProgressInstant();
      if (!file) { resetFileField(); return; }
      if (!isAllowedFile(file)) {
        showFileNoteError('Unsupported file format — allowed formats: ' + ALLOWED_FORMATS_LABEL + '.');
        clearFileFieldKeepNote();
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        showFileNoteError('File is too large — max ' + MAX_FILE_MB + 'MB.');
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
  let successClearTimer = null;

  // --- Success note auto-hide, gated on the user actually seeing it ---
  // The success message shouldn't start its countdown to disappear until
  // the user has genuinely had it in front of their eyes for long enough to
  // read to the end. Two things can prevent that at the moment it appears:
  //   1) the browser tab isn't the active one (user is in another tab/app)
  //   2) the note isn't actually in the viewport (user had scrolled
  //      elsewhere on the page — scrollIntoView is called, but if the tab
  //      is backgrounded the scroll can't visually register anyway, and
  //      even in the foreground we don't want to trust "we told it to
  //      scroll" over "it's actually on screen")
  // So instead of a flat setTimeout, we accumulate elapsed time in small
  // ticks and only count a tick while BOTH conditions hold. Whenever the
  // user comes back (switches tab back, or scrolls the note into view),
  // counting resumes from where it left off — no restart needed.
  const SUCCESS_NOTE_DISPLAY_MS = 10000;
  const SUCCESS_TICK_MS = 250;
  let successTicker = null;
  let successVisibleElapsed = 0;
  let successNoteIntersecting = false;
  let successIO = null;

  function ensureSuccessObserver(){
    if (successIO || !formNote || typeof IntersectionObserver === 'undefined') return;
    successIO = new IntersectionObserver(function(entries){
      const entry = entries[entries.length - 1];
      // Require a solid majority of the note to be on screen before we
      // count it as "seen" — a sliver peeking into view isn't enough to
      // read the whole message.
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
      // else: paused — no time counted for this tick, we just wait for the
      // user to come back and/or scroll it into view.
    }, SUCCESS_TICK_MS);
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

  const subjectHiddenField = document.getElementById('subjectHiddenField');
  const FORMSUBMIT_URL = 'https://formsubmit.co/job@talebi.dev';
  let sendAbortController = null;
  let sendTimeoutId = null;
  let currentSendHasFile = false;

  // --- Feedback helpers: whenever a send result (or a pre-send validation
  // error) shows up in formNote, pull the user's view down to it (they may
  // have scrolled away while the request was in flight) and play a short
  // tone so the outcome is noticeable even if they're not looking at the
  // screen. Tones are synthesized with the Web Audio API — no audio files
  // to ship, and they respect the same "must follow a user gesture" rule
  // browsers enforce, since these only ever fire after a click.
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
    playTone(ctx, 587.33, t, 0.12, 'sine', 0.12);       // D5
    playTone(ctx, 739.99, t + 0.1, 0.12, 'sine', 0.12); // F#5
    playTone(ctx, 987.77, t + 0.2, 0.2, 'sine', 0.14);  // B5
  }

  function playErrorSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    playTone(ctx, 220, t, 0.16, 'square', 0.09);        // A3
    playTone(ctx, 174.61, t + 0.14, 0.24, 'square', 0.09); // F3
  }

  // Brings formNote into view regardless of where the user has scrolled to
  // in the meantime (they may have kept reading the page while a send was
  // in flight, or while an async result was still pending).
  function scrollToFormNote(){
    if (!formNote) return;
    formNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }


  // Backs out of a send that's still in flight — used both by the cancel
  // button inside the upload-progress bar (file attached) and by the plain
  // Cancel button shown next to "Sending…" (no file attached).
  function cancelActiveSend(){
    if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
    if (sendAbortController) { sendAbortController.abort(); sendAbortController = null; }

    resetUploadProgressInstant();
    if (currentSendHasFile) resetFileField(); // only clears the attachment — name/email/phone/subject/message stay as typed
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);
    clearDraft(); // intentional cancel — no need to auto-restore this on next load

    formNote.classList.remove('ok','error','notice','show','sending');
    formNote.textContent = '';
    sendBtn.disabled = false;
  }

  function handleSendSuccess(){
    formNote.innerHTML = '<span class="form-note-check" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="check-circle" cx="12" cy="12" r="10"/><path class="check-mark" d="M7 12.5l3 3 7-7"/></svg></span><span class="form-note-success">Message sent</span> <span class="form-note-white">—</span> <span class="form-note-blue">thanks! I\'ll get back to you soon.</span> <span class="form-note-white">Don\'t hear back in a couple of days?</span><br><span class="form-note-white">Please email</span> <a href="mailto:job@talebi.dev" class="form-note-yellow">job@talebi.dev</a> <span class="form-note-white">directly just to be safe.</span>';
    formNote.classList.remove('error','notice','sending');
    formNote.classList.add('ok','show');
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
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);
    sendBtn.disabled = false;
    if (successClearTimer) { clearTimeout(successClearTimer); successClearTimer = null; }
    startSuccessAutoHide();
  }

  // A failed send sometimes can't be fixed by just clicking "Send" again —
  // e.g. if the connection dropped mid-upload, some browsers keep reusing
  // the same now-broken connection to the endpoint until the page does a
  // real navigation, so retrying in place keeps failing even once the
  // network is back. A full refresh does fix it, but that used to mean
  // losing everything the user had typed. So on every real send failure we
  // silently stash the typed fields (not the file — browsers never let a
  // File survive a reload) and restore them automatically on next load, so
  // "refresh and try again" no longer means "start over".
  const DRAFT_KEY = 'talebidev_contact_draft';

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  function saveDraftForRetry(){
    try {
      const draft = {};
      ['name','email','phone','subject','message'].forEach(function(fieldName){
        const field = contactForm.elements[fieldName];
        if (field && field.value) draft[fieldName] = field.value;
      });
      const file = attachmentField && attachmentField.files && attachmentField.files[0];
      if (file) draft.fileName = file.name;
      if (Object.keys(draft).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) { /* storage unavailable — just skip, nothing else depends on it */ }
  }

  function clearDraft(){
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function restoreDraftIfAny(){
    let draft = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) draft = JSON.parse(raw);
    } catch (e) { draft = null; }
    if (!draft) return;
    clearDraft();
    ['name','email','phone','subject','message'].forEach(function(fieldName){
      const field = contactForm.elements[fieldName];
      if (field && draft[fieldName]) {
        field.value = draft[fieldName];
        field.dispatchEvent(new Event('input', { bubbles:true }));
      }
    });
    if (draft.fileName) {
      formNote.innerHTML = 'Your message text was restored after the connection issue <span class="form-note-white">—</span> please re-attach <span class="form-note-white">' + escapeHtml(draft.fileName) + '</span> and hit Send again.';
      formNote.classList.remove('ok','error','sending');
      formNote.classList.add('notice','show');
    }
  }

  function handleSendFailure(message, fileStillAttached){
    saveDraftForRetry();
    formNote.innerHTML = message;
    formNote.classList.remove('ok','notice','sending');
    formNote.classList.add('error','show');
    scrollToFormNote();
    playErrorSound();
    failUploadProgress();
    sendBtn.disabled = false;
    setFileFieldDisabled(false);
    setTextFieldsLocked(false);
    // Sending has stopped and the file is still attached — let the user
    // remove it again if they want to.
    if (fileStillAttached) fileRemoveBtn.hidden = false;
  }

  contactForm.addEventListener('submit', function(e){
    e.preventDefault();

    // Final guard: never let an unsupported (or oversized) attachment go out.
    const fileToSend = attachmentField && attachmentField.files && attachmentField.files[0];
    if (fileToSend && !isAllowedFile(fileToSend)) {
      formNote.textContent = 'Message not sent — file format not supported. Allowed formats: ' + ALLOWED_FORMATS_LABEL + '.';
      formNote.classList.remove('ok','notice');
      formNote.classList.add('error','show');
      scrollToFormNote();
      playErrorSound();
      return;
    }
    if (fileToSend && fileToSend.size > MAX_FILE_MB * 1024 * 1024) {
      formNote.textContent = 'Message not sent — file is too large (max ' + MAX_FILE_MB + 'MB).';
      formNote.classList.remove('ok','notice');
      formNote.classList.add('error','show');
      scrollToFormNote();
      playErrorSound();
      return;
    }

    // Hard stop if the browser already knows there's no network at all —
    // don't even attempt the request, and don't show a false "sent". This is
    // the immediate/obvious case; the fetch() below (not an iframe) is what
    // catches the sneakier cases (weak connection, request blocked/dropped
    // mid-flight by a proxy or VPN) with a real error instead of a guess.
    if (!navigator.onLine) {
      handleSendFailure('No internet connection — please reconnect and try again, or to be sure your message gets through, send it directly to <a href="mailto:job@talebi.dev" class="form-note-yellow">job@talebi.dev</a>.', !!fileToSend);
      return;
    }

    const subjectVal = contactForm.elements['subject'] ? contactForm.elements['subject'].value : '';
    if (subjectHiddenField) {
      subjectHiddenField.value = subjectVal ? ('Portfolio contact: ' + subjectVal) : 'New message from your portfolio site';
    }

    currentSendHasFile = !!fileToSend;
    sendBtn.disabled = true;
    setFileFieldDisabled(true);
    setTextFieldsLocked(true);
    formNote.innerHTML = '<span class="sending-wrap"><span class="sending-label">Sending</span><span class="sending-dots" aria-hidden="true"><span></span><span></span><span></span></span></span><button type="button" class="form-note-cancel" id="sendCancelBtn">Cancel</button>';
    formNote.classList.remove('ok','error','notice');
    formNote.classList.add('show','sending');
    if (fileToSend) {
      startUploadProgress(fileToSend);
      // The remove-file (X) button on the attach box is only meant for
      // before a send is in flight — hide it while sending/uploading.
      fileRemoveBtn.hidden = true;
    }

    // Sent as a real fetch() POST — not the old hidden-iframe trick. An
    // iframe's 'load' event fires for ANY page it ends up showing, including
    // the browser's own offline error page or a VPN/proxy block page, so it
    // used to report "Message sent" even with no internet, or even when the
    // request never actually reached FormSubmit. fetch() gives back a real,
    // inspectable response and genuinely rejects when the network is down or
    // the request can't complete — FormData (built straight from the form)
    // still carries the file attachment as a proper multipart upload, so
    // this isn't a tradeoff versus the old approach.
    if (sendTimeoutId) clearTimeout(sendTimeoutId);
    if (sendAbortController) sendAbortController.abort();
    sendAbortController = new AbortController();
    const thisController = sendAbortController;

    // Text-only sends are quick, but a submission with an attachment genuinely
    // needs more slack — the actual multipart upload takes longer the bigger
    // the file, on top of normal network variance. Scale the timeout with the
    // file size, with a generous floor/ceiling so it stays reasonable.
    const sendTimeoutMs = fileToSend
      ? Math.min(90000, 20000 + (fileToSend.size / 1024) * 25)
      : 15000;
    sendTimeoutId = setTimeout(function(){ thisController.abort(); }, sendTimeoutMs);

    const formData = new FormData(contactForm);

    // IMPORTANT: FormSubmit's /ajax/ endpoint only reliably processes text
    // fields — attachments sent to it get silently dropped, which is why the
    // email arrived but the file never did. The real (non-ajax) endpoint is
    // the one that actually processes attachments, but it isn't CORS-enabled,
    // so we can't read its response — hence mode: 'no-cors'. That only blocks
    // us from inspecting the response body/status; it does NOT stop fetch()
    // from rejecting on a genuine network failure (offline, DNS failure,
    // connection dropped mid-request), which is the real signal we need.
    fetch(FORMSUBMIT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
      signal: thisController.signal
    })
      .then(function(){
        if (thisController !== sendAbortController) return; // cancelled/superseded — stay quiet
        if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
        handleSendSuccess();
      })
      .catch(function(err){
        if (thisController !== sendAbortController) return; // cancelled/superseded — stay quiet
        if (sendTimeoutId) { clearTimeout(sendTimeoutId); sendTimeoutId = null; }
        if (err && err.name === 'AbortError') {
          handleSendFailure('<span class="form-note-x" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="x-circle" cx="12" cy="12" r="10"/><path class="x-mark" d="M8 8L16 16M16 8L8 16"/></svg></span><span class="form-note-red">Sending is taking too long</span> <span class="form-note-white">—</span> <span class="form-note-red">your connection may be too weak right now.</span> <span class="form-note-green">Please try sending again or refresh the page.</span> <span class="form-note-white">Or skip the wait and email it directly to</span> <a href="mailto:job@talebi.dev" class="form-note-yellow">job@talebi.dev</a><span class="form-note-white">.</span>', !!fileToSend);
        } else {
          handleSendFailure('Couldn\'t reach the server — please check your internet connection and try again, or to be sure your message gets through, send it directly to <a href="mailto:job@talebi.dev" class="form-note-yellow">job@talebi.dev</a>.', !!fileToSend);
        }
      });
  });

  // Lets the user back out of a send that's still in progress — the cancel
  // button inside the upload-progress bar when a file was attached...
  if (uploadCancelBtn) {
    uploadCancelBtn.addEventListener('click', cancelActiveSend);
  }
  // ...and the plain Cancel button next to "Sending…" when it wasn't. That
  // button is re-created (via innerHTML) on every send, so it's handled with
  // one delegated listener on formNote rather than being rebound each time.
  formNote.addEventListener('click', function(e){
    if (e.target.closest('#sendCancelBtn')) cancelActiveSend();
  });

  restoreDraftIfAny();

  // --- Floating scroll-to-top / scroll-to-bottom toggle ---
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

  // --- Terminal traffic-light dots: choreographed boot-sequence interactions ---
  const dotRed = document.getElementById('dotRed');
  const dotYellow = document.getElementById('dotYellow');
  const dotGreen = document.getElementById('dotGreen');
  const terminalBox = document.getElementById('terminalBox');
  const terminalPre = document.getElementById('terminalPre');

  let terminalBusy = false;     // true while a typing sequence is actively running
  let cooldownActive = false;   // true while a dot is locked (typing sequence, or the glow-linked wait after it)
  let terminalClosed = false;   // true while the box is hidden after a confirmed red-dot close

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

  // Types "$ <commandText>", lets the trailing "..." pulse in place for a
  // few seconds, then reveals each checkline one at a time with a tick.
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

  // Types a single full line (no separate "$" prompt) — used for the
  // "⚠ ..." warning lines in the production-guard flow. onStart fires the
  // instant the first character begins (after gapBefore), so callers can
  // kick off a border-glow + timer exactly when this line starts.
  async function typeFullLine(text, cls, speed = 28, gapBefore = 450, onStart = null){
    if(gapBefore) await delay(gapBefore);
    const lineEl = document.createElement('div');
    lineEl.className = 'term-line' + (cls ? ' ' + cls : '');
    terminalPre.appendChild(lineEl);
    if(onStart) onStart();
    await typeInto(lineEl, text, speed);
    return lineEl;
  }

  // Types a "$ <text>" prompt-style line.
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

  // Types a "# <text>" comment-style hint line, typed across several
  // segments so a keyword (e.g. "yellow"/"green") can be colored while the
  // rest of the line types normally. segments: [{ text, className }, ...]
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

  // Shows a terminal-style "question (y/n)" line, typed out character by
  // character, then waits for a y or n answer (case-insensitive).
  // Resolves true for y, false for n, or null if timeoutMs elapses with no
  // answer. On small/mobile screens (no physical keyboard), a small visible
  // input is focused once the question has finished typing so the on-screen
  // keyboard opens; only y/n are accepted from it.
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

  // --- Deploy state machine ---
  // firstAction: which of green/yellow was pressed first ('green' | 'yellow' | null)
  // yellowRun:  the yellow safety-check screen has been shown at least once
  // deployed:   the final "deployed to production" screen is currently showing
  let firstAction = null;
  let yellowRun = false;
  let deployed = false;
  let successGlowToken = 0;

  // Manual-duration pair: beginGlow starts the border color + lock right
  // away (call it the instant a specific line begins typing); endGlow
  // clears both — call it the instant the relevant typing actually
  // finishes, so the border color and the unlock happen together with the
  // last character rather than on a fixed timer.
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

  // Blinks the given traffic-light dot to draw attention to it while the
  // terminal is asking the user to press it; hovering holds it steady.
  function setDotPulse(dot, on){
    if(!dot) return;
    dot.classList.toggle('guide-pulse', on);
  }

  // Flash/shake a dot to warn the user it can't be clicked yet.
  function warnDot(dot){
    if(!dot) return;
    dot.classList.remove('dot-warn');
    void dot.offsetWidth; // restart the animation if it's already running
    dot.classList.add('dot-warn');
    setTimeout(()=> dot.classList.remove('dot-warn'), 450);
  }

  function isLocked(){
    return terminalBusy || cooldownActive || terminalClosed || terminalBox.classList.contains('closing');
  }

  // Simple background wait for flows that don't trigger a glow (e.g. the
  // red-dot close/cancel and the green-blocked message) — no visuals, just
  // keeps the dots locked for a moment after the message is shown.
  function startCooldown(){
    return new Promise(resolve=>{
      cooldownActive = true;
      setTimeout(()=>{
        cooldownActive = false;
        resolve();
      }, 5000);
    });
  }

  // Retypes the terminal back to its original default output, line by line.
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

  // Green pressed before the yellow safety-check has ever run: refuse and
  // point at the yellow button.
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

  // Yellow pressed: runs the dry-run / safety check and tells the user to
  // press green to continue. Shown identically whether yellow is pressed
  // first, or after green has already been blocked once.
  async function runYellowScreen(){
    terminalPre.innerHTML = '';
    await typePromptLine('./deploy.sh --env=production', 'w', 60, 0);
    let glowToken = null;
    await typeFullLine('⚠ Warning: Production target detected', 'term-warn', 34, 500, ()=>{ glowToken = beginGlow('warn-glow'); });
    // Typed slowly and deliberately, like it's actually checking something.
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
      // Remember whichever dot was guiding the user (if any) so we can
      // resume its blink if this close ends up being cancelled.
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
        // No y/n within 7s: silently cancel, clear the prompt, timer goes
        // straight to 0, and the red dot relights immediately.
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
          // 5 seconds after the box is fully closed, bring it back to the default state.
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
      successGlowToken++; // cancel any pending/active glow
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
        // Green was pressed first, got blocked, yellow ran the safety check afterwards.
        await runTerminalSequence({
          commandText:'Deploying to production',
          checklines:['Dry-run verified', 'Health checks passed', 'Zero-downtime rollout completed', 'Live and stable – nice work'],
          lineClass:'term-green',
          onFirstCheck
        });
      } else {
        // Yellow was pressed first.
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
      successGlowToken++; // cancel any pending/active glow
      terminalBox.classList.remove('success');
      terminalBox.classList.remove('warn-glow');
      if(firstAction === null) firstAction = 'yellow';

      await runYellowScreen(); // internally waits out its own glow-linked lock
      yellowRun = true;
      deployed = false;
      terminalBusy = false;
      dotYellow.classList.remove('dot-off');
    });
  }

  // Brings the terminal back after a confirmed red-dot close, resets the
  // deploy state, and retypes the default boot text.
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

  // Types out the default boot text on page load instead of having it sit
  // there statically — same typing effect as every other terminal sequence.
  if(terminalPre){
    terminalBusy = true;
    runResetSequence().then(()=>{ terminalBusy = false; });
  }

  // --- Experience items: hover to blink status dot, click to open/close ---
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

  // --- Project cards: sequential blue-highlight chain (card 1 -> 2 -> 3, loops every 4s) ---
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

  // --- Static role text (no typing animation) ---
  const roleText = document.getElementById('roleText');
  const roleWordOriginal = 'DevOps Engineer';
  let roleWord = roleWordOriginal;
  if(roleText) roleText.textContent = roleWord;

  // Hooked into the language switcher above: translates/restores the role word.
  async function translateRoleWord(){
    try{ roleWord = await i18n.translateOne(roleWordOriginal); }catch(e){ roleWord = roleWordOriginal; }
    if(roleText) roleText.textContent = roleWord;
  }
  function restoreRoleWord(){
    roleWord = roleWordOriginal;
    if(roleText) roleText.textContent = roleWord;
  }

  // --- Typewriter effect for the "Hey, welcome" eyebrow: cycles through a
  // short series of phrases, typing and erasing at a comfortable, readable
  // speed with a fixed-height container so nothing below ever shifts. The
  // caret only blinks during the reading pause (never while actively typing
  // or erasing). The final phrase pops in a green checkmark first (with a
  // bouncy draw animation), then types out in the same green, and is left
  // on screen — caret keeps blinking there forever, nothing erases/restarts. ---
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
    const typeSpeed = 85;   // ms per character while typing
    const eraseSpeed = 55;  // ms per character while erasing
    let phraseIndex = 0;
    let onFinalPhrase = false; // true once the last phrase has started typing (and stays true forever after)

    // The final phrase's color is set once via inline style when it starts
    // typing, so if the user flips the theme afterwards (page loaded/left
    // sitting on "Building better systems.", then the theme button is
    // clicked) that inline color would otherwise never update. Re-apply it
    // on every theme change while the final phrase is showing.
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
        setCaretBlinking(false); // no blinking while actively typing
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
              setCaretBlinking(true); // starts blinking here
              if(caretEl){
                // blink keyframe is 1.1s per cycle -> after 5 blinks, vanish completely
                setTimeout(()=>{ caretEl.style.display = 'none'; }, 5 * 1100);
              }
              return; // stop here: no erase, no restart
            }
            setCaretBlinking(true); // blink only during the reading pause
            const holdTime = Math.max(1300, phrase.text.length * 130);
            setTimeout(erasePhrase, holdTime);
          }
        }, typeSpeed);
      }

      if(phrase.final && eyebrowCheck){
        // Show the checkmark first, with its draw/pop animation, then type the text.
        // Turn the caret green right away so it's green from the moment the tick appears.
        eyebrowCheck.classList.add('show');
        if(caretEl) caretEl.classList.add('final-caret');
        setTimeout(startTyping, 600);
      } else {
        startTyping();
      }
    }

    function erasePhrase(){
      setCaretBlinking(false); // no blinking while actively erasing
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

    // On mobile, don't start typing until the user actually scrolls down to
    // this "Hey, welcome" line; on desktop it starts right away as before.
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

  // --- Discord icon: not a real link, clicking copies the username and shows a green "copied" checkmark ---
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

  // --- Auto-update copyright year ---
  const copyYear = document.getElementById('copyYear');
  if(copyYear) copyYear.textContent = new Date().getFullYear();

  // --- Block right-click / drag on the profile photo (deters casual save/copy) ---
  const avatarImg = document.querySelector('.avatar img');
  if(avatarImg){
    avatarImg.addEventListener('contextmenu', e=> e.preventDefault());
    avatarImg.addEventListener('dragstart', e=> e.preventDefault());
  }

  // --- Restore saved language preference (must run last: depends on setLanguage,
  // translateRoleWord and roleText all being defined above) ---
  if(currentLang === 'nl') setLanguage('nl', false);

  // --- Auto-updating "years in DevOps" (recalculated on every page load,
  // so the numbers/wording roll over automatically each year on the
  // anniversary — no manual edits needed). ---
  (function(){
    const DEVOPS_START = new Date(2025, 7, 9); // Aug 9, 2025 anchor date
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

  // --- Stats row: all boxes are equal width, but their labels are
  // different lengths, so at some zoom levels/widths one label wraps to 2
  // lines while the others stay on 1, which looks mismatched. Measure all
  // labels' natural (unforced) height and, as soon as ANY of them has
  // wrapped, force all onto 2 lines together via the hidden
  // <br class="stat-break"> already placed in each label's markup.
  (function(){
    const statsEl = document.querySelector('.stats');
    const labels = ['ciStatLabel', 'cloudStatLabel', 'yearsStatLabel']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    if(!statsEl || !labels.length) return;

    function syncWrap(){
      // Measure with the forced breaks off, so they don't affect the row's
      // height and skew the "has any label wrapped" reading.
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

  // --- Course certificate lightbox ---
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

    // Download buttons: until real certificate files are wired up (href="#"),
    // stop them from just jumping the page to the top.
    document.querySelectorAll('.course-download').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        if(btn.getAttribute('href') === '#') e.preventDefault();
        e.stopPropagation();
      });
    });
  })();

  // --- Recommendations: one-at-a-time snap carousel with dots ------------
  // Shows a single testimonial card at a time, snapping neatly into view.
  // Navigable by dot, by drag/swipe, or by a gentle autoplay that pauses
  // the moment the user touches or hovers the carousel.
  (function(){
    const carousel = document.getElementById('testiCarousel');
    const track = document.getElementById('testiTrack');
    const dotsWrap = document.getElementById('testiDots');
    if(!carousel || !track || !dotsWrap) return;

    const slides = Array.from(track.children);
    if(!slides.length) return;

    // Build one dot per slide.
    const dots = slides.map((_, i)=>{
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to recommendation ${i + 1}`);
      dotsWrap.appendChild(dot);
      return dot;
    });

    let active = 0;
    function setActive(i){
      active = i;
      dots.forEach((d, idx)=> d.classList.toggle('active', idx === i));
    }
    function goTo(i, behavior){
      const slide = slides[i];
      if(!slide) return;
      carousel.scrollTo({ left: slide.offsetLeft, behavior: behavior || 'smooth' });
      setActive(i);
    }
    setActive(0);

    // Keep the active dot in sync while the user scrolls/drags/swipes.
    let scrollTimer = null;
    carousel.addEventListener('scroll', ()=>{
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(()=>{
        let closest = 0, closestDist = Infinity;
        slides.forEach((slide, i)=>{
          const dist = Math.abs(slide.offsetLeft - carousel.scrollLeft);
          if(dist < closestDist){ closestDist = dist; closest = i; }
        });
        setActive(closest);
      }, 100);
    }, { passive:true });

    // Re-snap to the active slide on resize (offsets shift with width).
    window.addEventListener('resize', ()=> goTo(active, 'auto'));

    // Gentle autoplay: advance one slide every few seconds, loop at the end.
    // Pausing (hover/drag/touch) truly freezes the countdown — resuming
    // continues from whatever time was left, instead of restarting or
    // silently ticking on in the background.
    const AUTOPLAY_MS = 5000;
    let remaining = AUTOPLAY_MS;
    let timerId = null;
    let timerStartedAt = 0;

    function armTimer(ms){
      clearTimeout(timerId);
      timerStartedAt = Date.now();
      timerId = setTimeout(()=>{
        goTo((active + 1) % slides.length);
        remaining = AUTOPLAY_MS;
        armTimer(remaining);
      }, ms);
    }
    function pauseAutoplay(){
      if(timerId === null) return;
      clearTimeout(timerId);
      timerId = null;
      remaining -= (Date.now() - timerStartedAt);
      if(remaining < 250) remaining = 250; // never resume into an instant jump
    }
    function resumeAutoplay(){
      if(timerId !== null) return;
      armTimer(remaining);
    }
    function restartAutoplay(){
      remaining = AUTOPLAY_MS;
      armTimer(remaining);
    }
    armTimer(remaining);

    // Pause on hover/touch anywhere over the carousel itself...
    carousel.addEventListener('mouseenter', pauseAutoplay);
    carousel.addEventListener('mouseleave', resumeAutoplay);
    // ...and over the dots, which sit outside the carousel in the DOM.
    dotsWrap.addEventListener('mouseenter', pauseAutoplay);
    dotsWrap.addEventListener('mouseleave', resumeAutoplay);

    // A manual dot click jumps straight there and gives the countdown a
    // fresh full interval rather than firing on whatever was left.
    dots.forEach((dot, i)=>{
      dot.addEventListener('click', ()=>{
        goTo(i);
        restartAutoplay();
      });
    });

    // Drag-to-scroll with the mouse.
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
      // Snap to whichever slide is now closest to the drop point.
      let closest = 0, closestDist = Infinity;
      slides.forEach((slide, i)=>{
        const dist = Math.abs(slide.offsetLeft - carousel.scrollLeft);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      goTo(closest);
      // Only resume automatically if the pointer isn't still hovering the
      // carousel/dots — mouseleave will otherwise resume it for us.
      if(!carousel.matches(':hover') && !dotsWrap.matches(':hover')) resumeAutoplay();
    }
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mouseleave', endDrag);

    // Don't let a link inside a card fire its click right after a drag.
    carousel.addEventListener('click', (e)=>{
      if(dragMoved){ e.preventDefault(); e.stopPropagation(); dragMoved = false; }
    }, true);

    // Touch: native swipe scrolling + snap already works via CSS, just
    // pause autoplay while the finger is on the strip and resume after.
    carousel.addEventListener('touchstart', pauseAutoplay, { passive:true });
    carousel.addEventListener('touchend', ()=>{
      setTimeout(resumeAutoplay, 700);
    }, { passive:true });
  })();
