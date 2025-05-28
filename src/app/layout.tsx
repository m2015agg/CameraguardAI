import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Camera Guard AI',
  description: 'Real-time camera monitoring with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex space-x-4">
            <a href="/" className="hover:text-gray-300">Home</a>
            <a href="/settings" className="hover:text-gray-300">Settings</a>
            <a href="/test" className="hover:text-gray-300">Test Connections</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
} 