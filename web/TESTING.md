# Testing guidelines – web

How we write and run tests for the Brick & Beam frontend (React + Vite).
The general rules in the root `CLAUDE.md` still apply; this file adds the frontend-specific details.

## Tools

- **Vitest** – test runner, configured in the `test` block of `vite.config.ts`.
- **jsdom** – a simulated browser DOM, so components can render without a real browser.
- **React Testing Library** (`@testing-library/react`) – renders components and finds elements.
- **jest-dom** – extra matchers like `toBeInTheDocument()` and `toHaveClass()`.
- **user-event** (`@testing-library/user-event`) – simulates clicks and typing like a real user.

`src/test/setup.ts` runs before every test file. It loads the jest-dom matchers and cleans up the DOM after each test.

## Commands

Run from the `web/` folder:

```bash
npm test                 # run all tests once (vitest run)
npm run test:watch       # watch mode while developing
npm run test:coverage    # run tests with a coverage report
```

All tests must pass before a task is considered done.

## Where tests live

- Place the test file next to the component: `StatCard.tsx` → `StatCard.test.tsx`.
- Only files matching `src/**/*.test.{ts,tsx}` are picked up.

## Testing a component

Test what the **user sees and does**, not how the component works inside.

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
    it('shows the label and value', () => {
        render(<StatCard label="Aktiva projekt" value={12} icon={null} />)

        expect(screen.getByText('Aktiva projekt')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
    })
})
```

### Finding elements

Pick queries in this order, from best to worst:

1. `getByRole` – `screen.getByRole('button', { name: 'Spara' })`. Matches how users and screen readers see the page.
2. `getByLabelText` – for form fields.
3. `getByText` – for plain text content.
4. `getByTestId` – last resort, when nothing else works.

Use `getBy…` when the element must exist, and `queryBy…` when checking that it does **not** exist:

```tsx
expect(screen.queryByText('Online')).not.toBeInTheDocument()
```

Use `findBy…` (async) for elements that appear later, e.g. after a fetch.

### User interaction

Use `user-event`, not `fireEvent`. It behaves more like a real user:

```tsx
import userEvent from '@testing-library/user-event'

it('calls onSave when the button is clicked', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SaveButton onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'Spara' }))

    expect(onSave).toHaveBeenCalledOnce()
})
```

### Components that use the router

Components with `NavLink`, `Link` or `useNavigate` need a router. Wrap them in `MemoryRouter` and set the current URL with `initialEntries`:

```tsx
render(
    <MemoryRouter initialEntries={['/project']}>
        <SidaBar />
    </MemoryRouter>,
)
```

### Components that fetch data

Never call the real backend in tests. Mock `fetch` and return the data the test needs:

```tsx
vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true })),
)
```

Restore it afterwards with `vi.restoreAllMocks()` in `afterEach`.

## What to test

For each component, cover:

- **What it renders** from its props.
- **Conditional rendering** – both when something is shown and when it is hidden.
- **Interaction** – clicks and input lead to the right result or callback.
- **Edge cases** – empty lists, zero, missing optional props, loading and error states.

## How to write tests

- One behavior per test, following **Arrange → Act → Assert** with a blank line between each part.
- Test names describe the expected behavior: `it('hides the status when none is given')`.
- Group tests for a component in one `describe` block.
- Don't test CSS styling or MUI internals. Test that the right content and state reach the user.

## Things to avoid

- **Testing implementation details** – internal state, hook calls, or class names used only for styling.
- **Snapshot tests** – they break on every small markup change and rarely catch real bugs.
- **Real network calls** – always mock `fetch`.
- **Skipped tests** (`it.skip`, `it.only`) left in committed code.

## Bug fixes

Every bug fix starts with a test that fails because of the bug. Fix the code, then check that the test passes.
