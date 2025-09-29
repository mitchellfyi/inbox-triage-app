import WebhookSettings from '../../components/WebhookSettings';

export default function SettingsPage() {
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
        </header>
        
        <div className="space-y-6">
          {/* Webhook Settings */}
          <WebhookSettings />
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">AI Processing Mode</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="processing-mode" 
                  value="on-device" 
                  className="mr-3"
                  defaultChecked
                />
                <span className="text-gray-700">On-device only (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="processing-mode" 
                  value="hybrid" 
                  className="mr-3"
                />
                <span className="text-gray-700">Hybrid mode (fallback to cloud when needed)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              On-device mode keeps all data local. Hybrid mode may send derived text to our servers when local processing isn&apos;t available.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Default Reply Tone</h2>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Default Guidance</h2>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter default instructions for reply generation..."
            />
            <p className="text-sm text-gray-500 mt-2">
              This guidance will be automatically included when generating reply drafts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}