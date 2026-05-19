import { z } from 'zod';

export const smtpFormSchema = z.object({
  label: z.string().min(1, 'Required').max(60),
  from_name: z.string().min(1, 'Required').max(80),
  from_email: z.email('Invalid email'),
  host: z.string().min(1, 'Required').max(255),
  port: z.coerce.number<number>().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.email('Must be a Gmail address'),
  password: z.string().min(1, 'Required'),
  reply_to: z.union([z.email(), z.literal('')]).optional(),
});

export type SmtpFormInput = z.infer<typeof smtpFormSchema>;

// Gmail-only for this phase. Host/port/encryption locked.
export const GMAIL = {
  name: 'Gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  appPasswordUrl: 'https://myaccount.google.com/apppasswords',
} as const;
