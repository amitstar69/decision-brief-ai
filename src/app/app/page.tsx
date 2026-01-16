'use client';

  import { useState, FormEvent, useRef } from 'react';
  import { extractTextFromFile, formatFileSize, isValidFileType } from '@/lib/documentParser';
  import Link from 'next/link';
  import { parseBrief } from '@/lib/briefParser';
  import BriefSection from '@/components/BriefSection';

  function cleanMarkdown(text: string) {
    return text
      .replace(/\*\*/g, '')         // remove bold markers
      .replace(/^#{1,6}\s*/gm, '')  // remove ### headers
      .replace(/^- \s*/gm, '')      // remove "- " bullets
      .replace(/\*\s*/gm, '');      // remove "* " bullets
  }

  type ExecLens = 'Product' | 'Revenue' | 'Ops' | 'Customer' | 'Risk';

  type QAItem = {
    role: 'user' | 'assistant';
    content: string;
  };

  export default function AppPage() {
    const [content, setContent] = useState('');
    const [lens, setLens] = useState<ExecLens>('Product');
    const [brief, setBrief] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // File upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Follow-up state
    const [question, setQuestion] = useState('');
    const [qa, setQa] = useState<QAItem[]>([]);
    const [isFollowupLoading, setIsFollowupLoading] = useState(false);

    async function handleFileUpload(file: File) {
      setFileError('');

      if (!isValidFileType(file)) {
        setFileError('Please upload a PDF, DOCX, or TXT file.');
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setFileError('File is too large. Maximum size is 10MB.');
        return;
      }

      setIsParsingFile(true);
      setUploadedFile(file);

      try {
        const extractedText = await extractTextFromFile(file);
        setContent(extractedText);
        setFileError('');
      } catch (error) {
        console.error('Error parsing file:', error);
        setFileError('Failed to parse document. Please try again.');
        setUploadedFile(null);
      } finally {
        setIsParsingFile(false);
      }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    }

    function handleRemoveFile() {
      setUploadedFile(null);
      setContent('');
      setFileError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();

      const trimmed = content.trim();
      if (!trimmed) return;

      setIsLoading(true);
      setErrorMsg('');
      setBrief('');
      setQa([]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed, lens }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setErrorMsg(data?.error || 'Error generating brief');
          setIsLoading(false);
          return;
        }

        setBrief(data.brief || '');
      } catch (err) {
        setErrorMsg('Network error');
      } finally {
        setIsLoading(false);
      }
    }

    async function handleFollowup() {
      if (!question.trim() || !brief || !content) return;

      setIsFollowupLoading(true);

      try {
        const res = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: content,
            summary: brief,
            question,
            history: qa,
          }),
        });

        const data = await res.json().catch(() => null);

        if (data?.error) {
          setQa([...qa, { role: 'user', content: question }, { role: 'assistant', content: data.error }]);
        } else {
          setQa([
            ...qa,
            { role: 'user', content: question },
            { role: 'assistant', content: data.answer },
          ]);
        }

        setQuestion('');
      } catch (err) {
        setQa([
          ...qa,
          { role: 'user', content: question },
          { role: 'assistant', content: 'Network error' },
        ]);
      } finally {
        setIsFollowupLoading(false);
      }
    }

    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-slate-50 hover:text-blue-400 transition-colors">
              Decision Brief AI
            </Link>
            <Link 
              href="/" 
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        {/* Main App */}
        <main className="flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl border border-slate-800 rounded-xl p-5 bg-slate-900/80 shadow-xl">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-slate-50">Generate Your Brief</h1>
             <p className="text-xs text-slate-500 mt-1">
    Paste your meeting transcript, PRD, or strategy doc. Select a lens. Get a decision-ready brief.
  </p>
            </div>

            {/* MAIN BRIEF FORM */}
            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Lens</label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                  value={lens}
                  onChange={(e) => setLens(e.target.value as ExecLens)}
                  disabled={isLoading || isParsingFile}
                >
                  <option value="Product">Product</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Ops">Ops</option>
                  <option value="Customer">Customer</option>
                  <option value="Risk">Risk</option>
                </select>
              </div>

              {/* FILE UPLOAD SECTION */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Upload Document (PDF, DOCX, or TXT)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      disabled={isLoading || isParsingFile}
                      className="hidden"
                    />
                    <span className="inline-block rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 
  text-slate-50">
                      {isParsingFile ? 'Processing...' : 'Choose File'}
                    </span>
                  </label>

                  {uploadedFile && (
                    <div className="flex-1 flex items-center justify-between bg-slate-800 border border-slate-700 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 
  5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-slate-300 truncate">
                          {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
              </div>

              <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
    Or Paste Meeting Transcript / Document {uploadedFile && '(append to uploaded document)'}
  </label>
                <textarea
                  className="w-full h-40 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed resize-y text-slate-50"
  placeholder="Paste your meeting transcript (Zoom, Meet, Teams), PRD, strategy memo, or Slack thread…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading || isParsingFile}
                />
              </div>

              <div className="flex items-center justify-between">
                {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
                <button
                  type="submit"
                  className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 text-white"
                  disabled={isLoading || isParsingFile || !content.trim()}
                >
                  {isLoading ? 'Generating…' : 'Generate Brief'}
                </button>
              </div>
            </form>

           {/* OUTPUT */}
            <section className="border-t border-slate-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-200">Executive Brief</h2>
                  {brief && (
                    <span className="px-3 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full border border-blue-600/30">
                      {lens} Lens
                    </span>
                  )}
                </div>
                {brief && (
                  <button
                    className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => navigator.clipboard.writeText(brief)}
                  >
                    📋 Copy All
                  </button>
                )}
              </div>

              {!brief && !isLoading && (
                <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-slate-400 text-sm mb-2">Your brief will appear here</p>
                  <p className="text-slate-500 text-xs">Upload a document or paste text to get started</p>
                </div>
              )}

              {isLoading && (
                <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-center text-slate-300 text-sm font-medium mb-1">
                    Analyzing through {lens} lens...
                  </p>
                  <p className="text-center text-slate-500 text-xs">
                    Generating your executive brief
                  </p>
                </div>
              )}

              {!isLoading && brief && (
                <div className="space-y-0">
                  {parseBrief(brief).map((section, index) => (
                    <BriefSection 
                      key={section.id} 
                      section={section} 
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              )}
            </section>


            {/* FOLLOW-UP QUESTIONS */}
            {brief && (
              <section className="mt-8 border-t border-slate-800 pt-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-2">Follow-up questions</h2>

                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                    placeholder="Ask a question…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isFollowupLoading}
                  />
                  <button
                    onClick={handleFollowup}
                    className="rounded-md bg-purple-600 px-3 py-2 text-sm hover:bg-purple-500 disabled:opacity-50 text-white"
                    disabled={isFollowupLoading}
                  >
                    {isFollowupLoading ? 'Thinking…' : 'Ask'}
                  </button>
                </div>

                <div className="space-y-3">
                  {qa.map((entry, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-md text-sm ${
                        entry.role === 'user'
                          ? 'bg-slate-800 border border-slate-700'
                          : 'bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <strong className="block mb-1 text-slate-300">
                        {entry.role === 'user' ? 'You' : 'AI'}
                      </strong>
                      <span className="text-slate-400">{cleanMarkdown(entry.content)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    );
  }

