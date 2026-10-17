# Gymato (جیماتو)

Local-first fitness coaching app: coaches build programs, athletes train and track progress.

```
npm install
npm run dev
```

## Structure

```
src/
  main.jsx            entry, imports the style parts
  App.jsx             shell + page router
  context/            AppContext: state, navigation, modal, all actions (useApp())
  hooks/              useProgramActions, useWorkoutActions, useAccountActions, useBackup,
                      useToast, useTheme, useNow, useOnboarding
  lib/                constants, format, selectors (derived data), programs, calories, body (BMI), storage
  data/               exercises, users, decks, poses (stickman), seed state
  components/
    layout/           TopBar, BottomNav, PageHead, navItems
    ui/               Sheet (modal shell), Field, Empty, Metrics, ProgressBar, Toast
    exercise/         Stickman, MoveMedia, ExerciseCard, ExercisePlanner
    athlete/          AthleteRow, AthleteBodyInfo (height / weight / BMI)
    Onboarding.jsx    first-run guide (reopen from Settings)
    ProgramCard.jsx, SessionRow.jsx
  pages/              Home (Coach/Athlete), Exercises, Programs, Progress, Athletes, Profile, Settings
  player/             WorkoutPlayer, SetCard, RestBanner, HowTo, FinishCard (no-scroll phone layout)
  modals/             ModalHost + registry.js (type -> component), Program/Account/Athlete/Exercise modals
  styles/             tokens, layout, ui, pages, modal, stickman, player, responsive
```

Open a modal with `openModal({ type: 'assign', program })`; register new ones in `modals/registry.js`.
Real exercise GIFs go in `public/exercises/<exercise-id>.gif` (the stickman is the fallback).

## Data

Starter data lives in `src/data/`: coach **عادل**, athletes **اشکان، بردیا، محمد**, and one program
**سیکس پک در ۳۰ روز** (a template plus اشکان's own copy). Calorie numbers are per-exercise averages
(`kcalPerRep` / `kcalPerMin` in `data/exercises.js`) and are shown as estimates (≈).
