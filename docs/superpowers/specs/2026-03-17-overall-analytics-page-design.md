# Overall Analytics Page Design

## Goal

Move the monthly consistency heatmap and related monthly insights off the dashboard and into a dedicated overall analytics page at `/insights`, while keeping the dashboard focused on today’s habits and quick weekly stats.

## Product Direction

- The new destination is a top-level overall analytics page, not a per-habit page.
- Monthly consistency becomes the primary content of that new page.
- The dashboard remains a lightweight operational view.
- The existing monthly aggregation API can be reused; this is primarily a UI and navigation reorganization.

## Recommended Structure

### Dashboard (`/`)

Keep the dashboard focused on:

- today’s habits
- weekly completion rate
- streaks
- weekly heatmap

Remove the inline monthly card from `StatsPanel`.

Add a clear navigation path to analytics, either:

- a top-level `Insights` link in the dashboard header, or
- a secondary link/button inside `StatsPanel`

Recommendation: add an `Insights` link in the dashboard header and optionally a smaller secondary CTA inside the stats card later if needed.

### Insights (`/insights`)

Create a dedicated analytics page with:

- page header and navigation back to the dashboard
- monthly consistency section as the main hero block
- month navigation
- monthly calendar heatmap
- summary insight row underneath

The first version should keep the page intentionally focused rather than filling it with placeholders.

## Insights Page Behavior

- Default to the current month on first load.
- Allow previous/next month navigation.
- Continue using daily completion rate across all scheduled habits as the heatmap color intensity.
- Continue using the existing definitions:
  - fully completed days
  - monthly completion rate
  - longest streak in the month

The page should be overview-first and non-interactive beyond month navigation for the first version. No day click drill-down is required yet.

## Data Design

No new endpoint is required.

Reuse:

- `GET /api/stats?month=YYYY-MM`

The insights page will consume:

- `monthlySummary`

The dashboard `StatsPanel` will continue consuming weekly stats from the same endpoint, but should stop rendering the monthly section.

## Component Boundaries

Recommended decomposition:

- `app/insights/page.tsx`
  - page shell and monthly analytics state
- `components/dashboard/StatsPanel.tsx`
  - weekly-only dashboard stats after extraction
- `components/dashboard/MonthlyHeatmap.tsx`
  - reused by the insights page

If the monthly insight cards become bulky, extract a small reusable monthly analytics section component, but this is optional for the first pass.

## Navigation

Add a top-level route link to `/insights` from the dashboard.

Also add a return path from `/insights` back to `/`.

This should mirror the app’s current navigation style: simple text links in the page header rather than introducing a new nav system.

## Testing Strategy

### Dashboard tests

- verify `StatsPanel` no longer renders the monthly card
- verify weekly content still renders
- verify the dashboard links to `/insights`

### Insights page tests

- verify the page renders the monthly heatmap and insight row
- verify month navigation updates the requested month
- verify the page consumes `monthlySummary` from the stats API

### Regression coverage

- monthly heatmap rendering tests remain valid
- stats API tests remain valid
- existing dashboard checklist behavior remains unchanged

## Future Growth

This page should become the home for broader reporting over time, such as:

- richer monthly trends
- strongest/weakest weeks
- completion-pattern summaries
- habit-group rollups

The first version should only establish the page and move the monthly consistency experience there cleanly, without pre-building empty sections.
