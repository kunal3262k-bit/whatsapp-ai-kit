import { inflateRawSync } from 'node:zlib';
import type { Biz } from './outreach';

/**
 * SERVER-ONLY prospect-file parser (zero dependencies).
 *
 * Handles comma-separated text and modern binary `.xlsx` (which is just a ZIP
 * of XML parts). This module uses `node:zlib`, so it must NEVER be imported by
 * a client component — `lib/outreach.ts` stays client-safe and owns the simple
 * paste parser. Both ultimately build the same `Biz` shape.
 */

/* ------------------------------------------------------------------ */
/* Shared column mapping                                              */
/* ------------------------------------------------------------------ */

const NAME_SYNS = ['name', 'business', 'business name', 'business name / category', 'firm'];
const CATEGORY_SYNS = ['category', 'type', 'business type', 'sector'];
const AREA_SYNS = ['area', 'locality', 'location', 'city', 'area/locality'];
const PHONE_SYNS = ['phone', 'mobile', 'number', 'contact', 'whatsapp', 'phone number'];

/** Lowercase, trim, collapse whitespace and normalise slash spacing/colons. */
function normHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/[:*]+$/, '')
    .trim();
}

const HEADER_FIELDS = new Map<string, keyof Biz>();
for (const s of NAME_SYNS) HEADER_FIELDS.set(normHeader(s), 'name');
for (const s of CATEGORY_SYNS) HEADER_FIELDS.set(normHeader(s), 'category');
for (const s of AREA_SYNS) HEADER_FIELDS.set(normHeader(s), 'area');
for (const s of PHONE_SYNS) HEADER_FIELDS.set(normHeader(s), 'phone');

function headerField(cell: string): keyof Biz | null {
  return HEADER_FIELDS.get(normHeader(cell)) ?? null;
}

const HEADER_LIKE_NAME = /name|firm|business/i;
const HEADER_LIKE_PHONE = /phone|mobile|number|contact|whatsapp/i;

/**
 * Turn a rectangular grid (from CSV or a worksheet) into `Biz[]`.
 * Detects a header row and maps by synonyms, else falls back to positional
 * columns `name,category,area,phone`. Blank rows and rows without a phone are
 * dropped.
 */
export function gridToBiz(rows: readonly (readonly string[])[]): Biz[] {
  const cleaned = rows.map((row) => row.map((cell) => (cell ?? '').trim()));

  let firstIdx = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i]!.some((cell) => cell !== '')) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx === -1) return [];

  const headerCells = cleaned[firstIdx]!;
  const mapping = headerCells.map(headerField);
  const hasHeader = mapping.some((field) => field !== null);

  // When there is no recognisable header, the first row is data — but guard
  // against a plain "name,...,phone" heading being swallowed as a prospect.
  let dataStart = hasHeader ? firstIdx + 1 : firstIdx;
  if (!hasHeader) {
    const joined = headerCells.join(',');
    if (HEADER_LIKE_NAME.test(headerCells[0] ?? '') && HEADER_LIKE_PHONE.test(joined)) {
      dataStart = firstIdx + 1;
    }
  }

  const out: Biz[] = [];
  for (let i = dataStart; i < cleaned.length; i++) {
    const row = cleaned[i]!;
    if (row.every((cell) => cell === '')) continue;

    if (hasHeader) {
      const biz: Biz = { name: '', category: 'business', area: '', phone: '' };
      for (let c = 0; c < row.length; c++) {
        const field = mapping[c];
        if (!field) continue;
        const value = row[c] ?? '';
        if (field === 'name') biz.name = value;
        else if (field === 'category') biz.category = value || 'business';
        else if (field === 'area') biz.area = value;
        else if (field === 'phone') biz.phone = value;
      }
      if (!biz.phone) continue;
      out.push(biz);
    } else {
      const phone = row[3] ?? '';
      if (!phone) continue;
      out.push({
        name: row[0] ?? '',
        category: row[1] || 'business',
        area: row[2] ?? '',
        phone,
      });
    }
  }

  return out;
}

function warningFor(rows: Biz[]): string | undefined {
  if (rows.length === 0) return undefined;
  const missingName = rows.filter((r) => !r.name).length;
  if (missingName > rows.length / 2) {
    return `${missingName} of ${rows.length} rows are missing a business name — check your column headers.`;
  }
  const missingArea = rows.filter((r) => !r.area).length;
  if (missingArea > rows.length / 2) {
    return `${missingArea} of ${rows.length} rows are missing an area — check your column headers.`;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* CSV                                                                */
/* ------------------------------------------------------------------ */

/** RFC-4180-ish tokeniser: quoted fields, embedded commas/quotes/newlines. */
function tokeniseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      endField();
      i++;
      continue;
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      endRow();
      i++;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Flush trailing field/row only if there is pending content.
  if (field !== '' || row.length > 0) endRow();
  return rows;
}

export function parseProspectCsvText(text: string): Biz[] {
  return gridToBiz(tokeniseCsv(text));
}

/* ------------------------------------------------------------------ */
/* XLSX (minimal ZIP + XML reader)                                    */
/* ------------------------------------------------------------------ */

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}

/** Extract and inflate a single named entry from a ZIP buffer. */
function readZipEntry(buf: Buffer, name: string): Buffer | null {
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error('Invalid .xlsx — ZIP directory not found');
  const total = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);

  for (let n = 0; n < total; n++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== CENTRAL_SIG) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const entryName = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);

    if (entryName === name) {
      if (buf.readUInt32LE(localOffset) !== LOCAL_SIG) {
        throw new Error('Invalid .xlsx — corrupt local header');
      }
      const localNameLen = buf.readUInt16LE(localOffset + 26);
      const localExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Unsupported ZIP compression method ${method} in .xlsx`);
    }

    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function colIndex(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

function parseSharedStrings(xml: string | null): string[] {
  if (!xml) return [];
  const out: string[] = [];
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let si: RegExpExecArray | null;
  while ((si = siRe.exec(xml))) {
    const inner = si[1] ?? '';
    let text = '';
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let t: RegExpExecArray | null;
    while ((t = tRe.exec(inner))) text += decodeXml(t[1] ?? '');
    out.push(text);
  }
  return out;
}

function parseWorksheet(xml: string, shared: string[]): string[][] {
  const grid: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowXml = rowMatch[1] ?? '';
    const row: string[] = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowXml))) {
      const attrs = cellMatch[1] ?? '';
      const body = cellMatch[2] ?? '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs);
      const col = ref ? colIndex(ref[1]!) : row.length;
      const type = (/\bt="([^"]+)"/.exec(attrs)?.[1] ?? '').toLowerCase();

      let value = '';
      if (type === 'inlinestr') {
        const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        let t: RegExpExecArray | null;
        while ((t = tRe.exec(body))) value += decodeXml(t[1] ?? '');
      } else {
        const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
        if (v) {
          const raw = (v[1] ?? '').trim();
          value = type === 's' ? (shared[parseInt(raw, 10)] ?? '') : decodeXml(raw);
        }
      }

      while (row.length < col) row.push('');
      row[col] = value;
    }
    grid.push(row);
  }
  return grid;
}

export function parseProspectXlsx(buf: Buffer): Biz[] {
  const sheet = readZipEntry(buf, 'xl/worksheets/sheet1.xml');
  if (!sheet) throw new Error('Invalid .xlsx — xl/worksheets/sheet1.xml not found');
  const sharedXml = readZipEntry(buf, 'xl/sharedStrings.xml');
  const shared = parseSharedStrings(sharedXml ? sharedXml.toString('utf8') : null);
  return gridToBiz(parseWorksheet(sheet.toString('utf8'), shared));
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                           */
/* ------------------------------------------------------------------ */

function extensionOf(filename: string | undefined): string {
  if (!filename) return '';
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

function looksLikeZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function parseProspectFile(
  filename: string | undefined,
  buf: Buffer
): { rows: Biz[]; warning?: string } {
  const ext = extensionOf(filename);
  let rows: Biz[];

  if (ext === 'csv' || ext === 'txt') {
    rows = parseProspectCsvText(buf.toString('utf8'));
  } else if (ext === 'xlsx') {
    rows = parseProspectXlsx(buf);
  } else if (ext === 'xls') {
    throw new Error('Legacy .xls not supported — save as .xlsx or .csv');
  } else {
    // Unknown extension: sniff the ZIP signature, then fall back to the other
    // parser if the first choice throws.
    try {
      rows = looksLikeZip(buf) ? parseProspectXlsx(buf) : parseProspectCsvText(buf.toString('utf8'));
    } catch {
      rows = parseProspectCsvText(buf.toString('utf8'));
    }
  }

  return { rows, warning: warningFor(rows) };
}
