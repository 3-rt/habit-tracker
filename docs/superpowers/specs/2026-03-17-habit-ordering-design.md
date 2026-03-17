# Habit Ordering Design

## Goal

Allow habits to appear in a user-defined order across the manage screen and dashboard so higher-priority routines, such as morning skincare, can stay above lower-priority habits such as going to the gym.

## Scope

- Persist manual ordering for active habits.
- Let users reorder active habits with drag-and-drop in the Manage page.
- Reuse the saved order anywhere habits are listed for execution, especially the dashboard checklist.
- Keep archived habits out of the active reorder interaction.

## Non-Goals

- Reordering archived habits.
- Separate pinned/favorite sections.
- Automatic priority rules based on schedule or completion history.

## Recommended Approach

Add a `sort_order` column to the `habits` table and treat it as the single source of truth for display order. The Manage page will render active habits in that order and allow drag-and-drop reordering. When the user drops a habit, the client will send the full reordered list of active habit IDs to the server, which will rewrite `sort_order` values in one transaction.

This approach fits the app’s current architecture:

- The app already persists order for multi-step habit steps via `sort_order`.
- Both the dashboard and manage page already fetch habits from the API, so returning habits in `sort_order` order keeps display behavior consistent.
- A bulk reorder update is simpler and less fragile than issuing many incremental “move up/down” requests.

## Data Model

### `habits.sort_order`

- Type: `INTEGER NOT NULL`
- Meaning: lower values appear first
- Initialization for new habits: append to the end of the active list
- Backfill for existing rows: assign based on current creation ordering so existing users keep a stable order after the schema change

Archived habits will retain their `sort_order`, but active-habit reordering will only rewrite active rows. This keeps unarchive behavior predictable without adding a separate archive-order concept.

## API Design

### `GET /api/habits`

- Return habits ordered by `sort_order ASC`, with a stable tie-breaker like `created_at DESC` or `id DESC` only as fallback.
- Apply the same ordering whether archived habits are included or not.

### `POST /api/habits`

- When creating a habit, assign `sort_order` to the next available position among active habits.

### Reorder update

Add a bulk reorder update path for habits. Two reasonable shapes:

1. `PUT /api/habits/reorder`
2. `PUT /api/habits` with a reorder payload

Recommended: `PUT /api/habits/reorder`, because it isolates reorder semantics from normal habit editing and keeps validation straightforward.

Request body:

```json
{
  "habitIds": [3, 1, 2]
}
```

Server behavior:

- Validate that all supplied IDs exist and are active.
- Rewrite `sort_order` sequentially in one transaction.
- Return the reordered active habits in their saved order.

## UI Design

### Manage Page

- Active habits become draggable cards.
- Each card gets a visible drag handle so the affordance is obvious.
- Dragging should reorder only within the active section.
- Archived habits remain non-draggable and continue rendering in their own section.
- On drop, the list updates optimistically, then persists in the background.
- If persistence fails, restore the previous order and surface a lightweight inline or console-visible error.

### Dashboard

- No new controls.
- The dashboard checklist should render visible habits in the persisted order returned by the API after schedule filtering.

## Interaction Details

- Reordering should feel immediate: update local state on drag end before awaiting the network round trip.
- The drag target should be the card itself or a clear handle area; the handle is preferred to avoid accidental drags while editing or archiving.
- Keyboard-accessible reordering is not a hard requirement for this iteration, but the component structure should not block adding it later.

## Error Handling

- If the reorder API rejects the request, revert the optimistic list state.
- If newly created habits cannot determine the next sort position, fail habit creation rather than inserting a null order.
- If legacy databases are missing `sort_order`, initialization must backfill it before any ordered reads occur.

## Testing Strategy

### Database / init

- Verify schema initialization creates or backfills `sort_order`.
- Verify existing habits get deterministic sort values in prior display order.

### API

- Verify `GET /api/habits` returns rows ordered by `sort_order`.
- Verify `POST /api/habits` appends new habits to the end.
- Verify reorder updates persist and return the new order.
- Verify archived habits are excluded from reorder payload acceptance.

### Components

- Verify the Manage habit list renders active habits in API order.
- Verify drag-and-drop reorders the local list and calls the reorder endpoint with the expected habit ID sequence.
- Verify the dashboard checklist preserves persisted order after schedule filtering.

## Open Implementation Choice

The main implementation choice is which drag-and-drop mechanism to use. Recommended: native HTML drag events first, because the app is small and currently has no drag-and-drop dependency. If that proves too brittle in tests or UX, a dedicated library can be introduced later, but it should not be the default starting point.
