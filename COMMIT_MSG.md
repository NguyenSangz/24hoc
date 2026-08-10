feat(ai): separate client/server AI calls; add server proxy endpoints

- Add services/gemini.client.ts (client wrappers calling /api/gemini/*)
- Update components/QuestionModal.tsx to use client wrapper
- Add server-side proxy endpoints in server.ts for deep-explanation, ai-hint, analyze-thinking

Rationale: prevent bundling @google/genai into frontend bundle and improve resilience when API key is not configured on client. See CHANGELOG.md for details.
