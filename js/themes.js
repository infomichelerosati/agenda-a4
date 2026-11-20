(function (root) {
  'use strict';

  var THEMES = {
    blu: {
      id: 'blu',
      name: 'Blu Notte',
      swatch: '#1e3a5f',
      primary: '#1e3a5f',
      primaryText: '#ffffff',
      headerBg: '#f3f6fa',
      accentText: '#1e3a5f',
      holidayBg: '#eef3f9',
      holidayText: '#9a3412',
      altRowBg: '#f8fafc',
      borderOuter: '#1e3a5f',
      borderHour: '#94a3b8',
      borderHalf: '#cbd5e1',
      borderQuarter: '#e2e8f0',
      timeHourText: '#0f172a',
      timeSubText: '#475569',
      mutedText: '#64748b',
      paperBg: '#ffffff'
    },
    grafite: {
      id: 'grafite',
      name: 'Grafite (B/N)',
      swatch: '#1f2937',
      primary: '#1f2937',
      primaryText: '#ffffff',
      headerBg: '#f3f4f6',
      accentText: '#111827',
      holidayBg: '#ebebed',
      holidayText: '#111827',
      altRowBg: '#f7f7f8',
      borderOuter: '#111827',
      borderHour: '#6b7280',
      borderHalf: '#9ca3af',
      borderQuarter: '#d1d5db',
      timeHourText: '#111827',
      timeSubText: '#374151',
      mutedText: '#4b5563',
      paperBg: '#ffffff'
    },
    salvia: {
      id: 'salvia',
      name: 'Verde Salvia',
      swatch: '#264d43',
      primary: '#264d43',
      primaryText: '#ffffff',
      headerBg: '#f2f7f5',
      accentText: '#264d43',
      holidayBg: '#eaf3f0',
      holidayText: '#9a3412',
      altRowBg: '#f7faf9',
      borderOuter: '#264d43',
      borderHour: '#94a8a2',
      borderHalf: '#c5d3ce',
      borderQuarter: '#e0e9e6',
      timeHourText: '#132a24',
      timeSubText: '#425e56',
      mutedText: '#5e766f',
      paperBg: '#ffffff'
    },
    bordeaux: {
      id: 'bordeaux',
      name: 'Bordeaux',
      swatch: '#6b2138',
      primary: '#6b2138',
      primaryText: '#ffffff',
      headerBg: '#faf3f5',
      accentText: '#6b2138',
      holidayBg: '#f6eaee',
      holidayText: '#881337',
      altRowBg: '#fcf8f9',
      borderOuter: '#6b2138',
      borderHour: '#b89aa3',
      borderHalf: '#d8c5cb',
      borderQuarter: '#ece1e4',
      timeHourText: '#2d1019',
      timeSubText: '#63434d',
      mutedText: '#7a5c65',
      paperBg: '#ffffff'
    }
  };

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatMinutes(totalMinutes) {
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    return pad2(h) + ':' + pad2(m);
  }

  function getTheme(themeId) {
    return THEMES[themeId] || THEMES.blu;
  }

  function buildTimeSlots(startMinutes, endMinutes, stepMinutes) {
    var start = Number(startMinutes);
    var end = Number(endMinutes);
    var step = Number(stepMinutes);

    if (!isFinite(start)) start = 450;
    if (!isFinite(end)) end = 1200;
    if (!isFinite(step) || step <= 0) step = 15;
    if (end <= start) end = start + step;

    var slots = [];
    for (var m = start; m <= end; m += step) {
      var hour = Math.floor(m / 60);
      var minute = m % 60;
      slots.push({
        minutes: m,
        hour: hour,
        minute: minute,
        label: formatMinutes(m),
        isHour: minute === 0,
        isHalf: minute === 30,
        isQuarter: minute === 15 || minute === 45,
        hourBlockAlt: hour % 2 === 0
      });
    }
    return slots;
  }

  /**
   * Computes exact millimeter page coordinates shared by both the PDF vector
   * engine and the HTML preview/print renderer for 1:1 fidelity.
   */
  function computeLayout(config, pageNumber) {
    var cfg = config || {};
    var pageW = 210;
    var pageH = 297;
    var marginTop = 9;
    var marginBottom = 7.5;

    var bindingMargin = Number(cfg.bindingMargin);
    if (!isFinite(bindingMargin) || bindingMargin < 6) {
      bindingMargin = 15;
    }
    var outerMargin = bindingMargin <= 10 ? bindingMargin : 8;

    var isEven = Number(pageNumber) % 2 === 0;
    var marginLeft = isEven ? outerMargin : bindingMargin;
    var marginRight = isEven ? bindingMargin : outerMargin;
    var bindingSide = isEven ? 'right' : 'left';

    var contentX = marginLeft;
    var contentW = pageW - marginLeft - marginRight;

    var headerY = marginTop;
    var headerH = 9.5;
    var dayHeaderY = headerY + headerH + 1.5; // 20.0 mm
    var dayHeaderH = 11.5;
    var gridY = dayHeaderY + dayHeaderH; // 31.5 mm

    var footerH = 4.0;
    var footerY = pageH - marginBottom - footerH; // 285.5 mm
    var footerGap = 1.6;

    var showNotes = Boolean(cfg.showNotes);
    var notesH = showNotes ? 14 : 0;
    var notesGap = showNotes ? 2.0 : 0;
    var notesY = showNotes ? footerY - 1.5 - notesH : footerY - footerGap;

    var gridBottom = showNotes ? notesY - notesGap : footerY - footerGap;
    var gridH = gridBottom - gridY; // 252.4 mm without notes (~4.95 mm/slot)

    var timeColW = 13.5;
    var dayColW = (contentW - timeColW) / 3;

    var startMinutes = cfg.startMinutes !== undefined ? Number(cfg.startMinutes) : 450;
    var endMinutes = cfg.endMinutes !== undefined ? Number(cfg.endMinutes) : 1200;
    var stepMinutes = cfg.stepMinutes !== undefined ? Number(cfg.stepMinutes) : 15;

    var slots = buildTimeSlots(startMinutes, endMinutes, stepMinutes);
    var rowH = slots.length > 0 ? gridH / slots.length : gridH;

    return {
      pageW: pageW,
      pageH: pageH,
      marginTop: marginTop,
      marginBottom: marginBottom,
      marginLeft: marginLeft,
      marginRight: marginRight,
      bindingMargin: bindingMargin,
      outerMargin: outerMargin,
      bindingSide: bindingSide,
      isEven: isEven,
      contentX: contentX,
      contentW: contentW,
      headerY: headerY,
      headerH: headerH,
      dayHeaderY: dayHeaderY,
      dayHeaderH: dayHeaderH,
      gridY: gridY,
      gridH: gridH,
      gridBottom: gridBottom,
      timeColW: timeColW,
      dayColW: dayColW,
      showNotes: showNotes,
      notesY: notesY,
      notesH: notesH,
      footerY: footerY,
      footerH: footerH,
      startMinutes: startMinutes,
      endMinutes: endMinutes,
      stepMinutes: stepMinutes,
      endLabel: formatMinutes(endMinutes > startMinutes ? endMinutes : startMinutes + stepMinutes),
      slots: slots,
      slotCount: slots.length,
      rowH: rowH
    };
  }

  var api = {
    THEMES: THEMES,
    getTheme: getTheme,
    formatMinutes: formatMinutes,
    buildTimeSlots: buildTimeSlots,
    computeLayout: computeLayout
  };

  root.AgendaApp = root.AgendaApp || {};
  root.AgendaApp.themes = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
