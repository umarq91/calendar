'use client';

import { useTransition } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteSmtpConfig, sendTestEmail, setDefaultSmtpConfig } from './_actions';

export function ConfigRowActions({
  configId,
  isDefault,
}: {
  configId: string;
  isDefault: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            start(async () => {
              const r = await sendTestEmail(configId);
              if (!r.ok) toast.error(r.error);
              else toast.success('Test email sent.');
            })
          }
        >
          Send test email
        </DropdownMenuItem>
        {!isDefault && (
          <DropdownMenuItem
            onClick={() =>
              start(async () => {
                const r = await setDefaultSmtpConfig(configId);
                if (!r.ok) toast.error(r.error);
                else toast.success('Default updated.');
              })
            }
          >
            Set as default
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            start(async () => {
              if (!confirm('Delete this SMTP connection?')) return;
              const r = await deleteSmtpConfig(configId);
              if (!r.ok) toast.error(r.error);
              else toast.success('Connection deleted.');
            })
          }
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
