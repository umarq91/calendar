/**
 * Convert CSV text into recipient lines compatible with `parseRecipients`.
 * Each row yields `Name <email>` or bare `email`. Header rows (no email cell)
 * are dropped automatically. Quoted cells with embedded commas are supported.
 */

const EMAIL_RE = /[^\s<>@,;"]+@[^\s<>@,;"]+\.[^\s<>@,;"]+/;

export function parseCsvToRecipientLines(text: string): string[] {
  const out: string[] = [];
  for (const row of text.split(/\r?\n/)) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    const cells = splitCsvRow(trimmed);

    let email: string | undefined;
    let name: string | undefined;
    for (const cell of cells) {
      if (!cell) continue;
      const m = cell.match(EMAIL_RE);
      if (m && !email) {
        email = m[0];
        continue;
      }
      if (!m && !name) {
        name = cell;
      }
    }
    if (!email) continue;
    out.push(name ? `${name} <${email}>` : email);
  }
  return out;
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}
