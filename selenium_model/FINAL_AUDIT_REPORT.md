# VoxiraApp — QA Automation & Code Audit Report

**Scan date:** 2026-07-30
**Scope:** Full source audit + live Selenium E2E execution against the Expo web build (`expo start --web`, react-native-web/Metro).
**Final live run:** 39 tests collected, **34 passed, 3 failed, 0 exceptions, 2 skipped** (skips are by design — see §3), runtime 6m06s. 87.2% pass rate. All 3 failures are confirmed product defects (BUG-001, BUG-002/BUG-003 area below) with no test-infrastructure flakiness — a genuine locator bug found during development (§4 note) was root-caused and fixed, then reverified passing 3/3 in isolation before this final run. Full detail in `reports/logs/full_run_output.txt`, `reports/html/execution_report.html`, and every sheet of `MASTER_TEST_AUDIT_REPORT.xlsx`.

## 1. What this project actually is

VoxiraApp is an **Expo/React Native 0.81 (SDK 54) app**, not a traditional server-rendered multi-page web application. It runs on iOS/Android/Web from one shared codebase via `react-native-web`. This matters for how the requested audit categories map onto reality:

| Requested category | Status | Notes |
|---|---|---|
| Payment flows | **Not present** | No Stripe/payment SDK in `package.json`. A `SubscriptionScreen` barrel export exists but the file itself does not (dead reference). |
| Role-based access / Admin | **Not present** | `profiles.level` is a self-assessed skill tier, not an auth role. No `isAdmin`/role checks anywhere. |
| Pagination | **Not present** | All lists use a fixed `.limit(50)` or client-side `.slice()`. |
| URL-based multi-page routing | **Not present** | `NavigationContainer` has no `linking` config — every screen is reached by in-app clicks only, never by URL. This is why the Selenium suite drives the UI by clicking through screens rather than visiting URLs, and why "Broken Links" testing is scoped to *external* URLs found in source rather than an in-app link crawl. |
| CRUD | **Present** | `notifications` (full CRUD), `profiles`/`user_preferences` (create/read/update, no per-row delete), `speech_sessions` (create/read only). |
| Search / Filter / Sort | **Present, client-side only** | `SearchScreen`, `SpeechHistoryScreen`, `NotificationsScreen` all filter/sort an already-fetched array in the browser; there is no backend search endpoint. |
| Upload | **Present** | Avatar image upload (Supabase Storage `avatars` bucket), audio upload (`speech-audio` bucket). |
| Download | **Stub only** | "Export Data" in `DeleteAccountScreen` just shows an `Alert` — no real file is generated. |

## 2. Methodology

1. **Discovery** — full source read of `src/`, `supabase/functions/`, and navigation config to map every screen, form, API call, and store to its file (see `audit/audit_data.py`).
2. **Framework** — Python + Selenium 4 + pytest + Page Object Model + `webdriver-manager` (auto-downloads a matching ChromeDriver for the installed Chrome 150) + `pandas`/`openpyxl`/`xlsxwriter` for reporting.
3. **DOM reconnaissance** — before writing locators, the framework launched headless Chrome against the running dev server and captured the actual rendered DOM (`reports/evidence/dom_snapshot_*.html`). This is what revealed that **react-native-web renders zero semantic HTML and zero `aria-*`/`data-testid` attributes** — every Pressable/TouchableOpacity becomes a bare `<div tabindex="0">`. All Page Object locators are therefore text-content XPath matches or `input[type=...]`/`placeholder` selectors, not ID/testID hooks (none exist to use).
4. **Live execution** — the suite runs against a real `expo start --web` dev server on `localhost:8081` with a real headless Chrome browser, not simulated/mocked. Every result in `MASTER_TEST_AUDIT_REPORT.xlsx` → *Functional Test Results* was actually observed, with a screenshot captured for every Passed/Failed/Exception outcome.

## 3. Safety decisions (read before extending this suite)

The `.env` in this project points at a **real Supabase project**. Several "obvious" E2E tests were deliberately **not** executed because they are irreversible/side-effecting against that live backend:

- **Register with valid data** — would create a real `auth.users` row and send a real confirmation email. The suite fills the form and asserts client-side validation clears, but never clicks "Create My Account".
- **Forgot Password with a plausible email** — would call `resetPasswordForEmail` and send a real email / consume Supabase's email rate limit (which `RegisterScreen.tsx` itself has custom error-handling for, implying it's been hit before). The suite only tests the *malformed-email* path, which zod blocks client-side before any network call.
- **Continue with Google** — only presence/clickability is asserted; actually clicking opens a real Google OAuth consent screen.
- **Authenticated-area tests** (dashboard, tabs, notifications CRUD, achievements, etc.) — **skipped**, not faked. No test account was created automatically. To cover this area, set `VOXIRA_TEST_EMAIL` / `VOXIRA_TEST_PASSWORD` (see `config.py`) to a real, already-provisioned test account and re-run `pytest`.

