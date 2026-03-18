# AutofillGPT - Browser Extension

A Chrome browser extension that automatically fills job application forms using AI. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🤖 AI-powered form autofill
- 📝 Support for various job application forms
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast and lightweight
- 🔧 Easy customization through options page

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/extension.git
cd extension
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

## Development

### Development Mode

To start the development server with hot reloading:

```bash
npm run watch
```

Or with yarn:
```bash
yarn watch
```

This will:
- Watch for file changes and rebuild automatically
- Generate development builds in the `dist` folder
- Enable hot reloading for faster development

### Production Build

To create a production build:

```bash
npm run build
```

Or with yarn:
```bash
yarn build
```

This will:
- Create optimized production builds
- Minify and bundle all assets
- Generate the final extension files in the `dist` folder

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the `dist` folder from your project directory
5. The extension should now appear in your extensions list

## Project Structure

```
extension/
├── src/
│   ├── assets/          # Static assets (images, CSS)
│   ├── background/      # Service worker scripts
│   ├── contentScript/   # Content scripts for web pages
│   ├── formpage/        # Form page components
│   ├── options/         # Extension options page
│   ├── popup/           # Extension popup components
│   └── static/          # Static files (manifest.json, icons)
├── dist/                # Build output directory
├── webpack.common.js    # Common webpack configuration
├── webpack.dev.js       # Development webpack config
├── webpack.prod.js      # Production webpack config
└── package.json         # Project dependencies and scripts
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Webpack** - Module bundler
- **Chrome Extension Manifest V3** - Extension API

## Dependencies

### Development Dependencies
- `@types/chrome` - Chrome extension type definitions
- `@types/react` - React type definitions
- `webpack` - Module bundler
- `ts-loader` - TypeScript loader for webpack
- `tailwindcss` - CSS framework
- `postcss` - CSS post-processor

### Production Dependencies
- `@azure/storage-blob` - Azure blob storage client
- `axios` - HTTP client
- `react-icons` - Icon library
- `react-modal` - Modal component
- `react-phone-number-input` - Phone input component
- `react-router-dom` - Routing library

## Building for Distribution

1. Run the production build:
   ```bash
   npm run build
   ```

2. The built extension will be in the `dist` folder

3. To create a distributable ZIP file:
   - Navigate to the `dist` folder
   - Select all files and create a ZIP archive
   - The ZIP file can be uploaded to the Chrome Web Store

## Troubleshooting

### Common Issues

1. **Extension not loading**: Make sure you're loading the `dist` folder, not the `src` folder
2. **Build errors**: Ensure all dependencies are installed with `npm install`
3. **TypeScript errors**: Check that TypeScript is properly configured in `tsconfig.json`

### Development Tips

- Use the browser's developer tools to debug the extension
- Check the extension's background page console for service worker logs
- Use the `chrome://extensions/` page to reload the extension after changes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

---

**Note**: This extension requires appropriate permissions to function. Make sure to review the permissions in `manifest.json` before installing.








