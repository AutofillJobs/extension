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
