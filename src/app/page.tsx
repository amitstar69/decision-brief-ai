'use client';

import { useState, FormEvent } from 'react';
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
export default function HomePage() {
  const [content, setContent] = useState('');
  const [lens, setLens] = useState<ExecLens>('Product');
  const [brief, setBrief] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Follow-up state
  const [question, setQuestion] = useState('');
  const [qa, setQa] = useState<QAItem[]>([]);
  const [isFollowupLoading, setIsFollowupLoading] = useState(false);

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-3xl border border-slate-800 rounded-xl p-5 bg-slate-900/80 shadow-xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Decision Brief AI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Paste any email, doc, or notes. Choose a lens. Generate a board-ready brief.
          </p>
        </header>

        {/* MAIN BRIEF FORM */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Lens</label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={lens}
              onChange={(e) => setLens(e.target.value as ExecLens)}
              disabled={isLoading}
            >
              <option value="Product">Product</option>
              <option value="Revenue">Revenue</option>
              <option value="Ops">Ops</option>
              <option value="Customer">Customer</option>
              <option value="Risk">Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Paste notes</label>
            <textarea
              className="w-full h-40 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed resize-y"
              placeholder="Paste your meeting notes, email, or doc…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
            <button
              type="submit"
              className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Generating…' : 'Generate Brief'}
            </button>
          </div>
        </form>

        {/* OUTPUT */}
        <section className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-200">Executive Brief</h2>
            {brief && (
              <button
                className="text-xs text-blue-400 hover:underline"
                onClick={() => navigator.clipboard.writeText(brief)}
              >
                Copy
              </button>
            )}
          </div>

          <div className="min-h-[160px] rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm whitespace-pre-wrap">
            {!brief && !isLoading && <span className="text-slate-500">Your brief will appear here…</span>}
            {isLoading && <span className="text-slate-400">Thinking like an exec…</span>}
            {!isLoading && brief && <span>{cleanMarkdown(brief)}</span>}
          </div>
        </section>

        {/* FOLLOW-UP QUESTIONS */}
        {brief && (
          <section className="mt-8 border-t border-slate-800 pt-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Follow-up questions</h2>

            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Ask a question…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isFollowupLoading}
              />
              <button
                onClick={handleFollowup}
                className="rounded-md bg-purple-600 px-3 py-2 text-sm hover:bg-purple-500 disabled:opacity-50"
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
    <strong className="block mb-1">
      {entry.role === 'user' ? 'You' : 'AI'}
    </strong>
    {cleanMarkdown(entry.content)}
  </div>
))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
