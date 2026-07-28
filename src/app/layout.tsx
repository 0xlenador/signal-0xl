import { Outfit, Space_Grotesk, Geist } from 'next/font/google';
import { ReactNode } from 'react';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={cn(outfit.variable, spaceGrotesk.variable, "font-sans", geist.variable)}>
      <body className="antialiased bg-bg-primary text-text-primary min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
