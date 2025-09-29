'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: '/', label: 'Home' },
    { href: '/import', label: 'Import' },
    { href: '/settings', label: 'Settings' },
  ];
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-lg font-semibold text-gray-800">
              Inbox Triage App
            </Link>
            <div className="hidden md:flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Placeholder for webhook notification badge */}
          <div className="relative">
            {/* TODO: Add webhook notification badge when service is ready */}
            <div className="w-6 h-6 text-gray-400" title="Webhook notifications (coming soon)">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9c0-1.657-1.343-3-3-3s-3 1.343-3 3v3l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}