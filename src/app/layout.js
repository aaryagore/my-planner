import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'My Planner — Stay Organized, Stay Calm',
  description:
    'A personal planner for tasks, habits, focus sessions, and projects. Plan your day, track your progress, and stay consistent.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
