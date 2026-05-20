'use client';

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tag } from '@/components/editorial/primitives';
import { DateTimePicker } from '@/components/editorial/datetime-picker';
import { parseRecipients } from '@/lib/recipients';
import { parseCsvToRecipientLines } from '@/lib/csv';
import { ROUTES } from '@/constants/routes';

import {
  sendInviteSchema,
  type SendInviteInput,
  MAX_RECIPIENTS_PER_BATCH,
} from './schema';
import { sendBulkInvite, type RecipientResult } from './_actions';

type Status = 'idle' | 'sending';

type RunSummary = {
  eventId: string;
  total: number;
  sent: number;
  failed: number;
  results: RecipientResult[];
};

export function SendInviteForm({
  fromName,
  fromEmail,
  smtpLabel,
}: {
  fromName: string;
  fromEmail: string;
  smtpLabel: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [run, setRun] = useState<RunSummary | null>(null);

  const defaultStart = useMemo(() => roundedLocal(60), []);
  const defaultEnd = useMemo(() => roundedLocal(90), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SendInviteInput>({
    resolver: zodResolver(sendInviteSchema),
    defaultValues: {
      recipients_raw: '',
      summary: '',
      description: '',
      location: '',
      start_local: defaultStart,
      end_local: defaultEnd,
    },
  });

  const recipientsRaw = useWatch({ control, name: 'recipients_raw' });
  const startLocal = useWatch({ control, name: 'start_local' });

  async function handleCsvUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = parseCsvToRecipientLines(text);
      if (lines.length === 0) {
        toast.error(`No emails found in ${file.name}.`);
        return;
      }
      const current = (getValues('recipients_raw') ?? '').trim();
      const merged = current ? `${current}\n${lines.join('\n')}` : lines.join('\n');
      setValue('recipients_raw', merged, { shouldValidate: true, shouldDirty: true });
      toast.success(`Imported ${lines.length} from ${file.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }
  const parsed = useMemo(
    () => parseRecipients(recipientsRaw ?? ''),
    [recipientsRaw],
  );
  const pending = status !== 'idle';

  async function onSubmit(values: SendInviteInput) {
    setServerError(null);
    setRun(null);
    setStatus('sending');
    const tId = toast.loading(`Sending ${parsed.recipients.length} invite${parsed.recipients.length === 1 ? '' : 's'}…`);

    const result = await sendBulkInvite(values);

    if (!result.ok) {
      toast.error(result.error, { id: tId });
      setServerError(result.error);
      setStatus('idle');
      return;
    }

    if (result.failed === 0) {
      toast.success(`Sent ${result.sent} of ${result.total}.`, { id: tId });
    } else if (result.sent === 0) {
      toast.error(`All ${result.total} failed.`, { id: tId });
    } else {
      toast.warning(`Sent ${result.sent} of ${result.total} · ${result.failed} failed.`, { id: tId });
    }

    setRun({
      eventId: result.eventId,
      total: result.total,
      sent: result.sent,
      failed: result.failed,
      results: result.results,
    });
    setStatus('idle');
    reset({
      ...values,
      recipients_raw: '',
      summary: '',
      description: '',
      location: '',
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      <Section
        number="01"
        title="sending from"
        caption="The verified Gmail SMTP connection used for this batch."
      >
        <div className="flex items-center gap-4 border border-[var(--color-ink-black)] bg-[var(--color-pure-white)] px-5 py-4">
          <span className="inline-flex h-10 w-10 items-center justify-center bg-[var(--color-ink-black)] text-[var(--color-paper-white)] font-display text-xl leading-none">
            g
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium lowercase truncate">
              {smtpLabel}
            </div>
            <div className="editorial-meta text-[var(--color-ink-black)] truncate">
              {fromName} · {fromEmail}
            </div>
          </div>
          <Tag>default</Tag>
        </div>
      </Section>

      <Section
        number="02"
        title="recipients"
        caption={`One per line, or comma/semicolon separated. Plain email or "Name <email>". Or upload a CSV. Max ${MAX_RECIPIENTS_PER_BATCH} per batch.`}
      >
        <Field label="Recipients" error={errors.recipients_raw?.message}>
          <textarea
            {...register('recipients_raw')}
            disabled={pending}
            rows={6}
            placeholder={'alice@example.com\nBob Founder <bob@example.com>\ncarol@example.com'}
            className="w-full min-w-0 rounded-[2px] border border-input bg-card px-3 py-2 text-sm font-mono transition-colors outline-none placeholder:text-[var(--color-gray-600)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={handleCsvUpload}
            disabled={pending}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
          >
            upload csv
          </Button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="editorial-meta hover:text-[var(--color-electric-blue)] underline-offset-2 hover:underline"
          >
            download sample.csv
          </button>
        </div>
        <CsvFormatGuide />
        <RecipientPreview parsed={parsed} />
      </Section>

      <Section
        number="03"
        title="event"
        caption="Title becomes the event subject and the email subject line."
      >
        <Field label="Title" error={errors.summary?.message}>
          <Input
            {...register('summary')}
            placeholder="Coffee chat"
            disabled={pending}
          />
        </Field>

        <div className="space-y-4">
          <Controller
            control={control}
            name="start_local"
            render={({ field }) => (
              <div className="space-y-2">
                <DateTimePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={pending}
                  ariaLabel="event start"
                  label="start"
                />
                {errors.start_local?.message && (
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--color-electric-blue)]">
                    {errors.start_local.message}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            control={control}
            name="end_local"
            render={({ field }) => (
              <div className="space-y-2">
                <DateTimePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  min={startLocal || undefined}
                  disabled={pending}
                  ariaLabel="event end"
                  label="end"
                />
                {errors.end_local?.message && (
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--color-electric-blue)]">
                    {errors.end_local.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <Field label="Location (optional)" error={errors.location?.message}>
          <Input
            {...register('location')}
            placeholder="Google Meet link, address, or room name"
            disabled={pending}
          />
        </Field>

        <Field label="Description (optional)" error={errors.description?.message}>
          <textarea
            {...register('description')}
            disabled={pending}
            rows={4}
            className="w-full min-w-0 rounded-[2px] border border-input bg-card px-3 py-2 text-sm md:text-sm transition-colors outline-none placeholder:text-[var(--color-gray-600)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
            placeholder="Agenda, links, anything to give context."
          />
        </Field>
      </Section>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-5 pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 px-6 text-[15px]"
        >
          {pending
            ? `sending ${parsed.recipients.length}…`
            : parsed.recipients.length > 0
              ? `send ${parsed.recipients.length} invite${parsed.recipients.length === 1 ? '' : 's'} →`
              : 'send invite →'}
        </Button>
        <p className="text-[13px] text-[var(--color-ink-black)] max-w-xs">
          Each recipient receives a personalized email with an RSVP card. Same event UID across the batch.
        </p>
      </div>

      {run && <RunResults run={run} />}
    </form>
  );
}

const SAMPLE_CSV = `name,email
Alice Founder,alice@example.com
Bob Designer,bob@example.com
carol@example.com
"Dana, VP",dana@example.com
`;

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recipients-sample.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CsvFormatGuide() {
  return (
    <details className="group border border-[var(--color-gray-300)] bg-[var(--color-pure-white)]">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-[13px] hover:bg-[var(--color-paper-white)]">
        <span className="editorial-meta">csv format</span>
        <span className="text-[var(--color-electric-blue)] group-open:rotate-45 transition-transform text-lg leading-none">
          +
        </span>
      </summary>
      <div className="border-t border-[var(--color-gray-300)] px-4 py-4 space-y-4 text-[13px]">
        <div>
          <div className="editorial-meta mb-2">accepted shapes</div>
          <ul className="space-y-1.5 list-disc list-inside text-[var(--color-ink-black)]">
            <li>One email per line (no header needed)</li>
            <li><code className="text-[var(--color-electric-blue)]">name,email</code> or <code className="text-[var(--color-electric-blue)]">email,name</code> — order doesn&apos;t matter</li>
            <li>Extra columns are ignored. First non-email cell becomes the display name</li>
            <li>Header row is optional and auto-skipped (any row without an email is dropped)</li>
            <li>Quoted cells with commas supported: <code className="text-[var(--color-electric-blue)]">&quot;Dana, VP&quot;,dana@example.com</code></li>
          </ul>
        </div>
        <div>
          <div className="editorial-meta mb-2">example</div>
          <pre className="bg-[var(--color-paper-white)] border border-[var(--color-gray-300)] px-3 py-2 text-[12px] font-mono overflow-x-auto whitespace-pre">{SAMPLE_CSV}</pre>
        </div>
      </div>
    </details>
  );
}

function RecipientPreview({ parsed }: { parsed: ReturnType<typeof parseRecipients> }) {
  const { recipients, invalid, duplicates } = parsed;
  if (recipients.length === 0 && invalid.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-[12px]">
      {recipients.length > 0 && (
        <span className="editorial-tag-solid">
          {recipients.length} valid
        </span>
      )}
      {duplicates > 0 && (
        <span className="editorial-tag">
          {duplicates} duplicate{duplicates === 1 ? '' : 's'} removed
        </span>
      )}
      {invalid.length > 0 && (
        <span className="editorial-tag border-[var(--color-electric-blue)] text-[var(--color-electric-blue)]">
          {invalid.length} invalid
        </span>
      )}
    </div>
  );
}

function RunResults({ run }: { run: RunSummary }) {
  return (
    <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)] mt-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-[var(--color-ink-black)] px-6 py-4">
        <div className="flex items-baseline gap-4">
          <Tag solid>last run</Tag>
          <span className="font-display text-[1.5rem] lowercase leading-none">
            {run.sent}/{run.total} sent
          </span>
          {run.failed > 0 && (
            <span className="text-[13px] text-[var(--color-electric-blue)]">
              {run.failed} failed
            </span>
          )}
        </div>
        <Link
          href={`${ROUTES.events}/${run.eventId}`}
          className="editorial-meta hover:text-[var(--color-electric-blue)]"
        >
          open event →
        </Link>
      </header>
      <ul className="divide-y divide-[var(--color-gray-300)]">
        {run.results.map((r) => (
          <li
            key={r.email}
            className="flex items-center justify-between gap-4 px-6 py-3 text-[13px]"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate">
                {r.name ? <span className="font-medium">{r.name} </span> : null}
                <span className="text-[var(--color-gray-600)]">{r.email}</span>
              </div>
              {!r.ok && r.error && (
                <div className="mt-1 text-[12px] text-[var(--color-electric-blue)] truncate">
                  {r.error}
                </div>
              )}
            </div>
            <span
              className={
                r.ok
                  ? 'editorial-tag-solid'
                  : 'editorial-tag border-[var(--color-electric-blue)] text-[var(--color-electric-blue)]'
              }
            >
              {r.ok ? 'sent' : 'failed'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function roundedLocal(addMinutes: number): string {
  const d = new Date(Date.now() + addMinutes * 60_000);
  const minutes = Math.ceil(d.getMinutes() / 15) * 15;
  d.setMinutes(minutes, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function Section({
  number,
  title,
  caption,
  children,
}: {
  number: string;
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-8">
      <header className="space-y-3">
        <Tag>{number}</Tag>
        <h2 className="font-display text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
          {title}
        </h2>
        {caption && (
          <p className="text-[13px] text-[var(--color-ink-black)] leading-relaxed">
            {caption}
          </p>
        )}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-[var(--color-ink-black)]">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--color-electric-blue)]">
          {error}
        </p>
      )}
    </div>
  );
}
