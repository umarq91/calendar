'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, ExternalLink, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { GMAIL, smtpFormSchema, type SmtpFormInput } from '../schema';
import { verifySmtpConfig } from '../_actions';

type Status =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'sending' }
  | { kind: 'saving' };

export function SmtpForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SmtpFormInput>({
    resolver: zodResolver(smtpFormSchema),
    defaultValues: {
      label: 'Gmail',
      from_name: '',
      from_email: '',
      host: GMAIL.host,
      port: GMAIL.port,
      secure: GMAIL.secure,
      username: '',
      password: '',
      reply_to: '',
    },
  });

  const pending = status.kind !== 'idle';

  async function onSubmit(values: SmtpFormInput) {
    setServerError(null);
    setStatus({ kind: 'verifying' });
    const tId = toast.loading('Verifying connection…');

    const sendTimer = setTimeout(() => {
      setStatus({ kind: 'sending' });
      toast.loading('Sending test email…', { id: tId });
    }, 1500);

    // Lock server fields to Gmail constants regardless of any DOM tampering.
    const payload: SmtpFormInput = {
      ...values,
      host: GMAIL.host,
      port: GMAIL.port,
      secure: GMAIL.secure,
    };

    const result = await verifySmtpConfig(payload);
    clearTimeout(sendTimer);

    if (!result.ok) {
      toast.error(result.error, { id: tId });
      setServerError(result.error);
      setStatus({ kind: 'idle' });
      return;
    }

    toast.success(`Verified. Test email sent to ${result.testEmailTo}.`, { id: tId });
    setStatus({ kind: 'saving' });
    router.push('/settings/smtp');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Provider — Gmail only, fixed */}
      <Card>
        <CardHeader>
          <CardTitle>Provider</CardTitle>
          <CardDescription>
            Gmail SMTP. Other providers will be added in future updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold">
              G
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium">Gmail</div>
              <div className="text-xs text-zinc-500">
                {GMAIL.host}:{GMAIL.port} · STARTTLS
              </div>
            </div>
            <Lock className="h-4 w-4 text-zinc-400" />
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            How recipients see this connection in their inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Label" error={errors.label?.message} hint="Only you see this.">
            <Input {...register('label')} placeholder="My Gmail" disabled={pending} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="From name" error={errors.from_name?.message}>
              <Input
                {...register('from_name')}
                placeholder="Alice Founder"
                disabled={pending}
              />
            </Field>
            <Field label="From email" error={errors.from_email?.message}>
              <Input
                {...register('from_email')}
                type="email"
                placeholder="you@gmail.com"
                disabled={pending}
              />
            </Field>
          </div>

          <Field
            label="Reply-To (optional)"
            error={errors.reply_to?.message}
            hint="Where bounces and replies should go, if different from From."
          >
            <Input {...register('reply_to')} type="email" disabled={pending} />
          </Field>
        </CardContent>
      </Card>

      {/* Auth */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Your Gmail address and a Google App Password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>App Password required</AlertTitle>
            <AlertDescription>
              Gmail does not accept your normal account password over SMTP. You need an{' '}
              <strong>App Password</strong> — a 16-character code generated by Google.{' '}
              <a
                href={GMAIL.appPasswordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                Generate one
                <ExternalLink className="h-3 w-3" />
              </a>
              . 2-Step Verification must be enabled on the Google account first.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gmail address" error={errors.username?.message}>
              <Input
                {...register('username')}
                type="email"
                autoComplete="username"
                placeholder="you@gmail.com"
                disabled={pending}
              />
            </Field>
            <Field
              label="Gmail App Password"
              error={errors.password?.message}
              hint="16 characters from myaccount.google.com/apppasswords"
            >
              <Input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="abcd efgh ijkl mnop"
                disabled={pending}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Locked SMTP fields — hidden inputs carry values; visible block shows they're fixed */}
      <input type="hidden" {...register('host')} value={GMAIL.host} readOnly />
      <input
        type="hidden"
        {...register('port', { valueAsNumber: true })}
        value={GMAIL.port}
        readOnly
      />
      <input type="hidden" {...register('secure')} value={String(GMAIL.secure)} readOnly />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            SMTP settings (locked for Gmail)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <ReadOnly label="Host" value={GMAIL.host} />
            <ReadOnly label="Port" value={String(GMAIL.port)} />
            <ReadOnly label="Encryption" value="STARTTLS" />
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {status.kind === 'verifying' && 'Verifying connection…'}
          {status.kind === 'sending' && 'Sending test email…'}
          {status.kind === 'saving' && 'Saving…'}
          {status.kind === 'idle' && 'Verify and save'}
        </Button>
        <p className="text-xs text-zinc-500">
          We&apos;ll send a test email to your account before saving.
        </p>
      </div>
    </form>
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
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-500">{label}</Label>
      <Input value={value} readOnly disabled className="bg-zinc-50 dark:bg-zinc-900/40" />
    </div>
  );
}
