import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const holidays = require(path.join(rootDir, 'js', 'holidays.js'));
const themes = require(path.join(rootDir, 'js', 'themes.js'));
const calendar = require(path.join(rootDir, 'js', 'calendar.js'));
const pdfEngine = require(path.join(rootDir, 'js', 'pdf-engine.js'));

function verifyPdfStructure(ascii, expectedPages, label) {
  assert.ok(ascii.startsWith('%PDF-1.4\n'), `${label}: must start with %PDF-1.4`);
  assert.ok(ascii.endsWith('%%EOF\n'), `${label}: must end with %%EOF`);

  // Ensure strictly 7-bit ASCII (1 JS char === 1 byte)
  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    assert.ok(
      code <= 127,
      `${label}: non-ASCII byte 0x${code.toString(16)} at index ${i}`
    );
  }

  // Verify /Count
  const countMatch = ascii.match(/\/Count\s+(\d+)\s*>>/);
  assert.ok(countMatch, `${label}: missing /Pages /Count`);
  assert.equal(
    Number(countMatch[1]),
    expectedPages,
    `${label}: /Count mismatch`
  );

  // Verify MediaBox count
  const mediaMatches = ascii.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g) || [];
  assert.equal(
    mediaMatches.length,
    expectedPages,
    `${label}: /MediaBox count mismatch`
  );

  // Verify startxref & every xref byte offset
  const startXrefMatch = ascii.match(/startxref\n(\d+)\n%%EOF\n$/);
  assert.ok(startXrefMatch, `${label}: missing startxref`);
  const xrefPos = Number(startXrefMatch[1]);
  assert.ok(
    ascii.slice(xrefPos, xrefPos + 5) === 'xref\n',
    `${label}: startxref offset does not point to xref`
  );

  const xrefBlock = ascii.slice(xrefPos, ascii.indexOf('\ntrailer\n', xrefPos));
  const lines = xrefBlock.split('\n');
  const headerParts = lines[1].split(' ');
  const totalEntries = Number(headerParts[1]);
  assert.equal(
    totalEntries,
    1 + 5 + expectedPages * 2,
    `${label}: unexpected xref object count`
  );
  assert.equal(lines[2], '0000000000 65535 f ', `${label}: free entry 0 invalid`);

  for (let id = 1; id < totalEntries; id++) {
    const entry = lines[2 + id];
    assert.ok(/^\d{10} 00000 n $/.test(entry), `${label}: bad xref entry ${id}: "${entry}"`);
    const offset = Number(entry.slice(0, 10));
    const prefix = `${id} 0 obj\n`;
    assert.equal(
      ascii.slice(offset, offset + prefix.length),
      prefix,
      `${label}: object ${id} offset mismatch`
    );

    // Check stream /Length if this is a stream object
    const objEnd = ascii.indexOf('\nendobj\n', offset);
    const objText = ascii.slice(offset, objEnd);
    const streamMarker = '>>\nstream\n';
    const smIdx = objText.indexOf(streamMarker);
    if (smIdx !== -1) {
      const lenMatch = objText.match(/\/Length (\d+)/);
      assert.ok(lenMatch, `${label}: stream object ${id} missing /Length`);
      const declaredLen = Number(lenMatch[1]);
      const streamStart = smIdx + streamMarker.length;
      const streamEnd = objText.lastIndexOf('\nendstream');
      assert.equal(
        streamEnd - streamStart,
        declaredLen,
        `${label}: stream object ${id} /Length mismatch`
      );
    }
  }
}

console.log('1. Checking Italian holidays & Pasquetta...');
const pasquettaExpected = {
  2025: '2025-04-21',
  2026: '2026-04-06',
  2027: '2027-03-29',
  2028: '2028-04-17'
};
for (const [yearStr, expectedIso] of Object.entries(pasquettaExpected)) {
  const map = holidays.getItalianHolidays(Number(yearStr));
  assert.equal(
    map[expectedIso],
    "Lunedì dell'Angelo",
    `Pasquetta mismatch for ${yearStr}`
  );
}
assert.equal(holidays.getHolidayForDate('2026-12-08'), 'Immacolata Concezione');
assert.equal(holidays.getHolidayForDate('2026-08-15'), 'Ferragosto');
assert.equal(holidays.getHolidayForDate('2026-11-20'), null);

console.log('2. Checking week alignment & ISO weeks...');
const singleDay = calendar.alignPeriodToWeeks('2026-11-20', '2026-11-20');
assert.equal(singleDay.weeks.length, 1);
assert.equal(singleDay.alignedStartIso, '2026-11-16');
assert.equal(singleDay.alignedEndIso, '2026-11-21');
assert.equal(singleDay.weeks[0].isoWeek, 47);

