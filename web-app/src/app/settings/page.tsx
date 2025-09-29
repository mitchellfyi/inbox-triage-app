'use client';

import { useState } from 'react';
import WebhookSettings from '../../components/WebhookSettings';
import CustomInstructionsManager from '../../components/CustomInstructionsManager';
import { usePreferences } from '../../lib/preferences/context';
import { getPreferencesSummary } from '../../lib/preferences/utils';

export default function SettingsPage() {
  const preferences = usePreferences();
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleProcessingModeChange = (mode: 'on-device' | 'hybrid') => {
    preferences.updatePreferences({ processingMode: mode });
  };

  const handleToneChange = (tone: 'neutral' | 'friendly' | 'assertive' | 'formal') => {
    preferences.updatePreferences({ defaultTone: tone });
  };

  const handleGuidanceChange = (guidance: string) => {
    preferences.updatePreferences({ defaultGuidance: guidance });
  };

  const handleSignatureChange = (signature: string) => {
    preferences.updatePreferences({ signature });
  };

  const handleCloudSyncToggle = (enabled: boolean) => {
    preferences.updatePreferences({ cloudSyncEnabled: enabled });
  };

  const handleResetPreferences = async () => {
    try {
      preferences.resetPreferences();
      setShowResetConfirmation(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to reset preferences');
    }
  };

  const handleExportData = async () => {
    try {
      const exportedData = await preferences.exportData();
      
      // Create download
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inbox-triage-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to export preferences');
    }
  };

  const handleImportData = async () => {
    try {
      await preferences.importData(importData);
      setShowImportDialog(false);
      setImportData('');
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to import preferences');
    }
  };

  if (preferences.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-pulse text-gray-600">Loading preferences...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPrefs = preferences.data.preferences;
  const currentInstructions = preferences.data.instructionMemory.instructions;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            Settings
          </h1>
          <p className="text-gray-600">
            Configure your preferences for email processing and privacy settings.
          </p>
          {preferences.hasUnsavedChanges && (
            <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              Changes are saved automatically
            </div>
          )}
          {preferences.error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
              {preferences.error}
            </div>
          )}
        </header>
        
        <div className="space-y-6">
          {/* Preferences Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-2">Current Configuration</h2>
            <p className="text-gray-600">
              {getPreferencesSummary(currentPrefs, currentInstructions)}
            </p>
          </div>

          {/* Webhook Settings */}
          <WebhookSettings />
          
          {/* AI Processing Mode */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">AI Processing Mode</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="processing-mode" 
                  value="on-device" 
                  className="mr-3"
                  checked={currentPrefs.processingMode === 'on-device'}
                  onChange={() => handleProcessingModeChange('on-device')}
                />
                <span className="text-gray-700">On-device only (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="processing-mode" 
                  value="hybrid" 
                  className="mr-3"
                  checked={currentPrefs.processingMode === 'hybrid'}
                  onChange={() => handleProcessingModeChange('hybrid')}
                />
                <span className="text-gray-700">Hybrid mode (fallback to cloud when needed)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              On-device mode keeps all data local. Hybrid mode may send derived text to our servers when local processing isn&apos;t available.
            </p>
          </div>
          
          {/* Default Reply Tone */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Default Reply Tone</h2>
            <select 
              value={currentPrefs.defaultTone}
              onChange={(e) => handleToneChange(e.target.value as 'neutral' | 'friendly' | 'assertive' | 'formal')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="neutral">Neutral</option>
              <option value="friendly">Friendly</option>
              <option value="assertive">Assertive</option>
              <option value="formal">Formal</option>
            </select>
            <p className="text-sm text-gray-500 mt-2">
              This tone will be used by default when generating drafts, but can be overridden per request.
            </p>
          </div>
          
          {/* Default Guidance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Default Guidance</h2>
            <textarea 
              value={currentPrefs.defaultGuidance}
              onChange={(e) => handleGuidanceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter default instructions for reply generation..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                This guidance will be automatically included when generating reply drafts.
              </p>
              <span className="text-xs text-gray-400">
                {currentPrefs.defaultGuidance.length}/500
              </span>
            </div>
          </div>

          {/* Email Signature */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Default Email Signature</h2>
            <textarea 
              value={currentPrefs.signature}
              onChange={(e) => handleSignatureChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Your name&#10;Your title&#10;Your company"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                This signature will be automatically included in generated drafts.
              </p>
              <span className="text-xs text-gray-400">
                {currentPrefs.signature.length}/200
              </span>
            </div>
          </div>

          {/* Custom Instructions */}
          <CustomInstructionsManager
            instructions={currentInstructions}
            onAdd={preferences.addInstruction}
            onUpdate={preferences.updateInstruction}
            onDelete={preferences.deleteInstruction}
            onToggle={preferences.toggleInstruction}
            maxInstructions={preferences.data.instructionMemory.maxInstructions}
          />

          {/* Cloud Sync */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-medium text-gray-800">Cloud Synchronisation</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentPrefs.cloudSyncEnabled ? 
                    'Your preferences are synced to the cloud (when available).' : 
                    'Your preferences are stored locally on this device only.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPrefs.cloudSyncEnabled}
                  onChange={(e) => handleCloudSyncToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {currentPrefs.cloudSyncEnabled && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <strong>Privacy Notice:</strong> When cloud sync is enabled, your preferences and custom instructions 
                are encrypted and stored securely. Your email content is never synced.
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Data Management</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Export Settings
                </button>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Import Settings
                </button>
                <button
                  onClick={() => setShowResetConfirmation(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Reset to Defaults
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Export your preferences for backup or import settings from another device.
              </p>
            </div>
          </div>

          {actionError && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 text-sm" role="alert">
                {actionError}
              </div>
              <button
                onClick={() => setActionError(null)}
                className="mt-2 text-red-700 underline text-sm focus:outline-none"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reset All Preferences?</h3>
              <p className="text-gray-600 mb-6">
                This will reset all preferences to defaults and delete all custom instructions. 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPreferences}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Settings</h3>
              <p className="text-gray-600 mb-6">
                Download your preferences and custom instructions as a JSON file for backup or transfer.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Import Settings</h3>
              <p className="text-gray-600 mb-4">
                Paste the JSON data from your exported preferences file.
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
                placeholder="Paste exported JSON data here..."
              />
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportData}
                  disabled={!importData.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}