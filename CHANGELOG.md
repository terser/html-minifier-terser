# Changelog

All notable changes to this project will be documented in this file. They may be AI-generated.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-09-13

### Added

- Enabled commit message validation using commitlint via commit-msg hook
- Configured flexible commitlint rules supporting both conventional and natural language commit styles

### Changed

- Replaced Husky with native Git hooks for development workflow
- Updated `prepare` script to configure Git hooks path automatically

### Removed

- Removed Husky dependency (2.4kB package size reduction)
- Removed `.husky/` directory in favor of `.githooks/`

### Internal

- Migrated from Husky-managed Git hooks to native `.githooks/` directory
- Maintained identical pre-commit and pre-push test execution
- Simplified development setup with zero external dependencies for Git hooks

## [2.0.0] - 2025-09-12

### Breaking Changes

- **BREAKING:** Removed `HTMLtoXML` and `HTMLtoDOM` functions from the public API. These XML-related functions were outdated and no longer relevant to the library’s focus on HTML minification.
- **BREAKING:** Deep imports to internal modules are no longer supported. Use the main export instead of importing from specific source files.

### Added

- Added `@eslint/js` to development dependencies for improved linting

### Changed

- Updated comment references from “HTML5 elements” to “HTML elements” for accuracy
- Streamlined codebase by removing unused utility functions
- Updated package exports to enforce clean API boundaries

### Removed

- Removed unused HTML conversion functions (`HTMLtoXML`, `HTMLtoDOM`)
- Removed deprecated development dependencies: `is-ci`, `lint-staged`

### Internal

- Cleaned up package.json by removing unused dependencies
- Improved code maintainability by removing legacy XML-related code