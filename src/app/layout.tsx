import type { Metadata } from 'next';
import { DM_Sans, Anton, Caveat } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

const anton = Anton({
  variable: '--font-display-anton',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const caveat = Caveat({
  variable: '--font-hand-caveat',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'invitewave — bulk invites, your SMTP',
  description: 'Send calendar invites through your own SMTP server.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${anton.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--color-paper-white)] text-[color:var(--color-ink-black)]">
        {children}
      </body>
    </html>
  );
}
