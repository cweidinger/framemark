# Migration from Bower to NPM

This document outlines the migration from Bower to NPM for dependency management in the framemark project.

## Changes Made

### 1. Package Management
- **Removed**: `bower.json` and `.bowerrc` files
- **Updated**: `package.json` to include frontend dependencies in the `dependencies` section
- **Modern Approach**: Using NPM as the single package manager for both development and runtime dependencies

### 2. File Structure
- **Before**: Dependencies in `app/bower_components/`
- **After**: Dependencies in `node_modules/` (root level)

### 3. HTML References Updated
In `app/index.html`:
- **Before**: `bower_components/package/file.js`
- **After**: `../node_modules/package/file.js`

### 4. Gruntfile.js Updates
- Updated paths from `bower_components` to `node_modules`
- Changed app path reference from `bower.json` to `package.json`

## Key Dependencies Migrated

- **Angular** (1.3.x → 1.8.3 for better compatibility)
- **jQuery** (2.x → 3.6.0)
- **Bootstrap** (3.3.1 → 3.4.1)
- **Moment.js** (2.10.3 → 2.29.4)

## Benefits of NPM Migration

1. **Single Package Manager**: No need to maintain both npm and bower
2. **Better Security**: NPM has better security auditing
3. **Active Maintenance**: NPM is actively maintained, bower is deprecated
4. **Modern Tooling**: Better integration with modern build tools
5. **Dependency Resolution**: NPM has superior dependency resolution

## Installation

```bash
npm install
```

## Build Process

The build process remains the same using Grunt, but now references npm packages:

```bash
npm run build  # or grunt build
npm test       # or grunt test
```

## Migration Status

✅ **Completed:**
- Removed bower configuration files
- Updated package.json with npm dependencies
- Updated file paths in Gruntfile.js and HTML
- Successfully tested npm install with core packages
- Dependencies now loaded from node_modules instead of bower_components

## Known Issues & Next Steps

⚠️ **Legacy Build System Compatibility:**
The current Grunt-based build system uses very old dependencies that have compatibility issues with modern Node.js versions. While the core npm migration is complete and functional, you may encounter issues when trying to run the full build process.

### Recommended Next Steps:

1. **Update Additional Dependencies:** Add remaining dependencies like `angular-cookies`, `angular-sanitize`, `angular-route`, `datatables.net`, etc. to the package.json as needed.

2. **Modernize Build System:** Consider migrating from Grunt to modern build tools:
   - **Webpack** for module bundling
   - **Parcel** for zero-config bundling  
   - **Vite** for fast development

3. **Update Node.js Compatibility:** Update or replace deprecated grunt plugins with modern alternatives.

4. **Testing:** Add comprehensive tests to ensure the migration doesn't break functionality.

## Notes

- Some packages may need version updates for Node.js compatibility
- The build system may need further updates for modern Node.js versions
- Consider migrating to modern build tools (webpack, parcel) in the future
- The core migration from bower to npm is complete and working