
import './globals.css';
import { cn } from '@/lib/utils';
import { ClientRoot } from './ClientRoot';

export const metadata = {
  title: 'CPay Investor Demo',
  description: 'A secure, multi-tenant SaaS dashboard with beautiful logs and dark mode.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
