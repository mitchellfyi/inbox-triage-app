/**
 * Custom Instructions Manager component
 * Allows users to add, edit, and manage custom instructions for AI prompts
 */

'use client';

import { useState } from 'react';
import { CustomInstruction } from '../types/preferences';
import { validateInstructionContent } from '../lib/preferences/utils';

interface CustomInstructionsManagerProps {
  instructions: CustomInstruction[];
  onAdd: (instruction: Omit<CustomInstruction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<CustomInstruction>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  maxInstructions?: number;
}

export default function CustomInstructionsManager({
  instructions,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  maxInstructions = 50
}: CustomInstructionsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstruction, setNewInstruction] = useState({ name: '', content: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInstruction, setEditingInstruction] = useState({ name: '', content: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateInstructionContent(newInstruction.content);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid instruction');
      return;
    }
    
    if (!newInstruction.name.trim()) {
      setValidationError('Instruction name is required');
      return;
    }
    
    onAdd({
      name: newInstruction.name.trim(),
      content: newInstruction.content.trim(),
      enabled: true
    });
    
    setNewInstruction({ name: '', content: '' });
    setShowAddForm(false);
    setValidationError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;
    
    const validation = validateInstructionContent(editingInstruction.content);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid instruction');
      return;
    }
    
    if (!editingInstruction.name.trim()) {
      setValidationError('Instruction name is required');
      return;
    }
    
    onUpdate(editingId, {
      name: editingInstruction.name.trim(),
      content: editingInstruction.content.trim()
    });
    
    setEditingId(null);
    setEditingInstruction({ name: '', content: '' });
    setValidationError(null);
  };

  const startEdit = (instruction: CustomInstruction) => {
    setEditingId(instruction.id);
    setEditingInstruction({ name: instruction.name, content: instruction.content });
    setValidationError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingInstruction({ name: '', content: '' });
    setValidationError(null);
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setNewInstruction({ name: '', content: '' });
    setValidationError(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-medium text-gray-800">Custom Instructions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add personalised instructions that will be included in every draft generation.
          </p>
        </div>
        {instructions.length < maxInstructions && (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new custom instruction"
          >
            Add Instruction
          </button>
        )}
      </div>

      {/* Add new instruction form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-instruction-name" className="block text-sm font-medium text-gray-700 mb-1">
                Instruction Name
              </label>
              <input
                id="new-instruction-name"
                type="text"
                value={newInstruction.name}
                onChange={(e) => setNewInstruction({ ...newInstruction, name: e.target.value })}
                placeholder="e.g., Always be concise"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor="new-instruction-content" className="block text-sm font-medium text-gray-700 mb-1">
                Instruction Content
              </label>
              <textarea
                id="new-instruction-content"
                value={newInstruction.content}
                onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
                placeholder="Describe how you want the AI to behave..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {newInstruction.content.length}/500 characters
              </div>
            </div>
            {validationError && (
              <div className="text-sm text-red-600" role="alert">
                {validationError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Instruction
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructions list */}
      <div className="space-y-3">
        {instructions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No custom instructions yet.</p>
            <p className="text-sm">Add your first instruction to personalise AI responses.</p>
          </div>
        ) : (
          instructions.map((instruction) => (
            <div key={instruction.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === instruction.id ? (
                // Edit form
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={editingInstruction.name}
                      onChange={(e) => setEditingInstruction({ ...editingInstruction, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      value={editingInstruction.content}
                      onChange={(e) => setEditingInstruction({ ...editingInstruction, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      maxLength={500}
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {editingInstruction.content.length}/500 characters
                    </div>
                  </div>
                  {validationError && (
                    <div className="text-sm text-red-600" role="alert">
                      {validationError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Display mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instruction.enabled}
                          onChange={(e) => onToggle(instruction.id, e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`font-medium ${instruction.enabled ? 'text-gray-800' : 'text-gray-500'}`}>
                          {instruction.name}
                        </span>
                      </label>
                    </div>
                    <p className={`text-sm ${instruction.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                      {instruction.content}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(instruction)}
                      className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      aria-label={`Edit instruction: ${instruction.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(instruction.id)}
                      className="text-red-600 hover:text-red-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                      aria-label={`Delete instruction: ${instruction.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {instructions.length >= maxInstructions && (
        <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          You&apos;ve reached the maximum number of custom instructions ({maxInstructions}). 
          Delete some instructions to add new ones.
        </div>
      )}
    </div>
  );
}