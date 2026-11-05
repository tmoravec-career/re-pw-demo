# Northloop desk

A static listings site and a Playwright suite in TypeScript. The site is the prop. The suite is the interview: framework, CI, reporting, and data.

Nothing here calls a third party. `npm test` starts the site, logs in once, and runs the green project. The known bug stays in a second project so the default run is green.

## Run it

Needs Node.js 18 or newer and npm. From this folder:

```bash
npm install
npx playwright install chromium
npm test
```

| Command | What it does |
| --- | --- |
| `npm run site` | Serves the site at http://127.0.0.1:4174 |
| `npm test` | Green Chromium project. Skips `@known-bug`. |
| `npm run test:smoke` | Tests tagged `@smoke` |
| `npm run test:known-bugs` | The intentional failure, with a trace |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | `tsc --noEmit` |

`npm run test:known-bugs` exits non-zero. That is the bug, not a broken suite.

[mock-site/serve.json](mock-site/serve.json) turns off clean URLs, so the address stays `listing.html?id=1`. `serve` would otherwise redirect that to `/listing?id=1`.

Log in by hand with `demo@example.com` / `demo123`. Those values come from [mock-site/data/user.json](mock-site/data/user.json). The password is a fixture seam, not an auth design.

## What to open while you talk

**Framework.** [playwright.config.ts](playwright.config.ts) has `baseURL`, the `webServer`, retries only when `CI` is set, and two projects. Specs import `test` from [src/fixtures.ts](src/fixtures.ts), not from `@playwright/test`. Page objects own locators and actions. The `listings` fixture loads the data. `authedPage` opens a context from the storage state written by [tests/auth.setup.ts](tests/auth.setup.ts).

**Data.** [mock-site/data/listings.json](mock-site/data/listings.json) is the only copy of the houses. [src/data/listings.ts](src/data/listings.ts) loads it and `expectedIds()` applies the same rules as `matches()` in [mock-site/js/app.js](mock-site/js/app.js): case-insensitive substring of address or city, inclusive max price, inclusive min beds, combined with AND. Specs assert those ids. They do not keep a second list of addresses.

**Reporting.** `npm test` writes `playwright-report/`. Screenshots are only on failure. Video is off. The default trace is `on-first-retry`. The known-bug project sets `trace: 'on'` and does not retry, so one failed run leaves a trace you can open:

```bash
npm run test:known-bugs
npx playwright show-trace test-results/**/trace.zip
```

The failure message is the requirement: pending listings cannot be saved. Sold listings already hide Save, and that test stays in the green project. On a real main branch, `test.fail()` would keep CI green and go red when the bug is fixed. Here the red project is opt-in so you can show the report on purpose.

**CI.** [.github/workflows/playwright.yml](.github/workflows/playwright.yml) runs on pushes to `main`, pull requests, and manual dispatch. It installs dependencies and Chromium, runs `npm run typecheck`, then `npm test` (the green project). It uploads the HTML report and `test-results/` even when the job fails. GitHub sets `CI`, which turns on retries, `forbidOnly`, the GitHub reporter, and a fresh server. The exit code fails the job. The artifact is what you open afterward. GitHub Actions only reads workflows from the repository root, so this folder must be the root of its repo.

## Known bug

Pending and sold listings are not supposed to be saveable. Sold hides the control. Pending still shows it. The mistake is `canSave()` in [mock-site/js/app.js](mock-site/js/app.js): it only excludes `sold`.

## Edits you can make live

Each one copies a pattern that is already in the repo. If it goes sideways, `git checkout -- <file>` puts the green suite back.

**Year built filter, about four minutes.** `yearBuilt` is already on each listing and is not a filter yet. Add `minYear?: number` to `ListingsFilter`. Teach `listingMatches()` and `matches()` to drop older houses when it is set. Add a number input labeled "Built after", read it in `readFilter()`, and fill it from `ListingsPage.filterBy()`. Add one row to the cases in [tests/data-driven-filters.spec.ts](tests/data-driven-filters.spec.ts) and run that file.

**Smoke job, about ten lines.** Copy the `test` job in the workflow. Name it `smoke` and change the run step to `npm run test:smoke`. You do not need to wait for Actions in the room.

**Report attachment, about a minute.** In the known-bug test, before the failing expect:

```ts
await test.info().attach("listing-rule", {
  body: `Listing ${pending.id} is ${pending.status}. Pending and sold listings cannot be saved.`,
  contentType: "text/plain",
});
```

Re-run `npm run test:known-bugs` and open the HTML report. The attachment is on the failed test.

**Data change, about a minute.** Add a house to `listings.json` (new id, address, city, latitude, longitude, price, beds, baths, sqft, year, home type, and status). Run `npm test` again. Counts, card ids, and map pins move because they are computed from that file. Do not type a second expected list by hand.

Search matches the address or the city. Min price, max price, beds, baths, status, and home type combine with AND. Sort changes card order only: price low to high, price high to low, or most bedrooms. The detail page estimates principal and interest from the price.

The map is drawn in the page from those coordinates. Twin Cities houses share one map. Duluth and Rochester each get their own when a pin is there. Filtering the list removes the same pins. There is no tile server to wait on.

## Layout

```
mock-site/          the product: HTML, CSS, app.js, JSON
src/data/           loader and expectedIds()
src/pages/          page objects
src/fixtures.ts     listings and authedPage
tests/              specs, plus auth.setup.ts
```

The listings page waits one second on purpose and paints "Loading listings…" in the first HTML, so the loading spec can assert visible, then hidden. It does not sleep. Other specs wait for the indicator to go away, then for cards or the empty state.
