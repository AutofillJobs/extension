# ReactJS Chrome Extension

## React 18 and TailwindCSS Supported

- [x] Webpack Compatible
- [x] TailwindCSS 3.0 Compatible
- [x] SuccessFactors Autofill Support

## SuccessFactors Autofill Feature

### Overview
Comprehensive autofill functionality for SuccessFactors career portal applications.

### Supported Sites
- `*.successfactors.eu/portalcareer*`
- `*.successfactors.com/portalcareer*`

### Features
- **Personal Information**: Name, email, phone, address
- **Work Preferences**: Travel percentage, recruiter contact
- **Education**: Level, completion status, region/country/school
- **Work Experience**: Employer, position, dates, industry, functional area
- **Smart Dropdowns**: Handles cascading dependencies (country→state, region→country→school)
- **Dynamic Content**: Retry logic for AJAX-loaded fields
- **Date Pickers**: UI5 date picker component support

### Technical Implementation
- TypeScript class-based architecture
- Robust error handling and logging
- Event dispatching for form validation
- Auto-detection of SuccessFactors sites
- Multiple fallback selectors for reliability

### Usage
The extension automatically detects SuccessFactors sites and triggers autofill. No manual intervention required.

Subscribe to my youtube channel
https://bit.ly/manshu

<a href="https://www.buymeacoffee.com/batraio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
