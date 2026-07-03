import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeWrapper } from '@/components/ThemeWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Church Volunteer Platform',
  description: 'Volunteer matching, attendance, and points for our church community.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeWrapper>
          <AuthProvider>{children}</ThemeWrapper>
        </ThemeWrapper>
      </body>
    </html>
  );
}
