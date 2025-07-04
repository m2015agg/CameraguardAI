import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

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
          <div className="container mx-auto">
            {/* Just the color ribbon, no menu items */}
          </div>
        </nav>
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/events" className="text-gray-600 hover:text-gray-900">
                  Events
                </Link>
                <Link href="/reviews" className="text-gray-600 hover:text-gray-900">
                  Reviews
                </Link>
                <Link href="/tracked-objects" className="text-gray-600 hover:text-gray-900">
                  Tracked Objects
                </Link>
                <Link href="/lizi" className="text-gray-600 hover:text-gray-900">
                  Lizi Monitor
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
                <Link href="/logs" className="text-gray-600 hover:text-gray-900">
                  Logs
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
} 