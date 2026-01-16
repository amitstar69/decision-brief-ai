 import Link from 'next/link';

  export default function LandingPage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="text-xl font-bold text-slate-900">
              Decision Brief AI
            </div>
            <Link 
              href="/app"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try It Free
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 text-balance">
            Transform Messy Notes Into
            <span className="text-blue-600"> Board-Ready Briefs</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto text-balance">
            AI-powered executive summaries in 30 seconds. Upload any document or paste text to generate structured decision briefs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/app"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Generate Your First Brief
            </Link>
            <a 
              href="#how-it-works"
              className="px-8 py-4 bg-white text-slate-700 text-lg font-semibold rounded-lg hover:bg-slate-50 transition-colors border-2 border-slate-200"
            >
              See How It Works
            </a>
          </div>

          {/* Trust Badge */}
          <p className="mt-8 text-sm text-slate-500">
            Powered by OpenAI GPT-4 • Free to use • No signup required
          </p>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 
  7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">5 Executive Lenses</h3>
              <p className="text-slate-600 text-sm">
                Analyze through Product, Revenue, Ops, Customer, or Risk perspectives tailored for different stakeholders.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 
  2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-Format Support</h3>
              <p className="text-slate-600 text-sm">
                Upload PDFs, DOCX, TXT files, or paste text directly. We handle the parsing seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 
  01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Follow-ups</h3>
              <p className="text-slate-600 text-sm">
                Ask questions about your brief and get instant, context-aware answers from the AI.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">30-Second Generation</h3>
              <p className="text-slate-600 text-sm">
                Get structured, board-ready briefs instantly. No more hours spent condensing information.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
              <p className="text-xl text-slate-600">Three simple steps to your executive brief</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload or Paste</h3>
                <p className="text-slate-600">
                  Upload a document (PDF, DOCX, TXT) or paste your meeting notes, emails, or any text content.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Select Your Lens</h3>
                <p className="text-slate-600">
                  Choose an executive perspective: Product, Revenue, Operations, Customer, or Risk analysis.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Get Your Brief</h3>
                <p className="text-slate-600">
                  Receive a structured executive brief with summary, impacts, decisions, risks, and action items.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Perfect For</h2>
            <p className="text-xl text-slate-600">Who benefits from Decision Brief AI</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">📊 Product Managers</h3>
              <p className="text-slate-600 text-sm">
                Transform feature requests, user feedback, and roadmap notes into clear product briefs for stakeholders.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">💼 Executives</h3>
              <p className="text-slate-600 text-sm">
                Prepare for board meetings by condensing reports, emails, and updates into actionable summaries.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">🎯 VPs & Directors</h3>
              <p className="text-slate-600 text-sm">
                Summarize team updates, project status, and strategic initiatives for leadership reviews.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">🚀 Founders</h3>
              <p className="text-slate-600 text-sm">
                Condense customer feedback, investor updates, and market research into strategic decision documents.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to transform your notes?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start generating executive briefs in seconds. No signup required.
            </p>
            <Link 
              href="/app"
              className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-xl"
            >
              Generate Your First Brief →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-lg font-semibold text-white mb-2">Decision Brief AI</p>
                <p className="text-sm">Transform notes into board-ready briefs.</p>
              </div>
              <div className="flex gap-6 text-sm">
                <a href="https://github.com/amitstar69/decision-brief-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
                <Link href="/app" className="hover:text-white transition-colors">
                  Launch App
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm">
              <p>Powered by OpenAI GPT-4 & Next.js • Built with ❤️</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
