/**
 * Image Q&A component with drag-and-drop upload and question input
 * Uses Chrome's multimodal AI capabilities to answer questions about images
 */

import { useState, useCallback, useRef } from 'react';
import { askImageQuestionWithSummary, checkMultimodalAvailability, MultimodalAvailability } from '../lib/ai/multimodal';

interface ImageQAProps {
  className?: string;
}

interface ImageQuestion {
  id: string;
  image: File;
  imageUrl: string;
  question: string;
  answer?: string;
  isLoading: boolean;
  error?: string;
}

export default function ImageQA({ className = '' }: ImageQAProps) {
  const [imageQuestions, setImageQuestions] = useState<ImageQuestion[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [availability, setAvailability] = useState<MultimodalAvailability>(MultimodalAvailability.UNAVAILABLE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check AI availability on mount
  useState(() => {
    checkMultimodalAvailability().then(setAvailability);
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleImageFiles(imageFiles);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      handleImageFiles(imageFiles);
    }
  }, []);

  const handleImageFiles = useCallback((files: File[]) => {
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    files.forEach(file => {
      if (!supportedFormats.includes(file.type.toLowerCase())) {
        // Show error for unsupported format
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      const newImageQuestion: ImageQuestion = {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        image: file,
        imageUrl,
        question: '',
        isLoading: false,
      };

      setImageQuestions(prev => [...prev, newImageQuestion]);
    });
  }, []);

  const handleQuestionChange = useCallback((id: string, question: string) => {
    setImageQuestions(prev => 
      prev.map(item => 
        item.id === id ? { ...item, question } : item
      )
    );
  }, []);

  const handleAskQuestion = useCallback(async (id: string) => {
    const imageQuestion = imageQuestions.find(item => item.id === id);
    if (!imageQuestion || !imageQuestion.question.trim()) {
      return;
    }

    // Update loading state
    setImageQuestions(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, isLoading: true, error: undefined, answer: undefined }
          : item
      )
    );

    try {
      const imageBlob = new Blob([await imageQuestion.image.arrayBuffer()], { 
        type: imageQuestion.image.type 
      });
      
      const answer = await askImageQuestionWithSummary(imageBlob, imageQuestion.question, 600);
      
      setImageQuestions(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, isLoading: false, answer }
            : item
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get answer';
      setImageQuestions(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, isLoading: false, error: errorMessage }
            : item
        )
      );
    }
  }, [imageQuestions]);

  const handleRemoveImage = useCallback((id: string) => {
    setImageQuestions(prev => {
      const item = prev.find(item => item.id === id);
      if (item?.imageUrl) {
        URL.revokeObjectURL(item.imageUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const isAvailable = availability === MultimodalAvailability.READILY_AVAILABLE;
  const needsDownload = availability === MultimodalAvailability.AFTER_DOWNLOAD;

  if (availability === MultimodalAvailability.UNAVAILABLE) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Image Q&A Unavailable
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Multimodal AI is not available on this device. Please ensure you&apos;re using Chrome with AI features enabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Image Q&A
        </h2>
        <p className="text-gray-600 mb-6">
          Upload an image and ask questions about it. Supports PNG, JPG, and WebP formats.
        </p>

        {needsDownload && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  AI model download required. The model will be downloaded automatically when you first use this feature.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
            ${!isAvailable && !needsDownload ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Upload Image
          </p>
          <p className="text-gray-600">
            Drag and drop an image here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supports PNG, JPG, and WebP formats • Max 50MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Questions */}
      {imageQuestions.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start space-x-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              <img
                src={item.imageUrl}
                alt="Uploaded image"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => handleRemoveImage(item.id)}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Remove image
              </button>
            </div>

            {/* Question and Answer */}
            <div className="flex-1 min-w-0">
              <div className="space-y-4">
                {/* Question Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ask a question about this image:
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={item.question}
                      onChange={(e) => handleQuestionChange(item.id, e.target.value)}
                      placeholder="e.g., What does this chart show? What objects are in this image?"
                      className="flex-1 min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    />
                    <button
                      onClick={() => handleAskQuestion(item.id)}
                      disabled={!item.question.trim() || item.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-fit"
                    >
                      {item.isLoading ? 'Processing...' : 'Ask'}
                    </button>
                  </div>
                </div>

                {/* Answer */}
                {item.isLoading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm">Analysing image...</span>
                  </div>
                )}

                {item.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{item.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {item.answer && !item.isLoading && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Answer:</h4>
                        <p className="text-sm text-green-700 whitespace-pre-wrap">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {imageQuestions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No images uploaded yet. Upload an image above to start asking questions.
        </div>
      )}
    </div>
  );
}