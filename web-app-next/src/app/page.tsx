export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center py-20 px-8">
        <main className="max-w-4xl mx-auto text-center">
          <header className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-4xl font-semibold text-gray-800 mb-4">
              Inbox Triage App
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              A web-based email triage companion that helps you summarise email
              threads, understand attachments and generate reply drafts — all
              running primarily on-device using Chrome&apos;s built-in AI.
            </p>
          </header>
        </main>
      </div>
    </div>
  );
}
