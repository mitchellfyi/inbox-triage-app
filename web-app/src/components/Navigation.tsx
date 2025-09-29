'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import WebhookNotificationBadge, { WebhookNotificationDropdown } from './WebhookNotificationBadge';

export default function Navigation() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  
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
          
          {/* Webhook notification badge */}
          <div className="relative">
            <WebhookNotificationBadge 
              onClick={() => setShowNotifications(!showNotifications)}
              className="mr-2"
            />
            <WebhookNotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}