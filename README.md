# ZyloXP

ZyloXP is an EE-first learning app prototype for tech careers. The current build models a Duolingo-like loop for electrical engineering: skill path, lesson player, circuit lab, career map, and an app-ready question-bank status view.

## Scripts

- `pnpm run dev` starts the local development server.
- `pnpm run typecheck` runs TypeScript checks without writing build artifacts.
- `pnpm run build` type-checks and creates a production build.
- `pnpm run preview` serves the production build locally.

## Structure

- `src/App.tsx` contains the learner dashboard, practice flow, lab controls, career map, and bank view.
- `src/data.ts` contains seed curriculum, sample question, lab, career, and question-bank data.
- `src/styles.css` contains the responsive app styling.
- `outputs/ee_question_bank/` contains the generated electrical engineering question-bank package and diagram database.
