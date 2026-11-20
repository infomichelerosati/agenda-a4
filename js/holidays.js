(function (root) {
  'use strict';

  var holidayCache = {};

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatIsoLocal(date) {
    return (
      date.getFullYear() +
      '-' +
      pad2(date.getMonth() + 1) +
      '-' +
      pad2(date.getDate())
    );
  }

  /**
   * Computes Gregorian Easter Sunday for a given year using the
   * Meeus/Jones/Butcher algorithm. Returned at local noon to avoid DST drift.
   */
  function computeEasterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  /**
   * Returns a plain object keyed by YYYY-MM-DD with Italian national holiday names.
   */
  function getItalianHolidays(year) {
    if (holidayCache[year]) {
      return holidayCache[year];
    }

    var map = {};
    map[year + '-01-01'] = 'Capodanno';
    map[year + '-01-06'] = 'Epifania';

    var easter = computeEasterSunday(year);
    var pasquetta = new Date(
      easter.getFullYear(),
      easter.getMonth(),
      easter.getDate() + 1,
      12,
      0,
      0,
      0
    );
    map[formatIsoLocal(pasquetta)] = "Lunedì dell'Angelo";

    map[year + '-04-25'] = 'Festa della Liberazione';
    map[year + '-05-01'] = 'Festa dei Lavoratori';
    map[year + '-06-02'] = 'Festa della Repubblica';
    map[year + '-08-15'] = 'Ferragosto';
    map[year + '-11-01'] = 'Ognissanti';
    map[year + '-12-08'] = 'Immacolata Concezione';
    map[year + '-12-25'] = 'Natale';
    map[year + '-12-26'] = 'Santo Stefano';

    holidayCache[year] = map;
    return map;
  }

  /**
   * Looks up the holiday name for a Date object (or YYYY-MM-DD string), or null.
   */
  function getHolidayForDate(dateOrIso) {
    if (!dateOrIso) return null;
    var iso;
    var year;
    if (typeof dateOrIso === 'string') {
      iso = dateOrIso;
      year = parseInt(dateOrIso.slice(0, 4), 10);
    } else {
      iso = formatIsoLocal(dateOrIso);
      year = dateOrIso.getFullYear();
    }
    if (isNaN(year)) return null;
    var holidays = getItalianHolidays(year);
    return holidays[iso] || null;
  }

  var api = {
    computeEasterSunday: computeEasterSunday,
    getItalianHolidays: getItalianHolidays,
    getHolidayForDate: getHolidayForDate
  };

  root.AgendaApp = root.AgendaApp || {};
  root.AgendaApp.holidays = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
