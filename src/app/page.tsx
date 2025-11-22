'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type ExecLens = 'Product' | 'Revenue' | 'Ops' | 'Customer' | 'Risk';

export default function HomePage() {
  const [content, setContent] = useState('');
  const [lens, setLens] = useState<ExecLens>('Product');
  const [brief, setBrief] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMsg('');
    setBrief('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, lens }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || 'Request failed';
        setErrorMsg(msg);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setBrief(data.brief || '');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-3xl border border-slate-800 rounded-xl p-5 bg-slate-900/80 shadow-xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">
            Decision Brief AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Paste any email, doc, or notes. Choose a lens. Get a board-ready decision brief.
            This tool only uses what you paste and will say &quot;Not specified in source&quot; when details are missing.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lens
            </label>
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Paste content
            </label>
            <textarea
              className="w-full h-40 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed resize-y"
              placeholder="Paste an email, PR, meeting notes, or doc here…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            {errorMsg && (
              <span className="text-xs text-red-400">
                {errorMsg === 'Brief generation failed validation'
                  ? 'Could not generate a clean brief. Try simplifying or shortening the input.'
                  : errorMsg}
              </span>
            )}
            <button
              type="submit"
              className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Generating…' : 'Generate Brief'}
            </button>
          </div>
        </form>

        <section className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Output
            </h2>
            {brief && (
              <button
                type="button"
                className="text-xs text-blue-400 hover:underline"
                title="Copy full brief to paste into email, deck, or doc"
                onClick={() => {
                  navigator.clipboard.writeText(brief);
                }}
              >
                Copy brief
              </button>
            )}
          </div>

          <div className="min-h-[160px] rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm whitespace-pre-wrap">
            {!brief && !isLoading && (
              <span className="text-slate-500">
                The structured decision brief will appear here.
              </span>
            )}
            {isLoading && (
              <span className="text-slate-400">
                Thinking like an exec…
              </span>
            )}
            {!isLoading && brief && (
              <span>{brief}</span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
