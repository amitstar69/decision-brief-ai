# Decision Brief AI

Minimal Next.js + OpenRouter app that turns pasted text into a structured executive decision brief.

## Tech stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- OpenRouter (LLM backend)
- API route: `POST /api/chat`

## Local / Codespaces setup

1. Install dependencies:

```bash
npm install
```

Create .env.local in the project root:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Run the dev server:

```bash
npm run dev
```

Open the app at http://localhost:3000 (or the forwarded port in Codespaces).

Environment variables

OPENROUTER_API_KEY — required. Get it from your OpenRouter dashboard.

Ensure `.env.local` is ignored by git (Next.js template usually already does this via `.gitignore`).
