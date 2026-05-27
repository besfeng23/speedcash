import './globals.css';
import { ClientRoot } from './ClientRoot';

export const metadata = {
  title: 'Speedcash',
  description: 'Speedcash application dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
