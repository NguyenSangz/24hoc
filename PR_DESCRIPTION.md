Summary
-------
This PR separates AI logic between client and server to avoid bundling the @google/genai SDK into the frontend. It adds server proxy endpoints and updates `QuestionModal` to call the server API through `services/gemini.client.ts`.

Files changed
-------------
- services/gemini.client.ts (new)
- components/QuestionModal.tsx (modified import)
- server.ts (added dynamic import + /api/gemini/* endpoints)
- CHANGELOG.md (added v2.3.1 entry)

Testing notes
-------------
- Run `npm install` then `npm run build` locally (use Command Prompt if PowerShell blocks scripts).
- Start server with `npm run dev` and verify:
  - Opening a question triggers calls to `/api/gemini/deep-explanation` and `/api/gemini/ai-hint`.
  - If GEMINI_API_KEY is not set, server endpoints should fail gracefully and not crash the client.

Deployment notes
----------------
- Ensure environment variable `GEMINI_API_KEY` is set on the server-side runtime.
- No client-side API keys should be exposed.
