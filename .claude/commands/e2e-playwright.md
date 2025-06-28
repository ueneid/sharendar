---
allowed-tools: Bash(npm run:*), Bash(npx playwright test:*), Bash(npx @playwright/mcp:*), FileSystem, Playwright(playwright.*)
description: Generate and execute a comprehensive Playwright e2e test suite via the Playwright MCP server.
---

# /project:e2e-playwright – Automated E2E test generation

`/project:e2e-playwright [BASE_URL]`

- **BASE_URL** (optional) – Root URL of the running dev server (default: `http://localhost:3000`).

---

## Usage Rules for Playwright MCP

To ensure secure and predictable behavior, the following restrictions apply when using the Playwright MCP server:

### Strict Prohibitions

1. **No code execution of any kind**
   - Do not attempt to control the browser via Python, JavaScript, Bash, or any other scripting language.
   - Do not execute arbitrary code to investigate or manipulate the MCP tool.
   - Do not use subprocesses or command execution to indirectly control the browser.

2. **Only direct invocation of supported MCP tools is allowed**
   - e.g., `playwright:browser_navigate`, `playwright:browser_screenshot`, or other documented Playwright MCP actions.

3. **On error, report immediately**
   - Do not attempt workarounds or alternative logic.
   - Do not recover silently.
   - Always report the exact error message as received.

---

## Workflow

1. **Verify dev server**
   - Ping `$ARGUMENTS` if it's not empty, or `http://localhost:3000`.
   - If unreachable, launch it with `npm run dev` and wait for a 200 OK health-check.

2. **Connect Playwright MCP**
   - Ensure the `playwright` MCP server is connected (`claude mcp list`).
   - Use an **isolated** browser context to avoid flaky state.

3. **Auto-explore**
   - Starting at the root page, recursively crawl same-origin links and SPA routes.
   - Maintain a queue of discovered paths to avoid loops.

4. **Generate tests**
   - For each unique flow, create a resilient Playwright test:
     - Navigate via `page.goto()` (or SPA navigation).
     - Use `getByRole`, `getByLabel`, `getByTestId` selectors.
     - Cover valid & invalid inputs, edge cases, auth flows.
   - Save as `tests/e2e/<slug>.spec.ts`.

5. **Execute & report**
   - Run `npx playwright test --reporter=line --workers=4`.
   - If failures occur, attempt one auto-fix & re-run.
   - Print coverage summary. Warn if < 80 % routes covered.

---

## Snippets

### Generate playwright.config.ts if necessary

Sample:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
});
```

---

## Commit

When done, stage new/updated files under `tests/e2e/` and commit with message:

```
test(e2e): auto-generated Playwright suite via MCP
```

Be careful with the target branch. Do not commit to the main branch.

---

## Output

Return the final `npx playwright test` summary and coverage table.
