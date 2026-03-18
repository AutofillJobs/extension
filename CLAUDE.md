# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (watch mode with source maps)
npm run watch

# Production build
npm run build:chrome   # Chrome (default)
npm run build:edge     # Edge (sets BROWSER=edge env var)
npm run build          # same as build:chrome

# Output is written to /dist
```

There are no test or lint scripts configured.

## Architecture

This is a **Manifest V3 Chrome/Edge browser extension** that auto-fills job application forms using data fetched from a backend API (`https://api.autofilljobs.com/details/extension/<email>`).

### Entry Points (all compiled by Webpack to `/dist`)

| Entry | Source | Purpose |
|-------|--------|---------|
| `popup` | `src/popup/popup.tsx` | Main UI — toggle switch and "Fill Details" button |
| `background` | `src/background/background.ts` | Service worker — auth, API calls, context menus |
| `contentScript` | `src/contentScript/contentScript.ts` | Injected into all pages — detects and fills form fields |
| `options` | `src/options/options.tsx` | Options/settings page |
| `formpage` | `src/formpage/index.tsx` | Full profile management and analytics UI |

### Message Flow

1. **Popup → Content Script**: User clicks "Fill Application" → popup sends `{action: "refetchData"}` → content script retrieves data from `chrome.storage.local["formData"]` and runs the appropriate site-specific filler
2. **Popup → Content Script**: "Add Job to Analytics" → popup sends `{type: "SAVE_APPLICATION_MANUAL"}` → content script saves current page job info to `savedJobsAnalytics`
3. **Website → Content Script**: applygoat.com sends `APPLYGOAT_DATA_UPDATED` postMessage → content script calls `syncDataFromBackend()` to refresh local data

### Site Detection & Routing (contentScript.ts)

`detectSite()` checks `window.location.hostname` and routes to the correct filler:
- `workday` → `fillWorkdayForm`
- `greenhouse` → `fillGreenhouseFields`
- `icims` → `autofillICIMS`
- `oracle` → `fillOracleForm`
- `zoho` → `fillZohoForm`
- `successfactors` / `dzconnex` → `fillSuccessFactorsForm`
- `lever` → `fillLeverForm`
- `smartrecruiters` → `fillSmartRecruitersForm`
- `linkedin.com` + `/jobs/` path → `fillLinkedInForm`
- `indeed.com` + job path, or `smartapply.indeed.com` → `automateIndeedApplication`
- All other sites → generic `dataFill` (regex-based form filling)

### Generic Form Filler (autoFormFill/)

For sites not specifically handled, `formFiller.ts` → `dataFill()`:
1. Matches form fields using `fieldFiller.ts` → `fillDetails()` with regex patterns from `regexPatterns.ts`
2. Pattern matching order: input attributes (name/id/class/placeholder) → associated label → parent element text
3. Handles: text inputs, textareas, `<select>` dropdowns, radio buttons, date inputs
4. Detects Work/Education/Project sections by keyword, clicks "Add" buttons, fills each entry

**Critical**: All regex patterns in `regexPatterns.ts` must NOT use the `/g` flag — they are reused with `.test()` in loops and the `g` flag makes them stateful (lastIndex persists), causing alternating match/no-match failures.

### Data Structure

All user data is stored in `chrome.storage.local["formData"]` with this shape:
```typescript
{
  data: {
    details: {
      firstName, lastName, email, phoneNumber, linkedinUrl, githubUrl,
      city, zip, street, state, country, skills, summary,
      expectedSalary, grossSalary, noticePeriod, workAuthorization,
      visaSponsorship, gender, nationality, degree, field, ...
    },
    workExperiences: [{ companyName, jobTitle, description, startDate, endDate, location }],
    projectExperiences: [{ title, description, technologies, link, startDate, endDate }],
    educationExperiences: [{ collegeName, courseName, startDate, endDate }]
  }
}
```

Site-specific scripts receive the full `userData` object (`{data: {details, workExperiences, ...}}`).
**Exception**: `fillLinkedInForm` receives just `userData.data.details`.

### Storage Keys

| Key | Contents |
|-----|----------|
| `formData` | User profile data (main data store) |
| `toggleState` | Boolean — autofill enabled |
| `savedJobsAnalytics` | Array of saved job applications |
| `applications` | Array of career form submissions |
| `resumeBase64` / `resumeUrl` / `resumeName` | Resume file data |
| `cvBase64` / `cvUrl` / `cvName` | CV file data |
| `lastJobTitle` | Temporary — job title before navigation |

### Auth

Uses `chrome.identity.getProfileUserInfo()` to get the signed-in Chrome/Edge user's email, which is used as the key to fetch data from the backend API.

### Build System

`webpack.common.js` defines shared config; `webpack.dev.js` and `webpack.prod.js` merge in environment-specific settings. Static files in `src/static/` (including `manifest.json`) are copied to `dist` via `CopyPlugin`. TailwindCSS is processed through PostCSS.
