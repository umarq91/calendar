'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tag } from '@/components/editorial/primitives';

import { sendInviteSchema, type SendInviteInput } from './schema';
import { sendInvite } from './_actions';

type Status = 'idle' | 'sending';

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

  const defaultStart = useMemo(() => roundedLocal(60), []);
  const defaultEnd = useMemo(() => roundedLocal(90), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendInviteInput>({
    resolver: zodResolver(sendInviteSchema),
    defaultValues: {
      recipient_email: '',
      recipient_name: '',
      summary: '',
      description: '',
      location: '',
      start_local: defaultStart,
      end_local: defaultEnd,
    },
  });

  const pending = status !== 'idle';

  async function onSubmit(values: SendInviteInput) {
    setServerError(null);
    setStatus('sending');
    const tId = toast.loading('Sending invite…');

    const result = await sendInvite(values);

    if (!result.ok) {
      toast.error(result.error, { id: tId });
      setServerError(result.error);
      setStatus('idle');
      return;
    }

    toast.success(`Invite sent to ${result.recipientEmail}.`, { id: tId });
    setStatus('idle');
    reset({
      ...values,
      recipient_email: '',
      recipient_name: '',
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
        caption="The verified Gmail SMTP connection used for this invite."
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

      <Section number="02" title="recipient" caption="Who receives the invite.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Recipient email" error={errors.recipient_email?.message}>
            <Input
              {...register('recipient_email')}
              type="email"
              placeholder="alice@example.com"
              disabled={pending}
            />
          </Field>
          <Field label="Recipient name (optional)" error={errors.recipient_name?.message}>
            <Input
              {...register('recipient_name')}
              placeholder="Alice Founder"
              disabled={pending}
            />
          </Field>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Start" error={errors.start_local?.message}>
            <Input
              {...register('start_local')}
              type="datetime-local"
              disabled={pending}
            />
          </Field>
          <Field label="End" error={errors.end_local?.message}>
            <Input
              {...register('end_local')}
              type="datetime-local"
              disabled={pending}
            />
          </Field>
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
          {pending ? 'sending…' : 'send invite →'}
        </Button>
        <p className="text-[13px] text-[var(--color-ink-black)] max-w-xs">
          The recipient receives a real calendar invite with RSVP buttons.
        </p>
      </div>
    </form>
  );
}

/** "YYYY-MM-DDTHH:MM" rounded forward by `addMinutes` minutes, to the nearest 15. */
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
