import { Tag } from '@/components/editorial/primitives';
import { UnderlineScribble } from '@/components/editorial/annotations';

export function AuthHeading({
  step,
  title,
  underline,
  description,
}: {
  step: string;
  title: React.ReactNode;
  /** Optional substring to underline visually within the title. */
  underline?: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-8 space-y-5">
      <Tag>{step}</Tag>
      <h2 className="font-display text-[3.25rem] sm:text-[3.75rem] leading-[0.95] tracking-[-0.03em] lowercase text-[var(--color-ink-black)]">
        {underline && typeof title === 'string' ? renderWithUnderline(title, underline) : title}
      </h2>
      {description && (
        <p className="text-[var(--color-ink-black)] text-[15px] leading-relaxed max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}

function renderWithUnderline(text: string, word: string) {
  const idx = text.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + word.length);
  const after = text.slice(idx + word.length);
  return (
    <>
      {before}
      <span className="relative inline-block">
        {match}
        <UnderlineScribble className="absolute left-0 right-0 -bottom-2 h-3 w-full" />
      </span>
      {after}
    </>
  );
}
