import { z } from 'zod';
import { parseRecipients } from '@/lib/recipients';

export const MAX_RECIPIENTS_PER_BATCH = 100;

export const sendInviteSchema = z
  .object({
    recipients_raw: z.string().min(1, 'At least one recipient is required'),
    summary: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(5000).optional().or(z.literal('')),
    location: z.string().max(300).optional().or(z.literal('')),
    /** Local datetime strings from <input type="datetime-local"> — interpreted as user's local time. */
    start_local: z.string().min(1, 'Start time is required'),
    end_local: z.string().min(1, 'End time is required'),
  })
  .refine((v) => new Date(v.end_local) > new Date(v.start_local), {
    path: ['end_local'],
    message: 'End must be after start',
  })
  .superRefine((v, ctx) => {
    const parsed = parseRecipients(v.recipients_raw);
    if (parsed.recipients.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipients_raw'],
        message: 'No valid email addresses found',
      });
      return;
    }
    if (parsed.recipients.length > MAX_RECIPIENTS_PER_BATCH) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipients_raw'],
        message: `Max ${MAX_RECIPIENTS_PER_BATCH} recipients per batch (got ${parsed.recipients.length})`,
      });
    }
    if (parsed.invalid.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipients_raw'],
        message: `Invalid entries: ${parsed.invalid.slice(0, 3).join(', ')}${parsed.invalid.length > 3 ? '…' : ''}`,
      });
    }
  });

export type SendInviteInput = z.infer<typeof sendInviteSchema>;
