import Link from 'next/link';
import { listEvents } from '@/data/events';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { Calendar } from 'lucide-react';
import { EventsBrowser } from './_components/events-browser';

export const metadata = { title: 'events — let’s calendar' };

export default async function EventsListPage() {
  const events = await listEvents();

  if (events.length === 0) {
    return (
      <div className="max-w-3xl">
        <Tag>03 · events</Tag>
        <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
          no events
          <br />
          yet.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
          Each batch you send shows up here with per-recipient status.
        </p>
        <Divider className="my-12" />
        <div className="border border-dashed border-[var(--color-gray-300)] bg-[var(--color-pure-white)] p-10 text-center">
          <Calendar className="h-6 w-6 mx-auto text-[var(--color-electric-blue)]" />
          <h2 className="font-display mt-4 text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
            send your first batch.
          </h2>
          <Button asChild className="mt-6 h-11 px-5">
            <Link href={ROUTES.send}>send invite →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <EventsBrowser events={events} />;
}
