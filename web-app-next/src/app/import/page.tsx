export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            Import Emails
          </h1>
          <p className="text-gray-600">
            Import email threads and attachments from Gmail or Outlook using OAuth authentication.
          </p>
        </header>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Gmail Import</h2>
              <p className="text-gray-600 mb-4">
                Connect to Gmail with read-only permissions to import your emails.
              </p>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled
              >
                Connect Gmail (Coming Soon)
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Outlook Import</h2>
              <p className="text-gray-600 mb-4">
                Connect to Outlook with read-only permissions to import your emails.
              </p>
              <button 
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                disabled
              >
                Connect Outlook (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}