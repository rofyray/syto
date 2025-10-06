# Syto EdTech Platform

An innovative EdTech platform designed specifically for Ghanaian Primary 4-6 students, making English Language and Mathematics engaging, fun, and culturally relevant with AI-powered learning assistance.

## Features

- 📚 **Curriculum-Aligned Content**: Ghana national curriculum for Primary 4-6
- 🎯 **Interactive Learning**: Modules → Topics → Exercises → Questions hierarchy
- 🤖 **AI Learning Assistant (NAANO)**: GPT-4o powered tutor with cultural context
- 📊 **Progress Tracking**: Scores, completion rates, and learning analytics
- 🌍 **Cultural Relevance**: Ghanaian names, foods, locations, and context
- 🌙 **Theme Support**: Dark/Light mode with Ghana flag colors
- 📱 **Responsive Design**: Mobile-first, works on all devices
- 🎓 **Personalized Content**: AI-generated exercises tailored to each student

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- React Router v6

### Backend
- Node.js + Express.js
- TypeScript
- Netlify Functions (serverless)

### Database & AI
- Supabase (PostgreSQL, Auth, RLS)
- Weaviate (vector database for curriculum content)
- OpenAI GPT-4o (AI content generation)
- Pica OneTool (RAG framework)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- Weaviate Cloud account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/syto.git
   cd syto
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.development` file in the root directory:
   ```env
   # Supabase
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key

   # API Server
   API_PORT=3001
   VITE_FRONTEND_URL=http://localhost:5173

   # AI Services
   PICA_SECRET_KEY=your-pica-key
   OPENAI_API_KEY=your-openai-key

   # Weaviate
   WEAVIATE_URL=https://your-cluster.weaviate.network
   WEAVIATE_API_KEY=your-weaviate-key

   # Environment
   NODE_ENV=development
   ```

4. **Set up the database:**
   ```bash
   # Using Supabase CLI (recommended)
   supabase db push

   # Or manually apply migrations via Supabase dashboard
   # Migrations are in: supabase/migrations/
   ```

5. **Ingest curriculum PDFs (optional):**
   ```bash
   # Place PDF syllabi in data/ directory
   npm run ingest-pdfs
   ```

6. **Start development servers:**
   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   # Backend API runs on http://localhost:3001
   ```

## Project Structure

```
syto/
├── src/
│   ├── api/                      # Backend API
│   │   ├── functions/           # Netlify Functions
│   │   ├── middleware/          # Auth, caching, rate limiting
│   │   ├── routes/              # API routes
│   │   └── server.ts            # Express server
│   ├── components/              # React components
│   │   ├── layout/             # App layout components
│   │   ├── modules/            # Learning module components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                     # Utilities and services
│   │   ├── supabase.ts         # Database client
│   │   ├── naano-agent.ts      # AI agent
│   │   ├── weaviate-client.ts  # Vector DB client
│   │   └── pdf-ingestion.ts    # PDF processing
│   ├── pages/                   # Page components
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript types
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
├── supabase/migrations/         # Database migrations
├── data/                        # Curriculum PDF files
├── public/                      # Static assets
└── netlify.toml                # Netlify deployment config
```

## Available Scripts

```bash
npm run dev              # Start frontend + backend dev servers
npm run dev:frontend     # Start Vite dev server only
npm run dev:api          # Start Express API server only

npm run build            # Build frontend
npm run build:api        # Build backend
npm run build:all        # Build both frontend and backend

npm run preview          # Preview production build
npm run ingest-pdfs      # Ingest curriculum PDFs to Weaviate
npm run test-naano-api   # Test NAANO AI API
```

## Key Features Explained

### NAANO AI Assistant
NAANO (Ghanaian slang for "friend") is an AI-powered teaching assistant that:
- Generates curriculum-aligned questions and exercises
- Answers student questions with culturally relevant examples
- Uses RAG (Retrieval-Augmented Generation) with Ghana curriculum PDFs
- Provides personalized learning support for each student

### Learning Hierarchy
1. **Modules**: Top-level learning units (e.g., "Number Operations")
2. **Topics**: Specific objectives within modules (e.g., "Addition and Subtraction")
3. **Exercises**: Interactive practice activities
4. **Questions**: AI-generated multiple-choice assessments

### Progress Tracking
- Completion status for modules, topics, and exercises
- Score tracking and attempt history
- Time spent on learning activities
- Learning streaks and analytics
- Strong/weak topic identification

## Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify

2. **Configure build settings:**
   - Build command: `npm run build:all`
   - Publish directory: `dist`
   - Functions directory: `dist-api/functions`

3. **Set environment variables** in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PICA_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `WEAVIATE_URL`
   - `WEAVIATE_API_KEY`
   - `NODE_ENV=production`

4. **Deploy:** Push to `main` branch for automatic deployment

## Database Schema

### Core Tables
- `profiles`: User information (username, grade_level, avatar_url)
- `modules`, `topics`, `exercises`, `questions`: Shared curriculum content
- `user_progress`: Student completion tracking

### AI-Generated Content
- `student_modules`, `student_topics`, `student_exercises`, `student_questions`: Personalized content
- `student_progress`: Enhanced progress tracking
- `student_learning_analytics`: Performance metrics
- `naano_generation_log`: AI generation audit trail

## Cultural Context

Syto incorporates authentic Ghanaian cultural elements:
- **Names**: Kwame, Ama, Kofi, Akosua, Yaa
- **Foods**: Banku, kenkey, jollof rice, waakye
- **Locations**: Accra, Kumasi, Cape Coast, Tamale
- **Currency**: Ghana cedis (GH₵)
- **Theme Colors**: Ghana flag (green, gold, red)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with conventional commits (`git commit -m 'feat: Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing patterns for components and API routes
- Use Tailwind CSS for styling
- Write meaningful commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for Ghanaian students**