● applyGOAT — Project Overview

  ---
  The Problem

  Job hunting is repetitive and exhausting. Every time a candidate applies for a job, they face the same forms asking for the same information — first name,
   last name, email, phone, address, work history, education, LinkedIn URL, salary expectations, work authorization status, and dozens of other fields. A
  serious job seeker might apply to 20–50 jobs per week, filling out the exact same data hundreds of times across completely different websites. Each job
  portal (Workday, LinkedIn, Indeed, Greenhouse, etc.) has its own form structure, its own field names, its own navigation patterns. There is no standard.
  The candidate's time is wasted on data entry instead of on crafting tailored cover letters or preparing for interviews.

  ---
  The Core Idea

  applyGOAT (the extension is internally called "applyGOAT") is a browser extension that acts as a personal autofill agent for job applications. The user
  enters their profile information once — name, contact details, work experience, education, projects, salary expectations, visa status, etc. — on the
  applygoat.com web platform. From that point on, every time they visit a job application page, the extension recognizes the site, fetches their saved
  profile, and fills in all the form fields automatically.

  The user goes from spending 10–15 minutes per application on data entry to clicking one button (or having it fill automatically on page load).

  ---
  How It Is Solved

  The solution has three distinct layers working together:

  ---
  Layer 1 — The Data Store (Backend + Local Cache)

  The user's profile lives on a Bubble.io backend (api.autofilljobs.com). When the extension loads, it identifies the user via their signed-in Chrome/Edge
  Google account email (chrome.identity.getProfileUserInfo()), fetches their full profile from the API, and saves it to chrome.storage.local under the key
  formData.

  The local cache means the extension works even without an internet connection after the first sync. The data structure is normalized into a clean internal
   format:

  formData = {
    data: {
      details: { firstName, lastName, email, phoneNumber, city, state,
                 linkedinUrl, githubUrl, expectedSalary, workAuthorization,
                 visaSponsorship, gender, nationality, noticePeriod, ... }
      workExperiences:   [{ companyName, jobTitle, description, startDate, endDate }]
      educationExperiences: [{ collegeName, courseName, startDate, endDate }]
      projectExperiences:   [{ title, description, technologies, link }]
    }
  }

  ---
  Layer 2 — Site Detection & Routing (contentScript.ts)

  A content script is injected into every webpage the user visits. On page load it:

  1. Checks window.location.hostname to identify which job portal the user is on
  2. Fetches the locally cached formData
  3. Routes execution to the correct site-specific filling script

  workday.*          → fillWorkdayForm()
  greenhouse.io      → fillGreenhouseFields()
  icims.com          → autofillICIMS()
  oracle.com         → fillOracleForm()
  zoho.com           → fillZohoForm()
  successfactors.com → fillSuccessFactorsForm()
  lever.co           → fillLeverForm()
  smartrecruiters.com→ fillSmartRecruitersForm()
  linkedin.com/jobs/ → fillLinkedInForm()
  indeed.com         → automateIndeedApplication()
  everything else    → generic regex-based filler

  The user can also click "Fill Application" in the popup to trigger a manual refill at any time.

  ---
  Layer 3 — The Form Filling Engine (Two Strategies)

  This is where the technical complexity lives. The challenge is that each job portal renders forms differently — different HTML structures, different input
   attributes, different frameworks (React, Angular, plain HTML), different validation triggers.

  Strategy A — Site-Specific Scripts (for major portals)

  Each major portal has a hand-crafted script tuned to its exact DOM structure. These scripts handle things the generic engine cannot:

  - Workday — Uses complex ARIA-based dropdowns, shadow DOM, and multi-step wizard navigation
  - LinkedIn Easy Apply — Opens a modal, steps through up to 15 pages, answers questions using keyword matching (e.g. "Are you authorized to work?" → checks
   workAuthorization field), handles Yes/No radios, numeric experience questions, and skill ratings
  - Indeed — Manages two separate domains (indeed.com for job listing, smartapply.indeed.com for the actual form in an iframe)
  - Oracle — Uses MutationObserver to watch for URL path changes (/section/1, /section/2) and fills personal info, education, and work experience on the
  correct step
  - ICIMS — The application lives inside an <iframe>, so the script reaches into the iframe's document to find and fill fields
  - Lever — Uses React's internal value setter (Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set) because simply setting .value
  doesn't trigger React's state update

  Each script dispatches input, change, and blur events after filling — this is critical because modern frameworks (React, Vue, Angular) use these events to
   update their internal state and run validation. Without them, the form appears filled visually but the framework doesn't register the values.

  Strategy B — Generic Regex-Based Filler (for all other sites)

  For the long tail of company-specific career pages and lesser-known portals, the generic engine in autoFormFill/ kicks in. It works by:

  1. Querying all form elements — input, textarea, select, radio buttons, date inputs
  2. Matching each field against a library of regex patterns — For example, a field with name="first_name" or placeholder="First Name" or a label saying
  "Given Name" all match the firstName pattern
  3. Matching strategy (in order):
    - Input attributes: name, id, class, title, placeholder
    - Associated <label for="inputId"> element
    - Text content of the parent element (up to 2 levels up)
  4. Handling experience sections — Detects if the page has sections labelled "Work Experience", "Education", or "Projects", clicks the "Add" button the
  correct number of times (once per saved experience entry), waits for the DOM to update, then fills each entry

  The regex patterns cover 50+ field types and are carefully written without the /g flag — a critical detail because using /g makes regex objects stateful
  in JavaScript (the lastIndex carries over between .test() calls in a loop, causing random match failures).

  ---
  Analytics — Tracking Applications

  The extension also tracks every job the user applies to. When a form is submitted, or when the user clicks "Add Job to Analytics", the extension saves the
   job title, URL, and timestamp to chrome.storage.local["savedJobsAnalytics"]. This data feeds into an analytics dashboard (built in the formpage entry
  point) that shows the user their application history, how many jobs they've applied to, and when.

  ---
  The Full User Journey

  1. User installs extension
     → Extension identifies user via Google sign-in email
     → Fetches profile from applygoat.com backend
     → Saves to local storage

  2. User visits a job listing (e.g. LinkedIn, Workday, Indeed)
     → Extension detects the portal
     → On page load, if autofill is enabled → fills forms automatically
     → OR user clicks "Fill Application" in the popup

  3. Form fields are filled
     → Framework-compatible events dispatched (input/change/blur)
     → Validation triggers on the site's side

  4. User submits application
     → Extension detects the form submit or confirmation page
     → Saves the job to analytics storage

  5. User can view their applications in the dashboard
     → See history, count, and status of all applications

  ---
  What Makes It Hard

  - No standard form structure — Every portal invents its own HTML. There is no universal name="first_name". Workday uses data-automation-id attributes.
  Indeed uses iframes. LinkedIn uses React and ARIA roles. Oracle watches URL path changes.
  - JavaScript frameworks don't respond to simple value assignment — Setting input.value = "John" does nothing in React. The framework's internal state is
  separate from the DOM. You must either trigger synthetic events or use React's internal native input value setter.
  - Multi-step forms — Many portals break the application into 5–15 pages with navigation buttons. The extension must handle page transitions, wait for DOM
  updates, and know which step it's on.
  - Timing — Dynamic forms load content asynchronously. Fields don't exist in the DOM at page load time. Scripts use MutationObserver, setTimeout, and
  promise-based polling to wait for elements to appear before filling them.
  - Iframes — Some portals (ICIMS, Indeed SmartApply) put the entire application inside an iframe from a different subdomain. The extension must detect and
  reach into the correct iframe's document.

  ---
  In One Sentence

  applyGOAT is a browser extension that stores a job seeker's profile once and automatically fills any job application form — on any of the major job
  portals or any generic career page — so that applying for a job takes seconds instead of minutes.

✻ Sautéed for 56s