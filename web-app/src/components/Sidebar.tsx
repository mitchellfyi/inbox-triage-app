'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePreferences } from '../lib/preferences/context';

interface SidebarProps {
  children: React.ReactNode;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

interface SidebarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          {title}
        </h2>
        <span 
          className={`text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </div>
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

const SidebarButton: React.FC<SidebarButtonProps> = ({ 
  onClick, 
  disabled = false, 
  loading = false,
  children, 
  className = '',
  variant = 'primary'
}) => {
  const baseClasses = "w-full px-4 py-2 rounded-md font-medium transition-all duration-200 min-h-[36px] flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: disabled || loading
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    secondary: disabled || loading
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const preferences = usePreferences();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/import', label: 'Import', icon: '📥' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleExtractThread = useCallback(() => {
    // This would be implemented to extract from current email context
    // For now, we'll show a placeholder
    alert('Thread extraction would be implemented here. This would connect to Gmail/Outlook to extract the current email thread.');
  }, []);

  const handleGenerateDrafts = useCallback(() => {
    // This would trigger draft generation
    alert('Draft generation would be implemented here.');
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-lg font-semibold text-gray-800">
                Inbox Triage
              </h1>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        {!isCollapsed && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Thread Extraction */}
            <SidebarSection title="Thread Extraction" defaultExpanded={true}>
              <SidebarButton
                onClick={handleExtractThread}
                variant="primary"
              >
                Extract Current Thread
              </SidebarButton>
              <p className="text-xs text-gray-500 mt-2">
                Extract email content from Gmail or Outlook
              </p>
            </SidebarSection>

            {/* Summary Section */}
            <SidebarSection title="Summary" defaultExpanded={true}>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <h3 className="text-sm font-medium text-green-800 mb-1">TL;DR</h3>
                  <div className="text-sm text-green-700">
                    <div className="placeholder text-gray-400 italic">
                      Thread summary will appear here...
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Key Points</h3>
                  <div className="text-sm text-blue-700">
                    <div className="placeholder text-gray-400 italic">
                      Key points will appear here...
                    </div>
                  </div>
                </div>
              </div>
            </SidebarSection>

            {/* Attachments Section */}
            <SidebarSection title="Attachments" defaultExpanded={true}>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 italic">
                  No attachments found
                </div>
                <div className="text-xs text-gray-400">
                  Attachments will be displayed here when available
                </div>
              </div>
            </SidebarSection>

            {/* Reply Drafts Controls */}
            <SidebarSection title="Reply Drafts" defaultExpanded={true}>
              <div className="space-y-3">
                {/* Tone Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Friendly</option>
                    <option value="assertive">Assertive</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                {/* Guidance Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guidance
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add specific instructions for your reply drafts..."
                  />
                </div>

                {/* Voice Input Button */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    🎤
                  </button>
                  <span className="text-xs text-gray-500">
                    Click to start voice dictation
                  </span>
                </div>

                {/* Generate Button */}
                <SidebarButton
                  onClick={handleGenerateDrafts}
                  variant="primary"
                  disabled={true}
                >
                  Generate Drafts
                </SidebarButton>
              </div>
            </SidebarSection>

            {/* Generated Drafts */}
            <SidebarSection title="Generated Drafts" defaultExpanded={true}>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 italic">
                  No drafts generated yet
                </div>
                <div className="text-xs text-gray-400">
                  Reply drafts will appear here after generation
                </div>
              </div>
            </SidebarSection>

            {/* Status Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  Ready to analyse email threads
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Navigation */}
        {isCollapsed && (
          <div className="flex-1 p-2 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center p-3 rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title={item.label}
              >
                <span className="text-lg">{item.icon}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
