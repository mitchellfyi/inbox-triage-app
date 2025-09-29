/**
 * Component for managing custom model API keys
 * Allows users to add, edit, and test external AI provider keys
 */

'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CustomModelKey, ModelProvider } from '../types/preferences';
import { testCustomModelKey } from '../lib/ai/remote';

export interface CustomModelKeyManagerProps {
  keys: CustomModelKey[];
  selectedKeyId: string | null;
  enabled: boolean;
  maxKeys: number;
  onAdd: (key: Omit<CustomModelKey, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<CustomModelKey>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
  onToggleEnabled: (enabled: boolean) => void;
}

const PROVIDER_OPTIONS: { value: ModelProvider; label: string; description: string }[] = [
  {
    value: 'gemini',
    label: 'Google Gemini',
    description: 'Google AI generative models (Gemini 1.5 Flash/Pro)'
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT models (GPT-4o, GPT-4o mini)'
  },
  {
    value: 'anthropic',
    label: 'Anthropic Claude',
    description: 'Claude models (Claude 3.5 Sonnet, Claude 3 Haiku)'
  }
];

export default function CustomModelKeyManager({
  keys,
  selectedKeyId,
  enabled,
  maxKeys,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
  onToggleEnabled
}: CustomModelKeyManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'gemini' as ModelProvider,
    apiKey: '',
    enabled: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'gemini',
      apiKey: '',
      enabled: true
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.apiKey.trim()) {
      return;
    }

    if (editingId) {
      onUpdate(editingId, {
        name: formData.name.trim(),
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        enabled: formData.enabled
      });
    } else {
      onAdd({
        name: formData.name.trim(),
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        enabled: formData.enabled
      });
    }

    resetForm();
  };

  const handleEdit = (key: CustomModelKey) => {
    setFormData({
      name: key.name,
      provider: key.provider,
      apiKey: key.apiKey,
      enabled: key.enabled
    });
    setEditingId(key.id);
    setShowAddForm(true);
  };

  const handleTest = async (key: CustomModelKey) => {
    setTestingKey(key.id);
    try {
      const success = await testCustomModelKey(key);
      if (success) {
        alert('API key test successful! The key is working properly.');
      } else {
        alert('API key test failed. Please check the key and try again.');
      }
    } catch (error) {
      alert(`API key test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingKey(null);
    }
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 8) return '•'.repeat(apiKey.length);
    return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-medium text-gray-800">Custom Model Keys</h2>
          <p className="text-sm text-gray-500 mt-1">
            Use your own API keys for AI providers instead of built-in models.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Privacy Notice */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Privacy & Security</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• API keys are stored locally in your browser only</li>
              <li>• Keys are never logged or sent to our servers</li>
              <li>• You may incur charges from the AI provider</li>
              <li>• Rate limits apply based on your provider plan</li>
            </ul>
          </div>

          {/* Key List */}
          {keys.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Configured Keys ({keys.length}/{maxKeys})</h3>
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={`p-4 border rounded-lg ${
                      selectedKeyId === key.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="selectedKey"
                          checked={selectedKeyId === key.id}
                          onChange={() => onSelect(key.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{key.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {PROVIDER_OPTIONS.find(p => p.value === key.provider)?.label}
                            </span>
                            {!key.enabled && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                            <span>
                              {showApiKey[key.id] ? key.apiKey : maskApiKey(key.apiKey)}
                            </span>
                            <button
                              onClick={() => toggleApiKeyVisibility(key.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showApiKey[key.id] ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTest(key)}
                          disabled={testingKey === key.id}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {testingKey === key.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleEdit(key)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(key.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete key"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedKeyId === null && keys.length > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  Select a key to use custom models, or disable this feature to use built-in AI.
                </p>
              )}
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm ? (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-800 mb-3">
                {editingId ? 'Edit API Key' : 'Add New API Key'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Gemini Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as ModelProvider }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {PROVIDER_OPTIONS.find(p => p.value === formData.provider)?.description}
                  </p>
                </div>

                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Never share your API key. It will be stored securely in your browser.
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    id="keyEnabled"
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="keyEnabled" className="text-sm text-gray-700">
                    Enable this key
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Key' : 'Add Key'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={keys.length >= maxKeys}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {keys.length >= maxKeys 
                ? `Maximum ${maxKeys} keys allowed` 
                : '+ Add API Key'
              }
            </button>
          )}
        </>
      )}

      {!enabled && (
        <div className="text-center text-gray-500 py-8">
          <p>Custom model keys are disabled.</p>
          <p className="text-sm">Enable above to use your own AI provider API keys.</p>
        </div>
      )}
    </div>
  );
}