This is why the Functional Coverage sheet marks most authenticated screens **Not Covered** rather than showing fabricated passes — an honest gap is more useful than a green checkmark that didn't test anything real.

## 4. Headline findings (BUG-001 … BUG-008 in the Defect Report sheet)

1. **BUG-001 · High — `assemblyai-transcribe` and `assemblyai-poll` Edge Functions are not deployed to the live Supabase project.** Confirmed live: both return HTTP 404 at `{SUPABASE_URL}/functions/v1/...`, while the sibling `groq-analysis` function responds normally from the same project. The source for all three exists in `supabase/functions/`. As shipped, `RecordScreen → AnalyzingScreen` (the app's core feature) would fail in production.
2. **BUG-004/005/006 · High — 3 broken barrel-file exports** (`src/screens/settings/index`, `profile/index`, `speech/index`) reference component files that don't exist (`SubscriptionScreen`, `LeaderboardScreen`, `AnalysisResultScreen`). Importing any of these barrels throws a module-resolution error at build/runtime.
3. **High — zero accessibility/automation hooks app-wide.** No `accessibilityLabel`, `accessibilityRole`, or `testID` anywhere in `src/screens/` or `src/components/`. This both hurts screen-reader users and is the reason this Selenium suite had to be built entirely on text-content matching (see Accessibility Findings sheet).
4. **BUG-002 · Medium — `LoginScreen` gives no visible feedback on an empty-form submit.** Reproduced live (screenshot + console + network capture in `reports/evidence/bug_repro/`): tapping "Sign In" with both fields blank shows no error text, no spinner, nothing. `RegisterScreen` has a related symptom by design (errors are gated behind a manual `touched` flag that submit alone doesn't set) — worth deciding if that's intentional UX or a bug.
5. **Medium — 7 of 8 files in `src/components/` are empty stubs** (`Button`, `Card`, `Input`, `Avatar`, `Badge`, `ScoreRing`, `ProgressBar` — 3 bytes each, zero imports anywhere), alongside 4 empty navigation-stack stub files superseded by one 352-line `RootNavigator.tsx`.
6. **BUG-007/008 · Medium — `HelpScreen.tsx` is fully built but unreachable**, and `SplashScreen.tsx:100` targets a screen name (`'MainTabs'`) not registered in the stack it navigates within.
7. **BUG-003 · Low — ~80px horizontal overflow on WelcomeScreen** at a 1440px viewport (measured live: `scrollWidth` 1502 vs `innerWidth` 1422), reproduced consistently across 4 separate test runs.
8. **Low — two independent, overlapping web-scroll CSS fixes** (`web/index.html` inline `<style>` and `App.tsx:11-52` runtime-injected CSS), plus an unused `WebScrollView.tsx` component that looks like it was meant to replace both.
9. **Low — `LoginScreen` and `ForgotPasswordScreen` reuse the identical email-field placeholder `"you@email.com"`**, and React Navigation keeps the previous screen mounted (off-screen, zero-size) rather than unmounting it on push — discovered because it broke a Selenium locator during development of this suite (root-caused, not shipped-app-breaking, but a real duplication + a real navigator behavior worth knowing about). See `Code Health Summary` sheet and `pages/base_page.py` comments.

Full detail, file:line citations, and severity for every item above (plus everything else found) is in `MASTER_TEST_AUDIT_REPORT.xlsx`.

## 5. How to re-run this suite

```bash
cd selenium_model
pip install -r requirements.txt
# In another terminal: npx expo start --web --port 8081   (from the project root)
python run_all.py     # runs pytest (HTML report) then rebuilds the Excel workbook
```

Optional environment variables (see `config.py`): `VOXIRA_BASE_URL`, `VOXIRA_HEADLESS`, `VOXIRA_TEST_EMAIL`, `VOXIRA_TEST_PASSWORD`.

## 6. Deliverables in this folder

- `MASTER_TEST_AUDIT_REPORT.xlsx` — the single master workbook (15 sheets: Executive Summary, Functional Test Results, Functional Coverage, Defect Report, Unused Files, Dead Code, Broken Links, Accessibility Findings, API Validation Results, UI Validation Findings, Performance Observations, User Journey Results, Security Observations, Code Health Summary, Recommendations).
- `reports/html/execution_report.html` — self-contained pytest-html execution report.
- `reports/screenshots/{passed,failed,exceptions}/` — one screenshot per executed test.
- `reports/logs/` — browser console logs per test run.
- `reports/evidence/` — captured DOM snapshots used to design locators, plus debugging artifacts for the confirmed defects above.
- `pages/`, `tests/`, `utils/`, `audit/` — the reusable Page-Object-Model framework and audit data source.
