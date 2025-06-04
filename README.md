# Syto EdTech Platform

An innovative EdTech platform designed specifically for Primary 4-6 students in Ghana, making English Language and Mathematics engaging, fun, and culturally relevant.

## Features

- 📚 Curriculum-aligned content for Primary 4-6
- 🎯 Interactive learning modules for English and Mathematics
- 🤖 AI-powered learning assistant (Chale)
- 📊 Progress tracking and analytics
- 🌙 Dark/Light theme support
- 📱 Responsive design for all devices

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
- Vite

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/syto.git
   cd syto
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
syto/
├── src/
│   ├── components/    # Reusable UI components
│   ├── lib/          # Utilities and helpers
│   ├── pages/        # Page components
│   ├── stores/       # State management
│   └── styles/       # Global styles
├── public/           # Static assets
└── supabase/        # Database migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.