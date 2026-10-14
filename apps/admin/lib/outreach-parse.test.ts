import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { parseProspectCsvText, parseProspectFile, parseProspectXlsx } from './outreach-parse';

/* ------------------------------------------------------------------ */
/* Test-only minimal ZIP writer (stored/deflate) + CRC32              */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Build a valid ZIP archive from `{ name, content }` entries (deflate). */
function makeZip(entries: { name: string; content: string }[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const raw = Buffer.from(entry.content, 'utf8');
    const comp = deflateRawSync(raw);
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + comp.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...parts, centralBuf, eocd]);
}

const SHARED_STRINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="8" uniqueCount="8">
<si><t>name</t></si>
<si><t>category</t></si>
<si><t>area</t></si>
<si><t>phone</t></si>
<si><t>Smile Dental</t></si>
<si><t>dental</t></si>
<si><t>Geeta Colony</t></si>
<si><t>9811000000</t></si>
</sst>`;

const SHEET = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
<row r="2"><c r="A2" t="s"><v>4</v></c><c r="B2" t="s"><v>5</v></c><c r="C2" t="s"><v>6</v></c><c r="D2" t="s"><v>7</v></c></row>
<row r="3"><c r="A3" t="inlineStr"><is><t>Inline Clinic</t></is></c><c r="B3" t="inlineStr"><is><t>clinic</t></is></c><c r="C3" t="inlineStr"><is><t>Lal Quarter</t></is></c><c r="D3" t="inlineStr"><is><t>9876543210</t></is></c></row>
<row r="4"><c r="A4" t="inlineStr"><is><t>No Phone Shop</t></is></c><c r="B4" t="inlineStr"><is><t>shop</t></is></c><c r="C4" t="inlineStr"><is><t>Delhi</t></is></c></row>
</sheetData>
</worksheet>`;

/* ------------------------------------------------------------------ */
/* CSV                                                                */
/* ------------------------------------------------------------------ */

test('parseProspectCsvText handles quoted fields, commas, quotes and newlines', () => {
  const csv = [
    'name,category,area,phone',
    '"Sharma, Dental & Co",dental,"Geeta',
    'Colony",9811000000',
    '"Say ""Hi"" Salon",salon,Krishna Nagar,9822000000',
  ].join('\n');
  const rows = parseProspectCsvText(csv);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    name: 'Sharma, Dental & Co',
    category: 'dental',
    area: 'Geeta\nColony',
    phone: '9811000000',
  });
  assert.equal(rows[1]!.name, 'Say "Hi" Salon');
  assert.equal(rows[1]!.phone, '9822000000');
});

test('parseProspectCsvText maps header synonyms and ignores extra columns', () => {
  const csv = [
    'Business Name,Sector,Locality,WhatsApp,Website',
    'Glow Beauty Parlour,salon,Gandhi Nagar,9811833939,example.com',
  ].join('\n');
  const rows = parseProspectCsvText(csv);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    name: 'Glow Beauty Parlour',
    category: 'salon',
    area: 'Gandhi Nagar',
    phone: '9811833939',
  });
});

test('parseProspectCsvText falls back to positional columns without a header', () => {
  const csv = ['Smile Dental,dental,Geeta Colony,9811000000', 'Kalra Sweets,sweets,Krishna Nagar,8826336168'].join(
    '\n'
  );
  const rows = parseProspectCsvText(csv);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    name: 'Smile Dental',
    category: 'dental',
    area: 'Geeta Colony',
    phone: '9811000000',
  });
});

test('parseProspectCsvText skips blank rows and rows without a phone', () => {
  const csv = [
    'name,category,area,phone',
    '',
    'No Phone,boutique,Delhi,',
    'Real Client,boutique,Delhi,9811178313',
    '   ,   ,   ,   ',
  ].join('\n');
  const rows = parseProspectCsvText(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.name, 'Real Client');
});

/* ------------------------------------------------------------------ */
/* XLSX                                                               */
/* ------------------------------------------------------------------ */

test('parseProspectXlsx reads shared strings + inline strings from zip', () => {
  const buf = makeZip([
    { name: 'xl/sharedStrings.xml', content: SHARED_STRINGS },
    { name: 'xl/worksheets/sheet1.xml', content: SHEET },
  ]);
  const rows = parseProspectXlsx(buf);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    name: 'Smile Dental',
    category: 'dental',
    area: 'Geeta Colony',
    phone: '9811000000',
  });
  assert.deepEqual(rows[1], {
    name: 'Inline Clinic',
    category: 'clinic',
    area: 'Lal Quarter',
    phone: '9876543210',
  });
});

/* ------------------------------------------------------------------ */
/* Dispatch                                                           */
/* ------------------------------------------------------------------ */

test('parseProspectFile dispatches by extension, falls back, and rejects .xls', () => {
  const csv = Buffer.from('name,category,area,phone\nReal Client,boutique,Delhi,9811178313', 'utf8');
  const fromCsv = parseProspectFile('prospects.csv', csv);
  assert.equal(fromCsv.rows.length, 1);
  assert.equal(fromCsv.rows[0]!.name, 'Real Client');

  // Unknown extension → tries csv (no zip signature) and succeeds.
  const fromUnknown = parseProspectFile('prospects.dat', csv);
  assert.equal(fromUnknown.rows.length, 1);

  // Unknown extension with a zip payload → xlsx path.
  const xlsxBuf = makeZip([
    { name: 'xl/sharedStrings.xml', content: SHARED_STRINGS },
    { name: 'xl/worksheets/sheet1.xml', content: SHEET },
  ]);
  const fromZip = parseProspectFile('export.bin', xlsxBuf);
  assert.equal(fromZip.rows.length, 2);

  assert.throws(
    () => parseProspectFile('old.xls', csv),
    /Legacy \.xls not supported/
  );
});
