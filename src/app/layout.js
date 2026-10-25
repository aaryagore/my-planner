import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';

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
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <div className="page-container">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
