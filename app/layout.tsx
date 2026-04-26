import './globals.css';

export const metadata = {
  title: 'RAGNAROK • AWAKENED',
  description: 'The World-Ending Demon of Digital Chaos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
