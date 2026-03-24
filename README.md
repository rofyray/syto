# Syto

An EdTech platform for Ghanaian primary school students (Primary 4-6), making English and Mathematics engaging and culturally relevant with AI-powered learning.

## What is Syto?

Syto helps young Ghanaian learners practice English and Mathematics through interactive quizzes, progress tracking, and a friendly AI assistant called **NAANO** — all grounded in the Ghana national curriculum with culturally familiar content (Ghanaian names, foods, locations, and cedis).

## Core Features

- **Curriculum-Aligned Quizzes** — AI-generated multiple-choice questions based on the Ghana syllabus
- **NAANO AI Assistant** — A friendly tutor that answers questions, explains concepts, and generates exercises using Ghana curriculum PDFs via RAG
- **Local Language Support** — Quiz translation and text-to-speech in 7 Ghanaian languages (Twi, Ewe, Ga, Fante, Dagbani, Gurune, Kusaal) powered by Khaya AI
- **Progress Tracking** — Scores, completion rates, learning streaks, and strong/weak topic identification
- **Culturally Relevant** — Ghanaian names, foods, locations, currency, and flag-themed design throughout
- **Responsive Design** — Works on mobile and desktop with dark/light mode

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand
- **Backend**: Express.js on Netlify Functions (serverless)
- **Database**: Supabase (PostgreSQL + Auth + pgvector)
- **AI**: Claude (Anthropic) + OpenAI Embeddings + Khaya AI (translation & TTS)
- **Caching**: Upstash Redis

## Getting Started

```bash
npm install
npm run dev    # Frontend (:5173) + Backend (:3001)
```

Requires a `.env.development` file with Supabase, Anthropic, OpenAI, Upstash Redis, and Khaya AI credentials.

## Deployment

Push to `main` for auto-deploy on Netlify. Set environment variables in the Netlify dashboard.

## Contributing

Contributions welcome! Fork, branch, commit, and open a PR.

## License

MIT

---

**Built with ❤️💛💚🖤 for Ghanaian students**