const sunOnly = calendar.alignPeriodToWeeks('2026-11-22', '2026-11-22');
assert.equal(sunOnly.weeks.length, 1);
assert.equal(sunOnly.alignedStartIso, '2026-11-23');
assert.equal(sunOnly.alignedEndIso, '2026-11-28');

const monToSun = calendar.alignPeriodToWeeks('2026-11-16', '2026-11-22');
assert.equal(monToSun.weeks.length, 1);
assert.equal(monToSun.alignedStartIso, '2026-11-16');
assert.equal(monToSun.alignedEndIso, '2026-11-21');

const crossYear = calendar.alignPeriodToWeeks('2026-12-28', '2027-01-02');
assert.equal(crossYear.weeks.length, 1);
assert.equal(crossYear.weeks[0].isoWeek, 53);
assert.equal(crossYear.weeks[0].isoYear, 2026);
assert.equal(
  calendar.formatHeaderMonthLabel(crossYear.weeks[0].frontDays),
  'Dicembre 2026'
);
assert.equal(
  calendar.formatHeaderMonthLabel(crossYear.weeks[0].backDays),
  'Dicembre 2026 / Gennaio 2027'
);

console.log('3. Checking layout geometry & mirrored margins...');
const baseCfg = {
  duplexMode: 'fronte-retro',
  bindingMargin: 15,
  startMinutes: 450,
  endMinutes: 1200,
  stepMinutes: 15,
  theme: 'blu',
  headerTitle: 'Studio Medico',
  showHolidays: true,
  showWeekNumber: true,
  alternateHours: true,
  showNotes: false
};
const oddLayout = themes.computeLayout(baseCfg, 1);
const evenLayout = themes.computeLayout(baseCfg, 2);
assert.equal(oddLayout.slotCount, 51);
assert.equal(oddLayout.slots[0].label, '07:30');
assert.equal(oddLayout.slots[50].label, '20:00');
assert.equal(oddLayout.endLabel, '20:00');
assert.ok(oddLayout.rowH > 4.5, `Expected rowH > 4.5 mm, got ${oddLayout.rowH}`);
assert.equal(oddLayout.marginLeft, 15);
assert.equal(oddLayout.marginRight, 8);
assert.equal(evenLayout.marginLeft, 8);
assert.equal(evenLayout.marginRight, 15);

console.log('4. Generating & validating PDFs...');
// Case A: 4 weeks fronte-retro (8 pages)
const fourWeeks = calendar.alignPeriodToWeeks('2026-11-16', '2026-12-12');
assert.equal(fourWeeks.weeks.length, 4);
const frPages = calendar.buildDocumentPages(fourWeeks.weeks, baseCfg);
assert.equal(frPages.length, 8);
const frPdf = pdfEngine.generateAgendaPdf(frPages, baseCfg);
verifyPdfStructure(frPdf.ascii, 8, 'fronte-retro 4 weeks');
assert.ok(frPdf.ascii.includes('(20:00) Tj'), 'Missing 20:00 slot in PDF');

// Check WinAnsi octal accented Italian weekdays in PDF stream
for (const expectedWeekday of [
  'LUNED\\314',
  'MARTED\\314',
  'MERCOLED\\314',
  'GIOVED\\314',
  'VENERD\\314',
  'SABATO'
]) {
  assert.ok(
    frPdf.ascii.includes(expectedWeekday),
    `Missing encoded weekday ${expectedWeekday} in PDF`
  );
}
assert.ok(
  frPdf.ascii.includes('Immacolata Concezione'),
  'Missing Dec 8 holiday in PDF'
);

// Case B: 4 weeks libro mode with notes & grafite theme (10 pages)
const libroCfg = { ...baseCfg, duplexMode: 'libro', theme: 'grafite', showNotes: true };
const libroPages = calendar.buildDocumentPages(fourWeeks.weeks, libroCfg);
assert.equal(libroPages.length, 10);
assert.equal(libroPages[0].type, 'cover');
assert.equal(libroPages[9].type, 'notes');
const libroPdf = pdfEngine.generateAgendaPdf(libroPages, libroCfg);
verifyPdfStructure(libroPdf.ascii, 10, 'libro 4 weeks');

// Case C: Full year 2026 (2026-01-01 to 2026-12-31)
const fullYear = calendar.alignPeriodToWeeks('2026-01-01', '2026-12-31');
const fullYearPages = calendar.buildDocumentPages(fullYear.weeks, baseCfg);
const fullYearPdf = pdfEngine.generateAgendaPdf(fullYearPages, baseCfg);
verifyPdfStructure(
  fullYearPdf.ascii,
  fullYear.weeks.length * 2,
  `full year 2026 (${fullYear.weeks.length} weeks)`
);

console.log(
  `ALL CHECKS PASSED! Verified: holidays, alignment, geometry (${oddLayout.slotCount} slots @ ${oddLayout.rowH.toFixed(2)} mm), PDFs (8p, 10p, ${fullYearPages.length}p).`
);
