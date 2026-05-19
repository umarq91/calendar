import { z } from 'zod';

export const sendInviteSchema = z
  .object({
    recipient_email: z.email('Recipient must be a valid email'),
    recipient_name: z.string().max(120).optional().or(z.literal('')),
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
  });

export type SendInviteInput = z.infer<typeof sendInviteSchema>;
