(function (root) {
  'use strict';

  var holidaysMod =
    (root.AgendaApp && root.AgendaApp.holidays) ||
    (typeof require === 'function' ? require('./holidays.js') : null);

  var MONTHS_IT = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre'
  ];

  var MONTHS_SHORT_IT = [
    'Gen',
    'Feb',
    'Mar',
    'Apr',
    'Mag',
    'Giu',
    'Lug',
    'Ago',
    'Set',
    'Ott',
    'Nov',
    'Dic'
  ];

  // Monday = 0 .. Saturday = 5
  var WEEKDAYS_IT = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato'
  ];

  var MAX_WEEKS = 104;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /**
   * Parses a YYYY-MM-DD string into a local noon Date (immune to DST shifts).
   */
  function parseLocalDate(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return null;
    var parts = isoStr.split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }
    var date = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  function formatIsoDate(date) {
    return (
      date.getFullYear() +
      '-' +
      pad2(date.getMonth() + 1) +
      '-' +
      pad2(date.getDate())
    );
  }

  function formatItalianDateShort(date) {
    return (
      date.getDate() +
      ' ' +
      MONTHS_SHORT_IT[date.getMonth()] +
      ' ' +
      date.getFullYear()
    );
  }

  function addDays(date, days) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + days,
      12,
      0,
      0,
      0
    );
  }

  /**
   * Computes ISO-8601 week number and ISO week-year for a local Date.
   */
  function getISOWeek(date) {
    var target = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    var dayNr = (target.getUTCDay() + 6) % 7; // Monday = 0 .. Sunday = 6
    target.setUTCDate(target.getUTCDate() - dayNr + 3); // Nearest Thursday
    var isoYear = target.getUTCFullYear();
    var firstThursday = new Date(Date.UTC(isoYear, 0, 4));
    var firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
    var week =
      1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
    return { week: week, year: isoYear };
  }

  function buildDayObject(date, weekdayIndex) {
    var mIdx = date.getMonth();
    var holiday = holidaysMod ? holidaysMod.getHolidayForDate(date) : null;
    return {
      date: date,
      iso: formatIsoDate(date),
      dayNum: date.getDate(),
      monthIndex: mIdx,
      monthName: MONTHS_IT[mIdx],
      monthShort: MONTHS_SHORT_IT[mIdx],
      year: date.getFullYear(),
      weekdayIndex: weekdayIndex,
      weekdayName: WEEKDAYS_IT[weekdayIndex],
      holiday: holiday
    };
  }

  function formatHeaderMonthLabel(days) {
    if (!days || days.length === 0) return '';
    var first = days[0];
    var last = days[days.length - 1];
    if (first.year === last.year) {
      if (first.monthIndex === last.monthIndex) {
        return first.monthName + ' ' + first.year;
      }
      return first.monthName + ' / ' + last.monthName + ' ' + first.year;
    }
    return (
      first.monthName +
      ' ' +
      first.year +
      ' / ' +
      last.monthName +
      ' ' +
      last.year
    );
  }

  /**
   * Aligns an arbitrary date range to full Monday-Saturday working weeks.
   */
  function alignPeriodToWeeks(startDateStr, endDateStr) {
    var start = parseLocalDate(startDateStr);
    var end = parseLocalDate(endDateStr);
    if (!start || !end) {
      var today = new Date();
      var fallback = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0,
        0
      );
      start = start || fallback;
      end = end || fallback;
    }

    if (start.getTime() > end.getTime()) {
      var tmp = start;
      start = end;
      end = tmp;
    }

    // Align start to Monday: Sunday advances +1 day to Monday, Mon-Sat rewinds to Monday.
    var startDow = start.getDay(); // 0=Sun, 1=Mon..6=Sat
    var alignedStart =
      startDow === 0 ? addDays(start, 1) : addDays(start, -(startDow - 1));

    // Align end to Saturday: Sunday steps back -1 to Saturday unless before alignedStart.
    var endDow = end.getDay();
    var alignedEnd;
    if (endDow === 0) {
      var prevSat = addDays(end, -1);
      alignedEnd =
        prevSat.getTime() >= alignedStart.getTime()
          ? prevSat
          : addDays(alignedStart, 5);
    } else {
      alignedEnd = addDays(end, 6 - endDow);
    }

    if (alignedEnd.getTime() < alignedStart.getTime()) {
      alignedEnd = addDays(alignedStart, 5);
    }

    var weeks = [];
    var cursor = alignedStart;
    var wasCapped = false;

    while (cursor.getTime() <= alignedEnd.getTime()) {
      if (weeks.length >= MAX_WEEKS) {
        wasCapped = true;
        break;
      }

      var days = [];
      for (var d = 0; d < 6; d++) {
        days.push(buildDayObject(addDays(cursor, d), d));
      }

      var isoInfo = getISOWeek(cursor);
      var monday = days[0];
      var saturday = days[5];

      weeks.push({
        weekIndex: weeks.length,
        isoWeek: isoInfo.week,
        isoYear: isoInfo.year,
        monday: monday,
        saturday: saturday,
        frontDays: days.slice(0, 3),
        backDays: days.slice(3, 6),
        monthLabel: formatHeaderMonthLabel(days),
        rangeLabel:
          monday.dayNum +
          ' ' +
          monday.monthShort +
          ' – ' +
          saturday.dayNum +
          ' ' +
          saturday.monthShort +
          ' ' +
          saturday.year
      });

      cursor = addDays(cursor, 7);
    }

    var actualEndDate =
      weeks.length > 0 ? weeks[weeks.length - 1].saturday.date : alignedEnd;

    return {
      alignedStart: alignedStart,
      alignedEnd: actualEndDate,
      alignedStartIso: formatIsoDate(alignedStart),
      alignedEndIso: formatIsoDate(actualEndDate),
      periodLabel:
        formatItalianDateShort(alignedStart) +
        ' – ' +
        formatItalianDateShort(actualEndDate),
      weeks: weeks,
      wasCapped: wasCapped
    };
  }

  /**
   * Converts aligned weeks into ordered printable A4 pages according to duplexMode.
   */
  function buildDocumentPages(weeks, config) {
    var cfg = config || {};
    var duplexMode = cfg.duplexMode === 'libro' ? 'libro' : 'fronte-retro';
    var pages = [];

    if (!weeks || weeks.length === 0) {
      return pages;
    }

    var firstDay = weeks[0].monday.date;
    var lastDay = weeks[weeks.length - 1].saturday.date;
    var periodLabel =
      formatItalianDateShort(firstDay) + ' – ' + formatItalianDateShort(lastDay);

    if (duplexMode === 'libro') {
      var totalLibroPages = 1 + weeks.length * 2 + 1;

      pages.push({
        type: 'cover',
        pageNumber: 1,
        totalPages: totalLibroPages,
        side: 'fronte',
        sideLabel: 'Copertina (Fronte)',
        periodLabel: periodLabel,
        weeksCount: weeks.length,
        firstDate: firstDay,
        lastDate: lastDay
      });

      for (var i = 0; i < weeks.length; i++) {
        var week = weeks[i];
        var frontPageNum = 2 + i * 2;
        var backPageNum = frontPageNum + 1;

        pages.push({
          type: 'week-half',
          half: 'front',
          pageNumber: frontPageNum,
          totalPages: totalLibroPages,
          side: 'retro',
          sideLabel: 'Pag. Sinistra · Lun–Mer',
          week: week,
          days: week.frontDays,
          headerMonthLabel: formatHeaderMonthLabel(week.frontDays),
          periodLabel: periodLabel
        });

        pages.push({
          type: 'week-half',
          half: 'back',
          pageNumber: backPageNum,
          totalPages: totalLibroPages,
          side: 'fronte',
          sideLabel: 'Pag. Destra · Gio–Sab',
          week: week,
          days: week.backDays,
          headerMonthLabel: formatHeaderMonthLabel(week.backDays),
          periodLabel: periodLabel
        });
      }

      pages.push({
        type: 'notes',
        pageNumber: totalLibroPages,
        totalPages: totalLibroPages,
        side: 'retro',
        sideLabel: 'Note finali (Retro)',
        periodLabel: periodLabel,
        weeksCount: weeks.length
      });
    } else {
      var totalFrPages = weeks.length * 2;

      for (var j = 0; j < weeks.length; j++) {
        var w = weeks[j];
        var pFront = 1 + j * 2;
        var pBack = pFront + 1;

        pages.push({
          type: 'week-half',
          half: 'front',
          pageNumber: pFront,
          totalPages: totalFrPages,
          side: 'fronte',
          sideLabel: 'Fronte · Lun–Mer',
          week: w,
          days: w.frontDays,
          headerMonthLabel: formatHeaderMonthLabel(w.frontDays),
          periodLabel: periodLabel
        });

        pages.push({
          type: 'week-half',
          half: 'back',
          pageNumber: pBack,
          totalPages: totalFrPages,
          side: 'retro',
          sideLabel: 'Retro · Gio–Sab',
          week: w,
          days: w.backDays,
          headerMonthLabel: formatHeaderMonthLabel(w.backDays),
          periodLabel: periodLabel
        });
      }
    }

    return pages;
  }

  /**
   * Groups generated pages into logical preview spreads.
   */
  function buildSpreads(pages, duplexMode) {
    if (!pages || pages.length === 0) return [];
    var spreads = [];

    if (duplexMode === 'libro') {
      // Page 0: Cover alone
      spreads.push({
        spreadIndex: 0,
        label: 'Copertina (Pag. 1)',
        pages: [pages[0]]
      });

      // Middle paired spreads: Left (Lun-Mer) | Right (Gio-Sab)
      for (var i = 1; i < pages.length - 1; i += 2) {
        var left = pages[i];
        var right = pages[i + 1];
        var list = right ? [left, right] : [left];
        var wNum = left.week ? left.week.isoWeek : '';
        var rLabel = left.week ? left.week.rangeLabel : '';
        spreads.push({
          spreadIndex: spreads.length,
          label: 'Sett. ' + wNum + ' · ' + rLabel + ' (Pagg. ' + left.pageNumber + '–' + (right ? right.pageNumber : left.pageNumber) + ')',
          pages: list
        });
      }

      // Final page: Notes alone
      if (pages.length > 1) {
        var last = pages[pages.length - 1];
        spreads.push({
          spreadIndex: spreads.length,
          label: 'Note finali (Pag. ' + last.pageNumber + ')',
          pages: [last]
        });
      }
    } else {
      for (var k = 0; k < pages.length; k += 2) {
        var front = pages[k];
        var back = pages[k + 1];
        var sheetNum = Math.floor(k / 2) + 1;
        var wLabel = front.week ? 'Sett. ' + front.week.isoWeek + ' · ' + front.week.rangeLabel : '';
        spreads.push({
          spreadIndex: spreads.length,
          label: 'Foglio ' + sheetNum + ' · ' + wLabel,
          pages: back ? [front, back] : [front]
        });
      }
    }

    return spreads;
  }

  /**
   * Computes start/end ISO date strings for UI quick-select presets.
   */
  function computePresetRange(presetId, referenceDate) {
    var ref = referenceDate instanceof Date
      ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 12, 0, 0, 0)
      : (function () {
          var now = new Date();
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
        })();

    var year = ref.getFullYear();
    var month = ref.getMonth();
    var dow = ref.getDay(); // 0=Sun..6=Sat
    var currentMonday = dow === 0 ? addDays(ref, 1) : addDays(ref, -(dow - 1));

    var start;
    var end;

    switch (presetId) {
      case 'this-week':
        start = currentMonday;
        end = addDays(currentMonday, 5);
        break;

      case 'next-4-weeks':
        start = currentMonday;
        end = addDays(currentMonday, 26); // 4 weeks Mon..Sat
        break;

      case 'this-month':
        start = new Date(year, month, 1, 12, 0, 0, 0);
        end = new Date(year, month + 1, 0, 12, 0, 0, 0);
        break;

      case 'next-month':
        start = new Date(year, month + 1, 1, 12, 0, 0, 0);
        end = new Date(year, month + 2, 0, 12, 0, 0, 0);
        break;

      case 'quarter':
        start = new Date(year, month, 1, 12, 0, 0, 0);
        end = new Date(year, month + 3, 0, 12, 0, 0, 0);
        break;

      case 'semester':
        start = new Date(year, month, 1, 12, 0, 0, 0);
        end = new Date(year, month + 6, 0, 12, 0, 0, 0);
        break;

      case 'current-year':
        start = new Date(year, 0, 1, 12, 0, 0, 0);
        end = new Date(year, 11, 31, 12, 0, 0, 0);
        break;

      case 'next-year':
        start = new Date(year + 1, 0, 1, 12, 0, 0, 0);
        end = new Date(year + 1, 11, 31, 12, 0, 0, 0);
        break;

      default:
        start = currentMonday;
        end = addDays(currentMonday, 26);
        break;
    }

    return {
      startIso: formatIsoDate(start),
      endIso: formatIsoDate(end)
    };
  }

  var api = {
    MONTHS_IT: MONTHS_IT,
    MONTHS_SHORT_IT: MONTHS_SHORT_IT,
    WEEKDAYS_IT: WEEKDAYS_IT,
    MAX_WEEKS: MAX_WEEKS,
    parseLocalDate: parseLocalDate,
    formatIsoDate: formatIsoDate,
    formatItalianDateShort: formatItalianDateShort,
    getISOWeek: getISOWeek,
    formatHeaderMonthLabel: formatHeaderMonthLabel,
    alignPeriodToWeeks: alignPeriodToWeeks,
    buildDocumentPages: buildDocumentPages,
    buildSpreads: buildSpreads,
    computePresetRange: computePresetRange
  };

  root.AgendaApp = root.AgendaApp || {};
  root.AgendaApp.calendar = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
