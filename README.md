# Gymato

**Gymato** is a workout planning and progress-tracking application designed for both personal trainers and athletes. Trainers can create workout programs, manage athletes, and monitor their progress, while athletes can follow assigned routines, track their workouts, and review their fitness progress.

> **Current Status:** Gymato is a local-first demo application. All application data is stored in the browser's `localStorage`. Real authentication, server-side user accounts, and cross-device synchronization have not yet been implemented.

## Features

### 🏋️ Trainer Dashboard

- **Athlete Management:** Add athletes using unique IDs (e.g., `JM-4F2A91`), view their BMI, track program completion, and access individual athlete details.
- **Workout Program Builder:** Create custom workout programs from the exercise library, configuring sets, reps or duration, and rest periods for each exercise.
- **Program Assignment:** Assign reusable program templates to athletes, with each athlete receiving an independent copy, or create a custom program directly for an individual athlete.
- **Exercise Decks:** Quickly add predefined collections of exercises to a workout program, making it easier to get beginners started.
- **Subscription Model:** Supports up to three athletes on the free tier. Additional athletes require a subscription, which is currently a demo feature without real payment processing.

### 💪 Athlete Experience

- **Trainer Connection:** Select a trainer or share a unique athlete ID with a trainer to enable assignment workflows.
- **Interactive Workout Player:** Follow guided workout sessions featuring exercise animations, descriptions, step-by-step instructions, timed exercises, rest timers, and previous/next exercise navigation.
- **Progress Tracking:** Monitor completed sessions, active days, cumulative repetitions per exercise, personalized milestones (e.g., 1,000 push-ups), and estimated calorie expenditure.
- **Exercise Library:** Browse and search exercises by category, with support for favorites.

### ⚙️ General Features

- **Persian Calendar:** Displays the current date using the Solar Hijri calendar.
- **Onboarding:** Provides a first-time setup guide that can be reopened from Settings.
- **Theme Support:** Choose Light, Dark, or System theme preferences.
- **Bilingual Interface:** Switch between Persian and English, with automatic layout direction changes (RTL/LTR).
- **Data Backup and Restore:** Export and restore application data using JSON files.
- **Responsive Design:** Uses a top tab navigation on desktop and a bottom navigation bar on mobile devices.

## Calculations

### Calorie Estimation

Each exercise in `src/data/exercises.js` defines one of two calorie estimation values:

- `kcalPerRep` — Estimated calories burned per repetition (e.g., push-ups: `0.45`).
- `kcalPerMin` — Estimated calories burned per minute for timed exercises (e.g., planks: `4`).

Calories are estimated per set using the following formulas:

- **Repetition-based exercises:** `repetitions × kcalPerRep`
- **Timed exercises:** `(duration in seconds ÷ 60) × kcalPerMin`

These values are approximate averages and do not account for individual differences in body weight, exercise intensity, or technique. The interface therefore displays calorie estimates with an approximation symbol (`≈`).

### Body Mass Index (BMI)

BMI is calculated using the standard formula:

`BMI = weight (kg) ÷ height (m)²`

The application uses commonly recognized WHO BMI categories:

| BMI | Category |
|---|---|
| Below 18.5 | Underweight |
| 18.5–24.9 | Normal weight |
| 25.0–29.9 | Overweight |
| 30.0 and above | Obesity |

BMI is a general screening indicator and does not directly measure body fat or body composition. Gymato uses it for general informational purposes.

## Exercise Library and Animations

Gymato includes **16 predefined exercises**:

- Push-ups
- Squats
- Plank
- Lunges
- Pull-ups
- Dumbbell Bench Press
- Biceps Curls
- Deadlifts
- Burpees
- Jumping Jacks
- Treadmill
- Hamstring Stretch
- Crunches
- Leg Raises
- Russian Twists
- Mountain Climbers

Each exercise includes Persian and English names, targeted muscle groups, equipment requirements, difficulty level, a description, step-by-step instructions, safety tips, and default sets, repetitions or duration, and rest periods.

### Exercise Animations

Each exercise has two key poses defined in `src/data/poses.js`. An animated SVG stick figure transitions between these poses to demonstrate the movement.

If a GIF animation is available for an exercise, it automatically replaces the stick-figure animation.

To add a GIF, place it in the following location:

```text
public/exercises/<exercise-id>.gif
```

For example:

```text
public/exercises/pushup.gif
```

Create the `public/exercises/` directory if it does not exist. The filename must exactly match the exercise's ID.

## Roadmap

Potential future improvements include:

- Real user registration and authentication backed by a server.
- Cloud database integration and cross-device data synchronization.
- Real subscription billing for trainers.
- Multi-session weekly workout plans. Currently, all exercises in a program belong to a single workout session.
- Calendar-based workout history, including date viewing and editing.
- Unit tests for calculation logic and data selectors in `src/lib/`.
- Real GIF animations for all exercises.

## Contributing

Contributions are welcome.

1. Create a feature branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes and verify that the production build completes successfully:

   ```bash
   npm run build
   ```

3. Commit your changes and push the branch:

   ```bash
   git add .
   git commit -m "Add your feature description"
   git push -u origin feature/your-feature-name
   ```

4. Open a Pull Request against `main`, including a brief description of the changes and instructions for testing them.

**Code guidelines:**

- Keep components small and focused on a single responsibility.
- Place data-related logic in `src/lib/` or `src/hooks/` rather than embedding it directly in JSX.
- Follow the existing project structure and coding conventions.


