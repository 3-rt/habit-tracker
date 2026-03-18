# Monthly Dashboard Consistency Design

## Goal

Add a dashboard-level monthly overview that helps users judge consistency over time across all habits, using a calendar heatmap where each day’s color reflects completion rate for the habits scheduled on that date.

## Product Direction

- Scope is the dashboard overview, not per-habit detail pages.
- Primary visualization is a monthly calendar heatmap.
- The heatmap focuses on consistency over time across all active habits.
- Color intensity represents daily completion rate, not raw count.
- The first supporting metric is fully completed days, with additional useful insights shown underneath the heatmap.

## Definitions

### Daily aggregate

For each date in the selected month:

- `scheduled`: number of active habits scheduled for that date
- `completed`: number of those scheduled habits completed on that date
- `completionRate`: `completed / scheduled`, or `0` when `scheduled === 0`

### Fully completed day

A day where:

- `scheduled > 0`
- `completed === scheduled`

This means the user completed every habit that should have been done on that date.

## Recommended Layout

Keep the current dashboard structure and add a dedicated monthly card below the weekly stats card in the right-hand column.

Recommended right-column order:

1. Existing weekly summary block
2. New `This Month` card

The monthly card should contain:

- a month navigation header
- the calendar heatmap grid
- a compact insight row directly underneath

This separates weekly and monthly time scales cleanly and gives the monthly view enough space to be readable.

## Monthly Card Design

### Calendar

- Use a familiar month calendar layout aligned to weekdays.
- Each day cell shows a background intensity mapped from `completionRate`.
- Days outside the selected month are visually muted or omitted.
- Days with no scheduled habits should appear neutral rather than “bad.”
- The current day can have a subtle outline or emphasis, but this is secondary to completion intensity.

### Insight row

The insight row should live immediately under the calendar and initially include:

- fully completed days
- monthly completion rate
- longest streak this month or current streak within the month

`Fully completed days` is the most important insight and should be visually prominent.

## Data Design

### API strategy

Recommended: extend `GET /api/stats` so the dashboard still performs one stats fetch. The response should include existing weekly data plus a new monthly summary payload.

Example response addition:

```ts
interface MonthlySummaryDay {
  date: string;
  scheduled: number;
  completed: number;
  completion_rate: number;
  fully_completed: boolean;
}

interface MonthlySummary {
  month: string; // YYYY-MM
  days: MonthlySummaryDay[];
  fully_completed_days: number;
  completion_rate: number;
  longest_streak_in_month: number;
}
```

The endpoint should support a `month=YYYY-MM` query parameter for dashboard month navigation.

### Aggregation rule

Monthly aggregation must use schedule-aware totals, not “all active habits.” This is especially important because current weekly summary logic counts all active habits as the denominator for every day, which is not correct for scheduled-only reporting.

The monthly feature should explicitly use the same schedule rules as the dashboard checklist:

- daily, weekly, interval, monthly: counted only on scheduled dates
- x-per-week and x-per-month: counted according to the app’s visibility/completion model, with a documented rule for monthly aggregation

Recommended first-version rule for `x_per_week` and `x_per_month`:

- Treat them as scheduled every day until their quota is met for the current period, matching the existing dashboard visibility semantics.

That keeps the monthly view aligned with what the user sees on the dashboard for a given date.

## UI Behavior

- Default to the current month on first load.
- Allow month navigation from the monthly card header.
- Navigation updates only the monthly summary section; it should not interfere with today’s habit list.
- The first version is overview-only; day click drill-down is out of scope.

## Component Boundaries

Recommended component additions and updates:

- `components/dashboard/MonthlyHeatmap.tsx`
  - renders the month grid and color logic
- `components/dashboard/StatsPanel.tsx`
  - fetches and renders monthly summary alongside existing weekly stats
- `app/api/stats/route.ts`
  - computes and returns monthly summary data
- `lib/types.ts`
  - adds monthly summary types

Keep `WeeklyHeatmap.tsx` unchanged rather than forcing weekly and monthly rendering into one component.

## Testing Strategy

### API / logic

- verify monthly daily aggregates respect scheduled habits only
- verify `completion_rate` is calculated from `completed / scheduled`
- verify fully completed day detection
- verify month navigation fetches the requested month
- verify no-schedule days remain neutral and do not count as fully completed

### Components

- verify the monthly card renders on the dashboard
- verify the correct number of day cells for the selected month
- verify insight values render from API data
- verify month navigation updates the displayed month

### Regression coverage

- existing weekly summary still renders correctly
- existing dashboard checklist behavior is unchanged

## Open Product Choice

The one product choice to settle during implementation is whether the third insight under the heatmap should be:

- current streak within the month, or
- longest streak this month

Recommendation: longest streak this month, because it better reflects month-scale consistency and is easier to interpret in the context of a monthly heatmap.
