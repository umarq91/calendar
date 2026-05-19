import { cn } from '@/lib/utils';
import { UnderlineScribble } from './annotations';

/** Page meta bar — top or bottom, project tag + page label. */
export function MetaBar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'editorial-meta flex items-center justify-between w-full',
        className,
      )}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

/** Tag pill — uppercase, blue outline. */
export function Tag({
  children,
  solid = false,
  className,
}: {
  children: React.ReactNode;
  solid?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn('editorial-tag', solid && 'editorial-tag-solid', className)}
    >
      {children}
    </span>
  );
}

/** Rotated vertical section label. Position via wrapper. */
export function VerticalLabel({
  children,
  className,
  size = '2.5rem',
}: {
  children: React.ReactNode;
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={cn('editorial-vlabel', className)}
      style={{ fontSize: size }}
    >
      {children}
    </span>
  );
}

/** Display headline (lowercase, Anton, tight). Use h1/h2 via `as` prop. */
export function Display({
  as: Tag = 'h1',
  children,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  children: React.ReactNode;
  className?: string;
}) {
  return <Tag className={cn('font-display', className)}>{children}</Tag>;
}

/** Underlined word — wrap a span of text with a blue scribble below. */
export function Underlined({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <UnderlineScribble className="absolute left-0 right-0 -bottom-2 h-3 w-full" />
    </span>
  );
}

/** Horizontal divider. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[var(--color-gray-300)] my-8', className)} />;
}

/** Year badge — anchor work in time, per system tone rules. */
export function YearMark({ year = 2025 }: { year?: number }) {
  return (
    <span className="editorial-meta inline-flex items-center gap-1.5">
      <span className="inline-block h-px w-6 bg-[var(--color-electric-blue)]" />
      {year}
    </span>
  );
}
