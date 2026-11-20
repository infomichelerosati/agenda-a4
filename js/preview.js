(function (root) {
  'use strict';

  var themesMod = root.AgendaApp && root.AgendaApp.themes;

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildBindingGuideHtml(layout) {
    var isLeft = layout.bindingSide === 'left';
    var gutterW = layout.bindingMargin;
    var holesHtml = '';
    var holePositions = [32, 68, 104, 148.5, 193, 229, 265];
    for (var i = 0; i < holePositions.length; i++) {
      holesHtml +=
        '<span class="binding-hole" style="top:' + holePositions[i] + 'mm;"></span>';
    }

    return (
      '<div class="binding-guide binding-' +
      layout.bindingSide +
      '" style="width:' +
      gutterW +
      'mm;' +
      (isLeft ? 'left:0;' : 'right:0;') +
      '">' +
      holesHtml +
      '<span class="binding-label">Rilegatura · ' +
      gutterW +
      ' mm</span>' +
      '</div>'
    );
  }

  function renderFooterHtml(page, layout, theme) {
    var pageText = 'Pag. ' + page.pageNumber + ' / ' + page.totalPages;
    var infoText =
      page.sideLabel + (page.periodLabel ? '  ·  ' + page.periodLabel : '');

    var leftHtml = layout.isEven
      ? '<span class="sheet-footer-page">' + escapeHtml(pageText) + '</span>'
      : '<span class="sheet-footer-info">' + escapeHtml(infoText) + '</span>';

    var rightHtml = layout.isEven
      ? '<span class="sheet-footer-info">' + escapeHtml(infoText) + '</span>'
      : '<span class="sheet-footer-page">' + escapeHtml(pageText) + '</span>';

    return (
      '<div class="sheet-footer" style="top:' +
      layout.footerY +
      'mm;left:' +
      layout.contentX +
      'mm;width:' +
      layout.contentW +
      'mm;height:' +
      layout.footerH +
      'mm;color:' +
      theme.mutedText +
      ';">' +
      leftHtml +
      rightHtml +
      '</div>'
    );
  }

  function renderWeekHalfHtml(page, config, theme, layout) {
    var titleText =
      config.headerTitle && config.headerTitle.trim()
        ? config.headerTitle.trim()
        : '';

    var weekPillHtml =
      config.showWeekNumber && page.week
        ? '<span class="sheet-week-pill" style="background:' +
          theme.primary +
          ';color:' +
          theme.primaryText +
          ';">Sett. ' +
          page.week.isoWeek +
          '</span>'
        : '';

    var headerHtml =
      '<div class="sheet-header" style="top:' +
      layout.headerY +
      'mm;left:' +
      layout.contentX +
      'mm;width:' +
      layout.contentW +
      'mm;height:' +
      layout.headerH +
      'mm;background:' +
      theme.headerBg +
      ';border-bottom:0.55mm solid ' +
      theme.primary +
      ';">' +
      '<span class="sheet-month-title" style="color:' +
      theme.primary +
      ';">' +
      escapeHtml(page.headerMonthLabel) +
      '</span>' +
      '<div class="sheet-header-right">' +
      (titleText
        ? '<span class="sheet-custom-title" style="color:' +
          theme.mutedText +
          ';">' +
          escapeHtml(titleText) +
          '</span>'
        : '') +
      weekPillHtml +
      '</div>' +
      '</div>';

    // Day headers + grid unified table box
    var tableH = layout.dayHeaderH + layout.gridH;
    var dayHeadersHtml =
      '<div class="sheet-ora-head" style="width:' +
      layout.timeColW +
      'mm;background:' +
      theme.primary +
      ';color:' +
      theme.primaryText +
      ';border-right:0.35mm solid ' +
      theme.borderOuter +
      ';">ORA</div>';

    for (var d = 0; d < page.days.length; d++) {
      var day = page.days[d];
      var isHoliday = Boolean(config.showHolidays && day.holiday);
      var bg = isHoliday ? theme.holidayBg : theme.headerBg;
      var dayColor = isHoliday ? theme.holidayText : theme.accentText;
      var numColor = isHoliday ? theme.holidayText : theme.timeHourText;
      var borderRight =
        d < 2 ? 'border-right:0.26mm solid ' + theme.borderHour + ';' : '';
      var topBar = isHoliday
        ? 'box-shadow:inset 0 1mm 0 0 ' + theme.holidayText + ';'
        : '';

      dayHeadersHtml +=
        '<div class="sheet-day-head" style="background:' +
        bg +
        ';' +
        borderRight +
        topBar +
        '">' +
        '<div class="sheet-day-weekday" style="color:' +
        dayColor +
        ';">' +
        escapeHtml(day.weekdayName.toUpperCase()) +
        '</div>' +
        '<div class="sheet-day-bottom">' +
        '<span class="sheet-day-num-wrap">' +
        '<strong class="sheet-day-num" style="color:' +
        numColor +
        ';">' +
        day.dayNum +
        '</strong>' +
        '<span class="sheet-day-month" style="color:' +
        theme.mutedText +
        ';">' +
        escapeHtml(day.monthShort) +
        '</span>' +
        '</span>' +
        (isHoliday
          ? '<span class="sheet-holiday-tag" style="color:' +
            theme.holidayText +
            ';">' +
            escapeHtml(day.holiday) +
            '</span>'
          : '') +
        '</div>' +
        '</div>';
    }

    // Time slots grid
    var rowsHtml = '';
    var slots = layout.slots;
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      var rowBg =
        config.alternateHours && slot.hourBlockAlt ? theme.altRowBg : '#ffffff';

      var topBorderStyle = '';
      if (s > 0) {
        if (slot.isHour) {
          topBorderStyle = 'border-top:0.30mm solid ' + theme.borderHour + ';';
        } else if (slot.isHalf) {
          topBorderStyle = 'border-top:0.20mm solid ' + theme.borderHalf + ';';
        } else {
          topBorderStyle = 'border-top:0.12mm solid ' + theme.borderQuarter + ';';
        }
      }

      var timeClass = slot.isHour
        ? 'slot-time-hour'
        : slot.isHalf
        ? 'slot-time-half'
        : 'slot-time-quarter';
      var timeColor = slot.isHour
        ? theme.timeHourText
        : slot.isHalf
        ? theme.timeSubText
        : theme.mutedText;

      var fontSizeOverride =
        layout.rowH < 4.2 && slot.isHour ? 'font-size:6.5pt;' : '';

      rowsHtml +=
        '<div class="sheet-grid-row" style="background:' +
        rowBg +
        ';' +
        topBorderStyle +
        '">' +
        '<div class="sheet-time-cell ' +
        timeClass +
        '" style="width:' +
        layout.timeColW +
        'mm;color:' +
        timeColor +
        ';border-right:0.35mm solid ' +
        theme.borderOuter +
        ';' +
        fontSizeOverride +
        '">' +
        slot.label +
        '</div>' +
        '<div class="sheet-slot-cell" style="border-right:0.26mm solid ' +
        theme.borderHour +
        ';"></div>' +
        '<div class="sheet-slot-cell" style="border-right:0.26mm solid ' +
        theme.borderHour +
        ';"></div>' +
        '<div class="sheet-slot-cell"></div>' +
        '</div>';
    }

    var tableHtml =
      '<div class="sheet-table" style="top:' +
      layout.dayHeaderY +
      'mm;left:' +
      layout.contentX +
      'mm;width:' +
      layout.contentW +
      'mm;height:' +
      tableH +
      'mm;border:0.42mm solid ' +
      theme.borderOuter +
      ';">' +
      '<div class="sheet-day-row" style="height:' +
      layout.dayHeaderH +
      'mm;border-bottom:0.35mm solid ' +
      theme.borderOuter +
      ';">' +
      dayHeadersHtml +
      '</div>' +
      '<div class="sheet-grid-body" style="height:' +
      layout.gridH +
      'mm;grid-template-rows:repeat(' +
      slots.length +
      ', 1fr);">' +
      rowsHtml +
      '</div>' +
      '</div>';

    var notesHtml = '';
    if (layout.showNotes) {
      notesHtml =
        '<div class="sheet-notes-box" style="top:' +
        layout.notesY +
        'mm;left:' +
        layout.contentX +
        'mm;width:' +
        layout.contentW +
        'mm;height:' +
        layout.notesH +
        'mm;background:' +
        theme.headerBg +
        ';border:0.28mm solid ' +
        theme.borderHour +
        ';">' +
        '<span class="sheet-notes-label" style="color:' +
        theme.accentText +
        ';">NOTE</span>' +
        '<span class="sheet-notes-line sheet-notes-line-1" style="border-bottom:0.16mm solid ' +
        theme.borderHalf +
        ';"></span>' +
        '<span class="sheet-notes-line sheet-notes-line-2" style="border-bottom:0.16mm solid ' +
        theme.borderHalf +
        ';"></span>' +
        '</div>';
    }

    return (
      headerHtml +
      tableHtml +
      notesHtml +
      renderFooterHtml(page, layout, theme)
    );
  }

  function renderCoverHtml(page, config, theme, layout) {
    var x0 = layout.contentX;
    var w = layout.contentW;
    var y0 = layout.marginTop;
    var h = layout.pageH - layout.marginTop - layout.marginBottom - layout.footerH - 4;
    var title =
      (config.headerTitle && config.headerTitle.trim()) ||
      'Agenda Appuntamenti';
    var startStr = themesMod.formatMinutes(layout.startMinutes);
    var endStr = themesMod.formatMinutes(layout.endMinutes);
    var summaryLine =
      page.weeksCount +
      (page.weeksCount === 1 ? ' settimana' : ' settimane') +
      '  ·  Orario ' +
      startStr +
      ' – ' +
      endStr +
      '  ·  Intervallo ' +
      layout.stepMinutes +
      ' min';

    return (
      '<div class="sheet-cover-outer" style="top:' +
      y0 +
      'mm;left:' +
      x0 +
      'mm;width:' +
      w +
      'mm;height:' +
      h +
      'mm;border:0.65mm solid ' +
      theme.primary +
      ';">' +
      '<div class="sheet-cover-inner" style="border:0.22mm solid ' +
      theme.borderHalf +
      ';">' +
      '<div class="sheet-cover-band" style="background:' +
      theme.headerBg +
      ';border-bottom:0.6mm solid ' +
      theme.primary +
      ';color:' +
      theme.accentText +
      ';">AGENDA SETTIMANALE  ·  LUNEDÌ – SABATO</div>' +
      '<div class="sheet-cover-center">' +
      '<h1 class="sheet-cover-title" style="color:' +
      theme.primary +
      ';">' +
      escapeHtml(title) +
      '</h1>' +
      '<div class="sheet-cover-rule" style="background:' +
      theme.primary +
      ';"></div>' +
      '<div class="sheet-cover-period" style="color:' +
      theme.timeHourText +
      ';">' +
      escapeHtml(page.periodLabel) +
      '</div>' +
      '<div class="sheet-cover-meta" style="color:' +
      theme.mutedText +
      ';">' +
      escapeHtml(summaryLine) +
      '</div>' +
      '</div>' +
      '<div class="sheet-cover-owner" style="background:' +
      theme.headerBg +
      ';border:0.25mm solid ' +
      theme.borderHalf +
      ';">' +
      '<div class="sheet-cover-owner-label" style="color:' +
      theme.accentText +
      ';">STUDIO / TITOLARE</div>' +
      '<div class="sheet-cover-owner-line" style="border-bottom:0.2mm solid ' +
      theme.borderHour +
      ';"></div>' +
      '<div class="sheet-cover-owner-line" style="border-bottom:0.2mm solid ' +
      theme.borderHour +
      ';"></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      renderFooterHtml(page, layout, theme)
    );
  }

  function renderNotesPageHtml(page, config, theme, layout) {
    var titleText =
      config.headerTitle && config.headerTitle.trim()
        ? config.headerTitle.trim()
        : '';

    var linesHtml = '';
    var startY = layout.dayHeaderY + 3;
    var endY = layout.footerY - 4;
    for (var ly = startY; ly <= endY; ly += 7) {
      linesHtml +=
        '<div class="sheet-lined-row" style="top:' +
        ly +
        'mm;left:' +
        layout.contentX +
        'mm;width:' +
        layout.contentW +
        'mm;border-bottom:0.2mm solid ' +
        theme.borderHalf +
        ';"></div>';
    }

    return (
      '<div class="sheet-header" style="top:' +
      layout.headerY +
      'mm;left:' +
      layout.contentX +
      'mm;width:' +
      layout.contentW +
      'mm;height:' +
      layout.headerH +
      'mm;background:' +
      theme.headerBg +
      ';border-bottom:0.55mm solid ' +
      theme.primary +
      ';">' +
      '<span class="sheet-month-title" style="color:' +
      theme.primary +
      ';">Note e Appunti</span>' +
      (titleText
        ? '<span class="sheet-custom-title" style="color:' +
          theme.mutedText +
          ';">' +
          escapeHtml(titleText) +
          '</span>'
        : '') +
      '</div>' +
      linesHtml +
      renderFooterHtml(page, layout, theme)
    );
  }

  function renderSheetInnerHtml(page, config, options) {
    var opts = options || {};
    var theme = themesMod.getTheme(config.theme);
    var layout = themesMod.computeLayout(config, page.pageNumber);
    var bodyHtml;

    if (page.type === 'cover') {
      bodyHtml = renderCoverHtml(page, config, theme, layout);
    } else if (page.type === 'notes') {
      bodyHtml = renderNotesPageHtml(page, config, theme, layout);
    } else {
      bodyHtml = renderWeekHalfHtml(page, config, theme, layout);
    }

    var guideHtml = opts.showBindingGuide ? buildBindingGuideHtml(layout) : '';
    return guideHtml + bodyHtml;
  }

  /**
   * Renders a preview card (badge + scaled A4 sheet frame) for the workspace stage.
   */
  function renderPreviewPageCard(page, config, options) {
    var inner = renderSheetInnerHtml(page, config, options);
    var badgeLabel =
      'PAG. ' + page.pageNumber + ' · ' + page.sideLabel.toUpperCase();

    return (
      '<div class="preview-card">' +
      '<div class="preview-card-badge">' +
      '<span class="badge-dot badge-' +
      page.side +
      '"></span>' +
      '<span>' +
      escapeHtml(badgeLabel) +
      '</span>' +
      '</div>' +
      '<div class="sheet-frame">' +
      '<div class="a4-sheet">' +
      inner +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  /**
   * Renders raw unscaled .a4-sheet elements for @media print.
   */
  function renderPrintPagesHtml(pages, config) {
    var html = [];
    for (var i = 0; i < pages.length; i++) {
      var isLast = i === pages.length - 1;
      html.push(
        '<div class="a4-sheet print-sheet' +
          (isLast ? ' print-sheet-last' : '') +
          '">' +
          renderSheetInnerHtml(pages[i], config, { showBindingGuide: false }) +
          '</div>'
      );
    }
    return html.join('');
  }

  var api = {
    renderSheetInnerHtml: renderSheetInnerHtml,
    renderPreviewPageCard: renderPreviewPageCard,
    renderPrintPagesHtml: renderPrintPagesHtml
  };

  root.AgendaApp = root.AgendaApp || {};
  root.AgendaApp.preview = api;
})(typeof window !== 'undefined' ? window : globalThis);
