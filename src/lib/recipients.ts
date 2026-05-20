/**
 * Parse a free-form recipient list into normalized entries.
 * Accepts newlines, commas, and semicolons as separators.
 * Each token may be `email`, `<email>`, or `Name <email>` (quotes optional).
 */

export type ParsedRecipient = { email: string; name?: string };

export type RecipientParseResult = {
  recipients: ParsedRecipient[];
  invalid: string[];
  duplicates: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipients(raw: string): RecipientParseResult {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const recipients: ParsedRecipient[] = [];
  const invalid: string[] = [];
  let duplicates = 0;

  for (const token of tokens) {
    const match = token.match(/^(?:"?([^"<]*?)"?\s*<\s*)?([^\s<>]+@[^\s<>]+)\s*>?$/);
    if (!match) {
      invalid.push(token);
      continue;
    }
    const email = match[2].toLowerCase();
    const name = match[1]?.trim() || undefined;
    if (!EMAIL_RE.test(email)) {
      invalid.push(token);
      continue;
    }
    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }
    seen.add(email);
    recipients.push(name ? { email, name } : { email });
  }

  return { recipients, invalid, duplicates };
}
