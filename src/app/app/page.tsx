'use client';

  import { useState, FormEvent, useRef } from 'react';
  import { extractTextFromFile, formatFileSize, isValidFileType } from '@/lib/documentParser';
  import { parseBrief } from '@/lib/briefParser';
  import BriefSection from '@/components/BriefSection';
  import Link from 'next/link';

  function cleanMarkdown(text: string) {
    return text
      .replace(/\*\*/g, '')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^- \s*/gm, '')
      .replace(/\*\s*/gm, '');
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

    // UI state
    const [showInputPanel, setShowInputPanel] = useState(true);

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
      setShowInputPanel(false);

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

    function handleNewBrief() {
      setBrief('');
      setQa([]);
      setContent('');
      setUploadedFile(null);
      setErrorMsg('');
      setShowInputPanel(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
              Decision Brief AI
            </Link>
            <div className="flex items-center gap-3">
              {brief && (
                <button
                  onClick={handleNewBrief}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  + New Brief
                </button>
              )}
              <Link 
                href="/" 
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Input Panel */}
          {showInputPanel ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Generate Decision Brief</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Paste your meeting transcript, PRD, or strategy doc to extract clear decisions and next actions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Lens Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Analysis Lens
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={lens}
                    onChange={(e) => setLens(e.target.value as ExecLens)}
                    disabled={isLoading || isParsingFile}
                  >
                    <option value="Product">Product - Features, roadmap, user experience</option>
                    <option value="Revenue">Revenue - Growth, monetization, sales</option>
                    <option value="Ops">Ops - Efficiency, processes, resources</option>
                    <option value="Customer">Customer - Satisfaction, retention, feedback</option>
                    <option value="Risk">Risk - Security, compliance, threats</option>
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Document (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        disabled={isLoading || isParsingFile}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg 
  hover:bg-slate-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 
  3m3-3v12" />
                        </svg>
                        {isParsingFile ? 'Processing...' : 'Choose File'}
                      </span>
                    </label>

                    {uploadedFile && (
                      <div className="flex-1 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 
  5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-slate-700 truncate font-medium">
                            {uploadedFile.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({formatFileSize(uploadedFile.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="ml-3 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
                </div>

                {/* Text Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste Content
                  </label>
                  <textarea
                    className="w-full h-48 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 
  focus:border-transparent resize-none"
                    placeholder="Paste your meeting transcript (Zoom, Meet, Teams), PRD, strategy memo, or Slack thread here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLoading || isParsingFile}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Tip: The more context you provide, the better the decision analysis.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-2">
                  {errorMsg && <span className="text-sm text-red-600">{errorMsg}</span>}
                  <button
                    type="submit"
                    className="ml-auto px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
  transition-colors shadow-lg hover:shadow-xl"
                    disabled={isLoading || isParsingFile || !content.trim()}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 
  7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate Decision Brief →'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowInputPanel(true)}
              className="w-full mb-8 px-4 py-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-400
  hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              📄 Edit input or create new brief
            </button>
          )}

          {/* Output Section */}
          {!brief && !isLoading && !showInputPanel && (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-slate-500 text-lg font-medium mb-2">No brief generated yet</p>
              <button
                onClick={() => setShowInputPanel(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create your first brief →
              </button>
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    Analyzing through {lens} lens...
                  </p>
                  <p className="text-sm text-slate-600">
                    Extracting decisions, options, and recommendations
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && brief && (
            <div>
              {/* Header with Lens Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Decision Brief</h2>
                  <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    {lens} Lens
                  </span>
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center 
  gap-2"
                  onClick={() => navigator.clipboard.writeText(brief)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 
  00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy All
                </button>
              </div>

              {/* Brief Sections */}
              <div className="space-y-4">
                {parseBrief(brief).map((section, index) => (
                  <BriefSection 
                    key={section.id} 
                    section={section} 
                    isFirst={index === 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {brief && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ask Follow-up Questions</h3>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 
  focus:border-transparent"
                  placeholder="What are the biggest risks? Who should make this decision?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFollowup()}
                  disabled={isFollowupLoading}
                />
                <button
                  onClick={handleFollowup}
                  className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  disabled={isFollowupLoading || !question.trim()}
                >
                  {isFollowupLoading ? 'Thinking...' : 'Ask'}
                </button>
              </div>

              {qa.length > 0 && (
                <div className="space-y-3 mt-6">
                  {qa.map((entry, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg ${
                        entry.role === 'user'
                          ? 'bg-slate-50 border border-slate-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          entry.role === 'user' 
                            ? 'bg-slate-200 text-slate-700' 
                            : 'bg-blue-200 text-blue-700'
                        }`}>
                          {entry.role === 'user' ? 'You' : 'AI'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {cleanMarkdown(entry.content)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }
