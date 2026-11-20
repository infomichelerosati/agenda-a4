(function (root) {
  'use strict';

  var themesMod =
    (root.AgendaApp && root.AgendaApp.themes) ||
    (typeof require === 'function' ? require('./themes.js') : null);

  var PT_PER_MM = 72 / 25.4;
  var A4_W_PT = 595.28;
  var A4_H_PT = 841.89;
  var PAGE_H_MM = 297;

  // Standard Adobe Type1 Helvetica glyph widths (1/1000 em) for ASCII 32..126
  var WIDTHS_HELVETICA = {
    32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
    40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
    48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
    56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556,
    64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
    72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778,
    80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
    88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556,
    96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556,
    104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556,
    112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
    120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584
  };

  var WIDTHS_HELVETICA_BOLD = {
    32: 278, 33: 333, 34: 474, 35: 556, 36: 556, 37: 889, 38: 722, 39: 238,
    40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
    48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
    56: 556, 57: 556, 58: 333, 59: 333, 60: 584, 61: 584, 62: 584, 63: 611,
    64: 975, 65: 722, 66: 722, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
    72: 722, 73: 278, 74: 556, 75: 722, 76: 611, 77: 833, 78: 722, 79: 778,
    80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
    88: 667, 89: 667, 90: 611, 91: 333, 92: 278, 93: 333, 94: 584, 95: 556,
    96: 333, 97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611,
    104: 611, 105: 278, 106: 278, 107: 556, 108: 278, 109: 889, 110: 611, 111: 611,
    112: 611, 113: 611, 114: 389, 115: 556, 116: 333, 117: 611, 118: 556, 119: 778,
    120: 556, 121: 556, 122: 500, 123: 389, 124: 280, 125: 389, 126: 584
  };

  var EXTRA_CHAR_BASE = {
    0x00C0: 65, 0x00C1: 65, 0x00C2: 65, 0x00C3: 65, 0x00C4: 65, 0x00C5: 65,
    0x00C8: 69, 0x00C9: 69, 0x00CA: 69, 0x00CB: 69,
    0x00CC: 73, 0x00CD: 73, 0x00CE: 73, 0x00CF: 73,
    0x00D2: 79, 0x00D3: 79, 0x00D4: 79, 0x00D5: 79, 0x00D6: 79,
    0x00D9: 85, 0x00DA: 85, 0x00DB: 85, 0x00DC: 85,
    0x00E0: 97, 0x00E1: 97, 0x00E2: 97, 0x00E3: 97, 0x00E4: 97, 0x00E5: 97,
    0x00E8: 101, 0x00E9: 101, 0x00EA: 101, 0x00EB: 101,
    0x00EC: 105, 0x00ED: 105, 0x00EE: 105, 0x00EF: 105,
    0x00F2: 111, 0x00F3: 111, 0x00F4: 111, 0x00F5: 111, 0x00F6: 111,
    0x00F9: 117, 0x00FA: 117, 0x00FB: 117, 0x00FC: 117,
    0x00C7: 67, 0x00E7: 99, 0x00D1: 78, 0x00F1: 110,
    0x00B7: 46, // middle dot
    0x00B0: 400,
    0x2018: 39, 0x2019: 39,
    0x201C: 34, 0x201D: 34
  };

  var EXTRA_DIRECT_WIDTH = {
    0x2013: 556, // en-dash
    0x2014: 1000, // em-dash
    0x2022: 350, // bullet
    0x2026: 1000, // ellipsis
    0x20AC: 556 // euro
  };

  var WINANSI_MAP = {
    0x20AC: 0x80, // €
    0x201A: 0x82,
    0x0192: 0x83,
    0x201E: 0x84,
    0x2026: 0x85, // …
    0x2020: 0x86,
    0x2021: 0x87,
    0x02C6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8A,
    0x2039: 0x8B,
    0x0152: 0x8C,
    0x017D: 0x8E,
    0x2018: 0x91, // ‘
    0x2019: 0x92, // ’
    0x201C: 0x93, // “
    0x201D: 0x94, // ”
    0x2022: 0x95, // •
    0x2013: 0x96, // –
    0x2014: 0x97, // —
    0x02DC: 0x98,
    0x2122: 0x99,
    0x0161: 0x9A,
    0x203A: 0x9B,
    0x0153: 0x9C,
    0x017E: 0x9E,
    0x0178: 0x9F
  };

  function toOctal3(byteVal) {
    var oct = byteVal.toString(8);
    while (oct.length < 3) oct = '0' + oct;
    return '\\' + oct;
  }

  /**
   * Encodes a Unicode JS string into a pure-ASCII PDF literal string under WinAnsiEncoding.
   * Ensures every output character code <= 127 so string length === exact byte length.
   */
  function encodePdfText(str) {
    if (!str) return '';
    var text = String(str);
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code === 0x5C) {
        out += '\\\\';
      } else if (code === 0x28) {
        out += '\\(';
      } else if (code === 0x29) {
        out += '\\)';
      } else if (code >= 0x20 && code <= 0x7E) {
        out += text.charAt(i);
      } else if (WINANSI_MAP[code] !== undefined) {
        out += toOctal3(WINANSI_MAP[code]);
      } else if (code >= 0xA0 && code <= 0xFF) {
        out += toOctal3(code);
      } else if (code === 0x09 || code === 0x0A || code === 0x0D) {
        out += ' ';
      } else {
        out += '?';
      }
    }
    return out;
  }

  function getGlyphWidth(code, isBold) {
    var table = isBold ? WIDTHS_HELVETICA_BOLD : WIDTHS_HELVETICA;
    if (EXTRA_DIRECT_WIDTH[code] !== undefined) {
      return EXTRA_DIRECT_WIDTH[code];
    }
    if (EXTRA_CHAR_BASE[code] !== undefined) {
      var mapped = EXTRA_CHAR_BASE[code];
      return mapped > 200 ? mapped : (table[mapped] || 556);
    }
    if (table[code] !== undefined) {
      return table[code];
    }
    return 556;
  }

  function measureTextMm(text, fontSizePt, fontId) {
    if (!text) return 0;
    var isBold = fontId === 'F2';
    var totalUnits = 0;
    for (var i = 0; i < text.length; i++) {
      totalUnits += getGlyphWidth(text.charCodeAt(i), isBold);
    }
    var ptWidth = (totalUnits / 1000) * fontSizePt;
    return ptWidth / PT_PER_MM;
  }

  function clipTextToWidth(text, maxWidthMm, fontSizePt, fontId) {
    if (!text) return '';
    if (measureTextMm(text, fontSizePt, fontId) <= maxWidthMm) {
      return text;
    }
    var ellipsis = '...';
    var trimmed = text;
    while (
      trimmed.length > 0 &&
      measureTextMm(trimmed + ellipsis, fontSizePt, fontId) > maxWidthMm
    ) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed.length > 0 ? trimmed.replace(/\s+$/, '') + ellipsis : '';
  }

  function mm(val) {
    return (val * PT_PER_MM).toFixed(2);
  }

  function pdfY(yMm) {
    return ((PAGE_H_MM - yMm) * PT_PER_MM).toFixed(2);
  }

  function hexToRgbParts(hex) {
    if (!hex || typeof hex !== 'string') return '0.000 0.000 0.000';
    var clean = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    if (clean.length === 3) {
      clean =
        clean.charAt(0) + clean.charAt(0) +
        clean.charAt(1) + clean.charAt(1) +
        clean.charAt(2) + clean.charAt(2);
    }
    var r = parseInt(clean.slice(0, 2), 16) / 255;
    var g = parseInt(clean.slice(2, 4), 16) / 255;
    var b = parseInt(clean.slice(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '0.000 0.000 0.000';
    return r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3);
  }

  function pad10(n) {
    var s = String(n);
    while (s.length < 10) s = '0' + s;
    return s;
  }

  /**
   * Minimal vector PDF 1.4 builder with top-left millimeter coordinates.
   */
  function PdfBuilder() {
    this.pages = [];
    this.current = [];
  }

  PdfBuilder.prototype.beginPage = function () {
    this.current = [];
  };

  PdfBuilder.prototype.endPage = function () {
    this.pages.push(this.current.join('\n'));
    this.current = [];
  };

  PdfBuilder.prototype.rectFill = function (x, y, w, h, colorHex) {
    var rgb = hexToRgbParts(colorHex);
    var bottomPt = ((PAGE_H_MM - (y + h)) * PT_PER_MM).toFixed(2);
    this.current.push(
      rgb + ' rg ' + mm(x) + ' ' + bottomPt + ' ' + mm(w) + ' ' + mm(h) + ' re f'
    );
  };

  PdfBuilder.prototype.rectStroke = function (x, y, w, h, colorHex, lineWidthMm) {
    var rgb = hexToRgbParts(colorHex);
    var bottomPt = ((PAGE_H_MM - (y + h)) * PT_PER_MM).toFixed(2);
    var lwPt = (lineWidthMm * PT_PER_MM).toFixed(2);
    this.current.push(
      lwPt + ' w ' + rgb + ' RG ' + mm(x) + ' ' + bottomPt + ' ' + mm(w) + ' ' + mm(h) + ' re S'
    );
  };

  PdfBuilder.prototype.roundedRectFill = function (x, y, w, h, r, colorHex) {
    var radius = Math.min(r, w / 2, h / 2);
    var k = 0.55228475 * radius;
    var x0 = x * PT_PER_MM;
    var y0 = (PAGE_H_MM - (y + h)) * PT_PER_MM;
    var wp = w * PT_PER_MM;
    var hp = h * PT_PER_MM;
    var rp = radius * PT_PER_MM;
    var kp = k * PT_PER_MM;
    var f = function (v) { return v.toFixed(2); };
    var rgb = hexToRgbParts(colorHex);

    var ops = [
      rgb + ' rg',
      f(x0 + rp) + ' ' + f(y0) + ' m',
      f(x0 + wp - rp) + ' ' + f(y0) + ' l',
      f(x0 + wp - rp + kp) + ' ' + f(y0) + ' ' + f(x0 + wp) + ' ' + f(y0 + rp - kp) + ' ' + f(x0 + wp) + ' ' + f(y0 + rp) + ' c',
      f(x0 + wp) + ' ' + f(y0 + hp - rp) + ' l',
      f(x0 + wp) + ' ' + f(y0 + hp - rp + kp) + ' ' + f(x0 + wp - rp + kp) + ' ' + f(y0 + hp) + ' ' + f(x0 + wp - rp) + ' ' + f(y0 + hp) + ' c',
      f(x0 + rp) + ' ' + f(y0 + hp) + ' l',
      f(x0 + rp - kp) + ' ' + f(y0 + hp) + ' ' + f(x0) + ' ' + f(y0 + hp - rp + kp) + ' ' + f(x0) + ' ' + f(y0 + hp - rp) + ' c',
      f(x0) + ' ' + f(y0 + rp) + ' l',
      f(x0) + ' ' + f(y0 + rp - kp) + ' ' + f(x0 + rp - kp) + ' ' + f(y0) + ' ' + f(x0 + rp) + ' ' + f(y0) + ' c',
      'f'
    ];
    this.current.push(ops.join(' '));
  };

  PdfBuilder.prototype.line = function (x1, y1, x2, y2, colorHex, lineWidthMm) {
    var rgb = hexToRgbParts(colorHex);
    var lwPt = (lineWidthMm * PT_PER_MM).toFixed(2);
    this.current.push(
      lwPt + ' w ' + rgb + ' RG ' + mm(x1) + ' ' + pdfY(y1) + ' m ' + mm(x2) + ' ' + pdfY(y2) + ' l S'
    );
  };

  PdfBuilder.prototype.text = function (str, xMm, baselineYmm, options) {
    if (str === undefined || str === null || str === '') return;
    var opts = options || {};
    var font = opts.font || 'F1';
    var size = opts.size || 9;
    var color = opts.color || '#000000';
    var align = opts.align || 'left';
    var text = String(str);

    if (opts.maxWidth) {
      text = clipTextToWidth(text, opts.maxWidth, size, font);
    }
    if (!text) return;

    var drawX = xMm;
    if (align === 'center') {
      drawX = xMm - measureTextMm(text, size, font) / 2;
    } else if (align === 'right') {
      drawX = xMm - measureTextMm(text, size, font);
    }

    var rgb = hexToRgbParts(color);
    var encoded = encodePdfText(text);
    this.current.push(
      'BT /' + font + ' ' + size.toFixed(2) + ' Tf ' + rgb + ' rg 1 0 0 1 ' + mm(drawX) + ' ' + pdfY(baselineYmm) + ' Tm (' + encoded + ') Tj ET'
    );
  };

  PdfBuilder.prototype.buildAsciiString = function () {
    var totalPages = this.pages.length;
    var objects = [];
    // Objects:
    // 1: Catalog
    // 2: Pages
    // 3: Helvetica (F1)
    // 4: Helvetica-Bold (F2)
    // 5: Helvetica-Oblique (F3)
    // For each page i: Content = 6 + i*2, Page = 7 + i*2

    var pageIds = [];
    for (var i = 0; i < totalPages; i++) {
      pageIds.push((7 + i * 2) + ' 0 R');
    }

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = '<< /Type /Pages /Kids [ ' + pageIds.join(' ') + ' ] /Count ' + totalPages + ' >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';

    for (var p = 0; p < totalPages; p++) {
      var stream = this.pages[p];
      var contentObjId = 6 + p * 2;
      var pageObjId = 7 + p * 2;

      objects[contentObjId] =
        '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';

      objects[pageObjId] =
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
        A4_W_PT.toFixed(2) + ' ' + A4_H_PT.toFixed(2) +
        '] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ' +
        contentObjId + ' 0 R >>';
    }

    var chunks = ['%PDF-1.4\n%AgendaA4VectorPDF\n'];
    var bytePos = chunks[0].length;
    var offsets = [0];
    var maxId = objects.length - 1;

    for (var id = 1; id <= maxId; id++) {
      offsets[id] = bytePos;
      var body = id + ' 0 obj\n' + objects[id] + '\nendobj\n';
      chunks.push(body);
      bytePos += body.length;
    }

    var xrefOffset = bytePos;
    var xrefLines = ['xref\n0 ' + (maxId + 1) + '\n', '0000000000 65535 f \n'];
    for (var j = 1; j <= maxId; j++) {
      xrefLines.push(pad10(offsets[j]) + ' 00000 n \n');
    }

    var trailer =
      'trailer\n<< /Size ' + (maxId + 1) + ' /Root 1 0 R >>\nstartxref\n' +
      xrefOffset + '\n%%EOF\n';

    chunks.push(xrefLines.join(''), trailer);
    return chunks.join('');
  };

  PdfBuilder.prototype.buildBlob = function () {
    var ascii = this.buildAsciiString();
    var bytes = new Uint8Array(ascii.length);
    for (var i = 0; i < ascii.length; i++) {
      bytes[i] = ascii.charCodeAt(i) & 0xFF;
    }
    return new Blob([bytes], { type: 'application/pdf' });
  };

  /**
   * Computes baseline Y (mm from top) to vertically center text at centerYmm.
   */
  function centeredBaseline(centerYmm, fontSizePt) {
    return centerYmm + fontSizePt * 0.1266;
  }

  function renderFooter(pdf, page, layout, theme) {
    var baseline = layout.footerY + 2.8;
    var pageText = 'Pag. ' + page.pageNumber + ' / ' + page.totalPages;
    var infoText = page.sideLabel + (page.periodLabel ? '  ·  ' + page.periodLabel : '');

    if (layout.isEven) {
      pdf.text(pageText, layout.contentX, baseline, {
        font: 'F2',
        size: 7.0,
        color: theme.mutedText,
        align: 'left'
      });
      pdf.text(infoText, layout.contentX + layout.contentW, baseline, {
        font: 'F1',
        size: 7.0,
        color: theme.mutedText,
        align: 'right',
        maxWidth: layout.contentW - 30
      });
    } else {
      pdf.text(infoText, layout.contentX, baseline, {
        font: 'F1',
        size: 7.0,
        color: theme.mutedText,
        align: 'left',
        maxWidth: layout.contentW - 30
      });
      pdf.text(pageText, layout.contentX + layout.contentW, baseline, {
        font: 'F2',
        size: 7.0,
        color: theme.mutedText,
        align: 'right'
      });
    }
  }

  function renderWeekHalfPage(pdf, page, config, theme, layout) {
    var x0 = layout.contentX;
    var w = layout.contentW;

    // 1. Top Header Bar
    pdf.rectFill(x0, layout.headerY, w, layout.headerH, theme.headerBg);
    pdf.line(
      x0,
      layout.headerY + layout.headerH,
      x0 + w,
      layout.headerY + layout.headerH,
      theme.primary,
      0.55
    );

    var pillW = config.showWeekNumber ? 19.5 : 0;
    var pillH = 6.0;
    var pillX = x0 + w - pillW - 2.0;
    var pillY = layout.headerY + (layout.headerH - pillH) / 2;

    var monthMaxW = w * 0.54;
    pdf.text(
      page.headerMonthLabel,
      x0 + 2.5,
      centeredBaseline(layout.headerY + layout.headerH / 2, 12.2),
      {
        font: 'F2',
        size: 12.2,
        color: theme.primary,
        align: 'left',
        maxWidth: monthMaxW
      }
    );

    if (config.headerTitle && config.headerTitle.trim()) {
      var titleRight = config.showWeekNumber ? pillX - 3.0 : x0 + w - 2.5;
      var monthW = measureTextMm(page.headerMonthLabel, 12.2, 'F2');
      var availTitleW = Math.max(10, titleRight - (x0 + 2.5 + Math.min(monthW, monthMaxW) + 4));
      if (availTitleW > 14) {
        pdf.text(
          config.headerTitle.trim(),
          titleRight,
          centeredBaseline(layout.headerY + layout.headerH / 2, 8.2),
          {
            font: 'F1',
            size: 8.2,
            color: theme.mutedText,
            align: 'right',
            maxWidth: availTitleW
          }
        );
      }
    }

    if (config.showWeekNumber && page.week) {
      pdf.roundedRectFill(pillX, pillY, pillW, pillH, 1.3, theme.primary);
      pdf.text(
        'Sett. ' + page.week.isoWeek,
        pillX + pillW / 2,
        centeredBaseline(pillY + pillH / 2, 7.8),
        {
          font: 'F2',
          size: 7.8,
          color: theme.primaryText,
          align: 'center'
        }
      );
    }

    // 2. Day Headers (ORA + 3 Days)
    var dy = layout.dayHeaderY;
    var dh = layout.dayHeaderH;
    pdf.rectFill(x0, dy, layout.timeColW, dh, theme.primary);
    pdf.text('ORA', x0 + layout.timeColW / 2, centeredBaseline(dy + dh / 2, 7.5), {
      font: 'F2',
      size: 7.5,
      color: theme.primaryText,
      align: 'center'
    });

    for (var c = 0; c < page.days.length; c++) {
      var day = page.days[c];
      var colX = x0 + layout.timeColW + c * layout.dayColW;
      var isHoliday = Boolean(config.showHolidays && day.holiday);

      pdf.rectFill(
        colX,
        dy,
        layout.dayColW,
        dh,
        isHoliday ? theme.holidayBg : theme.headerBg
      );

      if (isHoliday) {
        pdf.rectFill(colX, dy, layout.dayColW, 1.0, theme.holidayText);
      }

      // Weekday name uppercase
      pdf.text(
        day.weekdayName.toUpperCase(),
        colX + 2.5,
        dy + 4.3,
        {
          font: 'F2',
          size: 7.5,
          color: isHoliday ? theme.holidayText : theme.accentText,
          align: 'left'
        }
      );

      // Day number + short month
      var dayNumStr = String(day.dayNum);
      pdf.text(dayNumStr, colX + 2.5, dy + 9.8, {
        font: 'F2',
        size: 13.0,
        color: isHoliday ? theme.holidayText : theme.timeHourText,
        align: 'left'
      });

      var numW = measureTextMm(dayNumStr, 13.0, 'F2');
      pdf.text(day.monthShort, colX + 2.5 + numW + 1.4, dy + 9.6, {
        font: 'F1',
        size: 8.0,
        color: theme.mutedText,
        align: 'left'
      });

      if (isHoliday) {
        var monthShortW = measureTextMm(day.monthShort, 8.0, 'F1');
        var usedLeft = 2.5 + numW + 1.4 + monthShortW + 2.0;
        var maxHolidayW = Math.max(12, layout.dayColW - usedLeft - 2.0);
        pdf.text(day.holiday, colX + layout.dayColW - 2.2, dy + 9.6, {
          font: 'F3',
          size: 6.5,
          color: theme.holidayText,
          align: 'right',
          maxWidth: maxHolidayW
        });
      }
    }

    // 3. Appointment Grid Rows
    var gy = layout.gridY;
    var slots = layout.slots;
    var rowH = layout.rowH;
    var gridStartX = x0 + layout.timeColW;
    var daysW = w - layout.timeColW;

    // Alternating hour backgrounds
    if (config.alternateHours) {
      for (var r = 0; r < slots.length; r++) {
        if (slots[r].hourBlockAlt) {
          pdf.rectFill(x0, gy + r * rowH, w, rowH, theme.altRowBg);
        }
      }
    }

    // Subtle tint in ORA column header separator line
    pdf.line(x0, gy, x0 + w, gy, theme.borderOuter, 0.35);

    // Horizontal slot dividers
    for (var s = 1; s < slots.length; s++) {
      var lineY = gy + s * rowH;
      var slotInfo = slots[s];
      var strokeColor;
      var strokeW;
      if (slotInfo.isHour) {
        strokeColor = theme.borderHour;
        strokeW = 0.30;
      } else if (slotInfo.isHalf) {
        strokeColor = theme.borderHalf;
        strokeW = 0.20;
      } else {
        strokeColor = theme.borderQuarter;
        strokeW = 0.12;
      }
      pdf.line(x0, lineY, x0 + w, lineY, strokeColor, strokeW);
    }

    // Time labels
    for (var t = 0; t < slots.length; t++) {
      var sl = slots[t];
      var centerY = gy + t * rowH + rowH / 2;
      var fSize = sl.isHour ? 7.6 : (sl.isHalf ? 6.6 : 5.9);
      var fId = sl.isHour ? 'F2' : 'F1';
      var fColor = sl.isHour
        ? theme.timeHourText
        : (sl.isHalf ? theme.timeSubText : theme.mutedText);

      // Guard font size on very compact custom ranges
      if (rowH < 4.2 && fSize > 6.5) fSize = 6.5;

      pdf.text(sl.label, x0 + layout.timeColW / 2, centeredBaseline(centerY, fSize), {
        font: fId,
        size: fSize,
        color: fColor,
        align: 'center'
      });
    }

    // Vertical column dividers
    pdf.line(gridStartX, dy, gridStartX, layout.gridBottom, theme.borderOuter, 0.35);
    for (var col = 1; col < 3; col++) {
      var vx = gridStartX + col * layout.dayColW;
      pdf.line(vx, dy, vx, layout.gridBottom, theme.borderHour, 0.26);
    }

    // Outer frame around Day Headers + Grid
    pdf.rectStroke(x0, dy, w, dh + layout.gridH, theme.borderOuter, 0.42);

    // 4. Optional Bottom Notes Strip
    if (layout.showNotes) {
      var ny = layout.notesY;
      var nh = layout.notesH;
      pdf.rectFill(x0, ny, w, nh, theme.headerBg);
      pdf.rectStroke(x0, ny, w, nh, theme.borderHour, 0.28);
      pdf.text('NOTE', x0 + 2.5, ny + 4.2, {
        font: 'F2',
        size: 7.0,
        color: theme.accentText,
        align: 'left'
      });
      pdf.line(x0 + 13.5, ny + 5.2, x0 + w - 2.5, ny + 5.2, theme.borderHalf, 0.16);
      pdf.line(x0 + 2.5, ny + 10.2, x0 + w - 2.5, ny + 10.2, theme.borderHalf, 0.16);
    }

    // 5. Footer
    renderFooter(pdf, page, layout, theme);
  }

  function renderCoverPage(pdf, page, config, theme, layout) {
    var x0 = layout.contentX;
    var w = layout.contentW;
    var y0 = layout.marginTop;
    var h = layout.pageH - layout.marginTop - layout.marginBottom - layout.footerH - 4;
    var cx = x0 + w / 2;

    // Editorial double frame
    pdf.rectStroke(x0, y0, w, h, theme.primary, 0.65);
    pdf.rectStroke(x0 + 3, y0 + 3, w - 6, h - 6, theme.borderHalf, 0.22);

    // Top accent band
    pdf.rectFill(x0 + 3, y0 + 3, w - 6, 32, theme.headerBg);
    pdf.line(x0 + 3, y0 + 35, x0 + w - 3, y0 + 35, theme.primary, 0.6);

    pdf.text('AGENDA SETTIMANALE  ·  LUNEDÌ – SABATO', cx, y0 + 21, {
      font: 'F2',
      size: 9.5,
      color: theme.accentText,
      align: 'center'
    });

    var title = (config.headerTitle && config.headerTitle.trim()) || 'Agenda Appuntamenti';
    pdf.text(title, cx, y0 + 82, {
      font: 'F2',
      size: 24.0,
      color: theme.primary,
      align: 'center',
      maxWidth: w - 24
    });

    pdf.line(cx - 28, y0 + 91, cx + 28, y0 + 91, theme.primary, 0.65);

    pdf.text(page.periodLabel, cx, y0 + 106, {
      font: 'F1',
      size: 13.5,
      color: theme.timeHourText,
      align: 'center'
    });

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

    pdf.text(summaryLine, cx, y0 + 118, {
      font: 'F1',
      size: 9.5,
      color: theme.mutedText,
      align: 'center'
    });

    // Subtle owner / studio fill-in block at lower section
    var boxW = Math.min(122, w - 28);
    var boxX = cx - boxW / 2;
    var boxY = y0 + 195;
    pdf.rectFill(boxX, boxY, boxW, 38, theme.headerBg);
    pdf.rectStroke(boxX, boxY, boxW, 38, theme.borderHalf, 0.25);

    pdf.text('STUDIO / TITOLARE', boxX + 5, boxY + 8, {
      font: 'F2',
      size: 7.5,
      color: theme.accentText,
      align: 'left'
    });
    pdf.line(boxX + 5, boxY + 18, boxX + boxW - 5, boxY + 18, theme.borderHour, 0.2);
    pdf.line(boxX + 5, boxY + 29, boxX + boxW - 5, boxY + 29, theme.borderHour, 0.2);

    renderFooter(pdf, page, layout, theme);
  }

  function renderNotesPage(pdf, page, config, theme, layout) {
    var x0 = layout.contentX;
    var w = layout.contentW;

    pdf.rectFill(x0, layout.headerY, w, layout.headerH, theme.headerBg);
    pdf.line(
      x0,
      layout.headerY + layout.headerH,
      x0 + w,
      layout.headerY + layout.headerH,
      theme.primary,
      0.55
    );

    pdf.text(
      'Note e Appunti',
      x0 + 2.5,
      centeredBaseline(layout.headerY + layout.headerH / 2, 12.2),
      {
        font: 'F2',
        size: 12.2,
        color: theme.primary,
        align: 'left'
      }
    );

    if (config.headerTitle && config.headerTitle.trim()) {
      pdf.text(
        config.headerTitle.trim(),
        x0 + w - 2.5,
        centeredBaseline(layout.headerY + layout.headerH / 2, 8.2),
        {
          font: 'F1',
          size: 8.2,
          color: theme.mutedText,
          align: 'right',
          maxWidth: w * 0.45
        }
      );
    }

    var startY = layout.dayHeaderY + 3;
    var endY = layout.footerY - 4;
    var step = 7.0;
    for (var ly = startY; ly <= endY; ly += step) {
      pdf.line(x0, ly, x0 + w, ly, theme.borderHalf, 0.2);
    }

    renderFooter(pdf, page, layout, theme);
  }

  /**
   * Generates a complete vector PDF 1.4 document from built agenda pages.
   * Returns { ascii, blob, pageCount }.
   */
  function generateAgendaPdf(pages, config) {
    var cfg = config || {};
    var theme = themesMod.getTheme(cfg.theme);
    var pdf = new PdfBuilder();

    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var layout = themesMod.computeLayout(cfg, page.pageNumber);
      pdf.beginPage();

      if (page.type === 'cover') {
        renderCoverPage(pdf, page, cfg, theme, layout);
      } else if (page.type === 'notes') {
        renderNotesPage(pdf, page, cfg, theme, layout);
      } else {
        renderWeekHalfPage(pdf, page, cfg, theme, layout);
      }

      pdf.endPage();
    }

    var ascii = pdf.buildAsciiString();
    var blob = typeof Blob !== 'undefined' ? pdf.buildBlob() : null;
    return {
      ascii: ascii,
      blob: blob,
      pageCount: pages.length
    };
  }

  var api = {
    encodePdfText: encodePdfText,
    measureTextMm: measureTextMm,
    clipTextToWidth: clipTextToWidth,
    PdfBuilder: PdfBuilder,
    generateAgendaPdf: generateAgendaPdf
  };

  root.AgendaApp = root.AgendaApp || {};
  root.AgendaApp.pdfEngine = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
