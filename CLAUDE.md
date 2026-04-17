# Industry English - Project Context

## What is this
Personalized industry-specific English learning app. Users learn vocabulary, phrases, and nuances unique to their industry, not generic textbook English. The key insight is that the same English word can mean completely different things across industries.

## Tech Stack
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Web Speech API for TTS
- Seed JSON + localStorage for MVP
- Future migration to Supabase and Claude API

## Design Principles
- Dark mode base with amber and gold accents (whisky/beverage industry feel)
- Mobile-first responsive
- No Inter font — use distinctive display fonts
- Card-based UI with swipe feel
- Japanese as primary UI language, English content for learning

## Architecture Decisions
- Scenes and industries are NOT hardcoded. Generic data model — any industry/scene can be added.
- MVP uses F&B industry with 4 preset scenes as seed data.
- Data layer abstracted for future Supabase migration.
- All user state (bookmarks, progress, quiz results) stored in localStorage.

## Key Domain Terms
- **Scene**: A specific business situation where English is used (e.g., brand strategy meeting, business dining)
- **Keyword**: An industry-specific term with `meaning_industry` + `meaning_general` comparison
- **Shadowing**: Listening to example sentence and repeating aloud for pronunciation practice

## File Structure Convention
- Components: PascalCase — `KeywordCard.tsx`
- Utilities: camelCase — `tts.ts`, `storage.ts`
- Data: `src/data/seed.json`
- Types: centralized in `src/types/index.ts`
