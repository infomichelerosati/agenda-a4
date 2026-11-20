(function (root) {
  'use strict';

  var STORAGE_KEY = 'agenda_a4_prefs_v1';
  var PX_PER_MM = 96 / 25.4;

  var app = root.AgendaApp || {};
  var themesMod = app.themes;
  var calendarMod = app.calendar;
  var pdfMod = app.pdfEngine;
  var previewMod = app.preview;

  var state = {
    preset: 'next-4-weeks',
    startDate: '',
    endDate: '',
    config: {
      duplexMode: 'fronte-retro',
      bindingMargin: 15,
      startMinutes: 450,
      endMinutes: 1200,
      stepMinutes: 15,
      headerTitle: 'Agenda Appuntamenti',
      theme: 'blu',
      showHolidays: true,
      showWeekNumber: true,
      alternateHours: true,
      showNotes: false
    },
    viewMode: 'spread', // 'spread' | 'single'
    showBindingGuide: true,
    navIndex: 0,
    zoom: 0.62,
    autoFit: true,
    aligned: null,
    pages: [],
    spreads: []
  };

  var dom = {};
  var toastTimer = null;

  function loadSavedPrefs() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;

      var cfg = state.config;
      if (saved.duplexMode === 'fronte-retro' || saved.duplexMode === 'libro') {
        cfg.duplexMode = saved.duplexMode;
      }
      if ([9, 15, 20].indexOf(Number(saved.bindingMargin)) !== -1) {
        cfg.bindingMargin = Number(saved.bindingMargin);
      }
      if (isFinite(Number(saved.startMinutes))) {
        cfg.startMinutes = Number(saved.startMinutes);
      }
      if (isFinite(Number(saved.endMinutes))) {
        cfg.endMinutes = Number(saved.endMinutes);
      }
      if (cfg.endMinutes <= cfg.startMinutes) {
        cfg.startMinutes = 450;
        cfg.endMinutes = 1200;
      }
      if ([15, 30, 60].indexOf(Number(saved.stepMinutes)) !== -1) {
        cfg.stepMinutes = Number(saved.stepMinutes);
      }
      if (typeof saved.headerTitle === 'string') {
        cfg.headerTitle = saved.headerTitle;
      }
      if (themesMod.THEMES[saved.theme]) {
        cfg.theme = saved.theme;
      }
      if (typeof saved.showHolidays === 'boolean') cfg.showHolidays = saved.showHolidays;
      if (typeof saved.showWeekNumber === 'boolean') cfg.showWeekNumber = saved.showWeekNumber;
      if (typeof saved.alternateHours === 'boolean') cfg.alternateHours = saved.alternateHours;
      if (typeof saved.showNotes === 'boolean') cfg.showNotes = saved.showNotes;
      if (saved.viewMode === 'spread' || saved.viewMode === 'single') {
        state.viewMode = saved.viewMode;
      }
      if (typeof saved.showBindingGuide === 'boolean') {
        state.showBindingGuide = saved.showBindingGuide;
      }
    } catch (err) {
      // Ignore storage errors (private mode / restricted file://)
    }
  }

  function savePrefs() {
    try {
      if (!root.localStorage) return;
      var payload = {
        duplexMode: state.config.duplexMode,
        bindingMargin: state.config.bindingMargin,
        startMinutes: state.config.startMinutes,
        endMinutes: state.config.endMinutes,
        stepMinutes: state.config.stepMinutes,
        headerTitle: state.config.headerTitle,
        theme: state.config.theme,
        showHolidays: state.config.showHolidays,
        showWeekNumber: state.config.showWeekNumber,
        alternateHours: state.config.alternateHours,
        showNotes: state.config.showNotes,
        viewMode: state.viewMode,
        showBindingGuide: state.showBindingGuide
      };
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // Ignore storage errors
    }
  }

  function cacheDom() {
    dom.presetButtons = document.getElementById('preset-buttons');
    dom.btnPresetYearCurr = document.getElementById('btn-preset-year-curr');
    dom.btnPresetYearNext = document.getElementById('btn-preset-year-next');
    dom.inputStartDate = document.getElementById('input-start-date');
    dom.inputEndDate = document.getElementById('input-end-date');
    dom.periodSummary = document.getElementById('period-summary');

    dom.duplexButtons = document.querySelectorAll('.duplex-card');
    dom.selectBinding = document.getElementById('select-binding');

    dom.selectStartTime = document.getElementById('select-start-time');
    dom.selectEndTime = document.getElementById('select-end-time');
    dom.selectStep = document.getElementById('select-step');
    dom.slotMetrics = document.getElementById('slot-metrics');

    dom.inputTitle = document.getElementById('input-title');
    dom.themeSwatches = document.getElementById('theme-swatches');
    dom.chkHolidays = document.getElementById('chk-holidays');
    dom.chkWeekNum = document.getElementById('chk-week-num');
    dom.chkAltHours = document.getElementById('chk-alt-hours');
    dom.chkNotes = document.getElementById('chk-notes');

    dom.btnDownloadPdf = document.getElementById('btn-download-pdf');
    dom.btnPrintDirect = document.getElementById('btn-print-direct');

    dom.btnViewSpread = document.getElementById('btn-view-spread');
    dom.btnViewSingle = document.getElementById('btn-view-single');
    dom.btnBindingGuide = document.getElementById('btn-binding-guide');
    dom.btnPrev = document.getElementById('btn-prev');
    dom.btnNext = document.getElementById('btn-next');
    dom.selectNav = document.getElementById('select-nav');

    dom.btnZoomOut = document.getElementById('btn-zoom-out');
    dom.btnZoomIn = document.getElementById('btn-zoom-in');
    dom.btnZoomFit = document.getElementById('btn-zoom-fit');
    dom.zoomLabel = document.getElementById('zoom-label');

    dom.previewViewport = document.getElementById('preview-viewport');
    dom.previewStage = document.getElementById('preview-stage');
    dom.printContainer = document.getElementById('print-container');
    dom.toast = document.getElementById('toast');
  }

  function populateTimeOptions() {
    var startOpts = [];
    for (var m1 = 360; m1 <= 720; m1 += 30) {
      startOpts.push(
        '<option value="' + m1 + '">' + themesMod.formatMinutes(m1) + '</option>'
      );
    }
    dom.selectStartTime.innerHTML = startOpts.join('');

    var endOpts = [];
    for (var m2 = 780; m2 <= 1380; m2 += 30) {
      endOpts.push(
        '<option value="' + m2 + '">' + themesMod.formatMinutes(m2) + '</option>'
      );
    }
    dom.selectEndTime.innerHTML = endOpts.join('');
  }

  function initDatesAndYears() {
    var now = new Date();
    var currYear = now.getFullYear();
    dom.btnPresetYearCurr.textContent = 'Anno ' + currYear;
    dom.btnPresetYearNext.textContent = 'Anno ' + (currYear + 1);

    var range = calendarMod.computePresetRange('next-4-weeks', now);
    state.startDate = range.startIso;
    state.endDate = range.endIso;
  }

  function syncControlsFromState() {
    dom.inputStartDate.value = state.startDate;
    dom.inputEndDate.value = state.endDate;

    var presetBtns = dom.presetButtons.querySelectorAll('.preset-btn');
    for (var i = 0; i < presetBtns.length; i++) {
      presetBtns[i].classList.toggle(
        'active',
        presetBtns[i].getAttribute('data-preset') === state.preset
      );
    }

    for (var d = 0; d < dom.duplexButtons.length; d++) {
      var btn = dom.duplexButtons[d];
      var isActive = btn.getAttribute('data-duplex') === state.config.duplexMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    dom.selectBinding.value = String(state.config.bindingMargin);
    dom.selectStartTime.value = String(state.config.startMinutes);
    dom.selectEndTime.value = String(state.config.endMinutes);
    dom.selectStep.value = String(state.config.stepMinutes);
    dom.inputTitle.value = state.config.headerTitle;

    var themeBtns = dom.themeSwatches.querySelectorAll('.theme-chip');
    for (var t = 0; t < themeBtns.length; t++) {
      themeBtns[t].classList.toggle(
        'active',
        themeBtns[t].getAttribute('data-theme') === state.config.theme
      );
    }

    dom.chkHolidays.checked = state.config.showHolidays;
    dom.chkWeekNum.checked = state.config.showWeekNumber;
    dom.chkAltHours.checked = state.config.alternateHours;
    dom.chkNotes.checked = state.config.showNotes;

    dom.btnViewSpread.classList.toggle('active', state.viewMode === 'spread');
    dom.btnViewSingle.classList.toggle('active', state.viewMode === 'single');

    dom.btnBindingGuide.classList.toggle('active', state.showBindingGuide);
    dom.btnBindingGuide.setAttribute(
      'aria-pressed',
      state.showBindingGuide ? 'true' : 'false'
    );

    var theme = themesMod.getTheme(state.config.theme);
    document.documentElement.style.setProperty('--accent', theme.primary);
    document.documentElement.style.setProperty('--accent-soft', theme.headerBg);
  }

  function recomputeDocument() {
    state.aligned = calendarMod.alignPeriodToWeeks(state.startDate, state.endDate);
    state.pages = calendarMod.buildDocumentPages(
      state.aligned.weeks,
      state.config
    );
    state.spreads = calendarMod.buildSpreads(
      state.pages,
      state.config.duplexMode
    );

    var maxNav =
      state.viewMode === 'spread'
        ? Math.max(0, state.spreads.length - 1)
        : Math.max(0, state.pages.length - 1);
    if (state.navIndex > maxNav) {
      state.navIndex = maxNav;
    }
  }

  function getDisplayedPages() {
    if (state.viewMode === 'spread') {
      var sp = state.spreads[state.navIndex];
      return sp ? sp.pages : [];
    }
    var pg = state.pages[state.navIndex];
    return pg ? [pg] : [];
  }

  function computeFitZoom() {
    var vw = dom.previewViewport.clientWidth;
    var vh = dom.previewViewport.clientHeight;
    if (!vw || !vh) return 0.62;

    var shown = getDisplayedPages();
    var cols = Math.max(1, shown.length);
    var availW = Math.max(240, vw - 64 - (cols - 1) * 24);
    var availH = Math.max(260, vh - 86);

    var sheetWpx = 210 * PX_PER_MM * cols;
    var sheetHpx = 297 * PX_PER_MM;

    var scaleW = availW / sheetWpx;
    var scaleH = availH / sheetHpx;
    var best = Math.min(scaleW, scaleH);
    best = Math.max(0.28, Math.min(1.1, best));
    return Math.round(best * 50) / 50;
  }

  function applyZoom(zoomVal) {
    state.zoom = Math.max(0.25, Math.min(1.4, zoomVal));
    document.documentElement.style.setProperty(
      '--sheet-scale',
      state.zoom.toFixed(3)
    );
    dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
  }

  function renderSummaryAndMetrics() {
    var aligned = state.aligned;
    var weeksCount = aligned.weeks.length;
    var pagesCount = state.pages.length;
    var sheetsCount = Math.ceil(pagesCount / 2);

    var warnHtml = aligned.wasCapped
      ? '<div class="summary-card-warn">Periodo limitato a 104 settimane (2 anni) per garantire prestazioni fluide.</div>'
      : '';

    var extras =
      state.config.duplexMode === 'libro' ? ' (incl. Copertina e Note)' : '';

    dom.periodSummary.innerHTML =
      '<div class="summary-card-range">' +
      aligned.periodLabel +
      '</div>' +
      '<div class="summary-card-meta">' +
      weeksCount +
      (weeksCount === 1 ? ' settimana' : ' settimane') +
      ' · ' +
      pagesCount +
      ' pagine A4 · ' +
      sheetsCount +
      (sheetsCount === 1 ? ' foglio fronte/retro' : ' fogli fronte/retro') +
      extras +
      '</div>' +
      warnHtml;

    var sampleLayout = themesMod.computeLayout(state.config, 1);
    var rowStr = sampleLayout.rowH.toFixed(1).replace('.', ',');
    dom.slotMetrics.textContent =
      sampleLayout.slotCount + ' riquadri · ' + rowStr + ' mm ciascuno';
  }

  function renderNavDropdown() {
    var options = [];
    if (state.viewMode === 'spread') {
      for (var i = 0; i < state.spreads.length; i++) {
        options.push(
          '<option value="' +
            i +
            '"' +
            (i === state.navIndex ? ' selected' : '') +
            '>' +
            state.spreads[i].label +
            '</option>'
        );
      }
    } else {
      for (var p = 0; p < state.pages.length; p++) {
        var pg = state.pages[p];
        var lbl = 'Pag. ' + pg.pageNumber + ' / ' + pg.totalPages + ' · ' + pg.sideLabel;
        if (pg.week) {
          lbl += ' (Sett. ' + pg.week.isoWeek + ')';
        }
        options.push(
          '<option value="' +
            p +
            '"' +
            (p === state.navIndex ? ' selected' : '') +
            '>' +
            lbl +
            '</option>'
        );
      }
    }
    dom.selectNav.innerHTML = options.join('');

    var maxIdx =
      state.viewMode === 'spread'
        ? state.spreads.length - 1
        : state.pages.length - 1;
    dom.btnPrev.disabled = state.navIndex <= 0;
    dom.btnNext.disabled = state.navIndex >= maxIdx;
  }

  function renderStage() {
    var shown = getDisplayedPages();
    if (state.autoFit) {
      applyZoom(computeFitZoom());
    } else {
      applyZoom(state.zoom);
    }

    var cards = [];
    for (var i = 0; i < shown.length; i++) {
      cards.push(
        previewMod.renderPreviewPageCard(shown[i], state.config, {
          showBindingGuide: state.showBindingGuide
        })
      );
    }
    dom.previewStage.innerHTML = cards.join('');
  }

  function refreshAll() {
    syncControlsFromState();
    recomputeDocument();
    renderSummaryAndMetrics();
    renderNavDropdown();
    renderStage();
    savePrefs();
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      dom.toast.classList.remove('visible');
    }, 3200);
  }

  function populatePrintContainer() {
    if (!state.pages || state.pages.length === 0) return;
    dom.printContainer.innerHTML = previewMod.renderPrintPagesHtml(
      state.pages,
      state.config
    );
  }

  function clearPrintContainer() {
    dom.printContainer.innerHTML = '';
  }

  function handleDownloadPdf() {
    if (!state.pages || state.pages.length === 0) return;
    dom.btnDownloadPdf.disabled = true;
    try {
      var res = pdfMod.generateAgendaPdf(state.pages, state.config);
      var filename =
        'Agenda_A4_' +
        state.aligned.alignedStartIso +
        '_' +
        state.aligned.alignedEndIso +
        '.pdf';

      var url = URL.createObjectURL(res.blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);

      showToast('PDF pronto: ' + filename + ' (' + res.pageCount + ' pagine)');
    } catch (err) {
      showToast('Errore nella generazione del PDF');
      if (root.console && root.console.error) {
        root.console.error(err);
      }
    } finally {
      dom.btnDownloadPdf.disabled = false;
    }
  }

  function handleDirectPrint() {
    populatePrintContainer();
    setTimeout(function () {
      root.print();
    }, 40);
  }

  function stepNav(delta) {
    var maxIdx =
      state.viewMode === 'spread'
        ? state.spreads.length - 1
        : state.pages.length - 1;
    var next = Math.max(0, Math.min(maxIdx, state.navIndex + delta));
    if (next !== state.navIndex) {
      state.navIndex = next;
      renderNavDropdown();
      renderStage();
    }
  }

  function bindEvents() {
    dom.presetButtons.addEventListener('click', function (e) {
      var btn = e.target.closest('.preset-btn');
      if (!btn) return;
      var preset = btn.getAttribute('data-preset');
      var range = calendarMod.computePresetRange(preset, new Date());
      state.preset = preset;
      state.startDate = range.startIso;
      state.endDate = range.endIso;
      state.navIndex = 0;
      refreshAll();
    });

    function onManualDateChange() {
      var s = dom.inputStartDate.value;
      var en = dom.inputEndDate.value;
      if (!s || !en) return;
      state.preset = 'custom';
      state.startDate = s;
      state.endDate = en;
      state.navIndex = 0;
      refreshAll();
    }

    dom.inputStartDate.addEventListener('change', onManualDateChange);
    dom.inputEndDate.addEventListener('change', onManualDateChange);

    for (var i = 0; i < dom.duplexButtons.length; i++) {
      dom.duplexButtons[i].addEventListener('click', function () {
        var mode = this.getAttribute('data-duplex');
        if (mode !== state.config.duplexMode) {
          state.config.duplexMode = mode;
          state.navIndex = 0;
          refreshAll();
        }
      });
    }

    dom.selectBinding.addEventListener('change', function () {
      state.config.bindingMargin = Number(this.value);
      refreshAll();
    });

    dom.selectStartTime.addEventListener('change', function () {
      var val = Number(this.value);
      state.config.startMinutes = val;
      if (state.config.endMinutes <= val) {
        state.config.endMinutes = Math.min(1380, val + 60);
      }
      refreshAll();
    });

    dom.selectEndTime.addEventListener('change', function () {
      var val = Number(this.value);
      state.config.endMinutes = val;
      if (state.config.startMinutes >= val) {
        state.config.startMinutes = Math.max(360, val - 60);
      }
      refreshAll();
    });

    dom.selectStep.addEventListener('change', function () {
      state.config.stepMinutes = Number(this.value);
      refreshAll();
    });

    dom.inputTitle.addEventListener('input', function () {
      state.config.headerTitle = this.value;
      renderStage();
      savePrefs();
    });

    dom.themeSwatches.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-chip');
      if (!btn) return;
      state.config.theme = btn.getAttribute('data-theme');
      refreshAll();
    });

    dom.chkHolidays.addEventListener('change', function () {
      state.config.showHolidays = this.checked;
      refreshAll();
    });
    dom.chkWeekNum.addEventListener('change', function () {
      state.config.showWeekNumber = this.checked;
      refreshAll();
    });
    dom.chkAltHours.addEventListener('change', function () {
      state.config.alternateHours = this.checked;
      refreshAll();
    });
    dom.chkNotes.addEventListener('change', function () {
      state.config.showNotes = this.checked;
      refreshAll();
    });

    dom.btnViewSpread.addEventListener('click', function () {
      if (state.viewMode !== 'spread') {
        state.viewMode = 'spread';
        state.navIndex = Math.floor(state.navIndex / 2);
        refreshAll();
      }
    });

    dom.btnViewSingle.addEventListener('click', function () {
      if (state.viewMode !== 'single') {
        var firstShown = getDisplayedPages()[0];
        state.viewMode = 'single';
        state.navIndex = firstShown ? firstShown.pageNumber - 1 : 0;
        refreshAll();
      }
    });

    dom.btnBindingGuide.addEventListener('click', function () {
      state.showBindingGuide = !state.showBindingGuide;
      refreshAll();
    });

    dom.btnPrev.addEventListener('click', function () {
      stepNav(-1);
    });
    dom.btnNext.addEventListener('click', function () {
      stepNav(1);
    });
    dom.selectNav.addEventListener('change', function () {
      state.navIndex = Number(this.value) || 0;
      renderNavDropdown();
      renderStage();
    });

    dom.btnZoomOut.addEventListener('click', function () {
      state.autoFit = false;
      applyZoom(state.zoom - 0.08);
    });
    dom.btnZoomIn.addEventListener('click', function () {
      state.autoFit = false;
      applyZoom(state.zoom + 0.08);
    });
    dom.btnZoomFit.addEventListener('click', function () {
      state.autoFit = true;
      applyZoom(computeFitZoom());
    });

    dom.btnDownloadPdf.addEventListener('click', handleDownloadPdf);
    dom.btnPrintDirect.addEventListener('click', handleDirectPrint);

    root.addEventListener('beforeprint', populatePrintContainer);
    root.addEventListener('afterprint', clearPrintContainer);

    root.addEventListener('resize', function () {
      if (state.autoFit) {
        applyZoom(computeFitZoom());
      }
    });

    document.addEventListener('keydown', function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepNav(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepNav(1);
      }
    });
  }

  function init() {
    cacheDom();
    populateTimeOptions();
    loadSavedPrefs();
    initDatesAndYears();
    bindEvents();
    refreshAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
