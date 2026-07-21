import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata = {
  title: 'Signal 0xL',
  description: 'Signal 0xL Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased bg-bg-primary text-text-primary min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
