# Habit Tracker

A simple habit tracker built with Next.js, React, TypeScript, and SQLite.

The app is centered around a straightforward daily checklist: create habits, mark them complete, and keep a lightweight record of how things are going. It also includes a small insights view for monthly consistency, but the core idea is intentionally simple.

## Features

- Daily habit checklist
- Yes/no, numeric, timed, and multi-step habits
- Notes on individual entries
- Habit management for creating, editing, reordering, and archiving habits
- Basic insights for monthly completion, streaks, and consistency

## Stack

- Next.js 14
- React 18
- TypeScript
- SQLite via `better-sqlite3`
- Vitest and Testing Library

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Available Scripts

Run the app in development:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

Run tests:

```bash
npm test
```

## App Structure

- `/` shows the main habit checklist and quick stats
- `/manage` is where habits are created and edited
- `/insights` shows the monthly consistency view

## Notes

- Data is stored locally in SQLite.
- The project is designed to stay small and easy to understand rather than trying to be a full productivity system.
