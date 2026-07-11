# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a fresh Git workspace with no application files committed yet. Keep frontend source code under `src/`, reusable UI pieces under `src/components/`, page-level views under `src/pages/`, and shared utilities under `src/lib/` or `src/utils/`. Store static assets in `public/` or `src/assets/`. Place tests next to the code they cover as `*.test.*` files or group broader integration tests under `tests/`.

## Build, Test, and Development Commands
Tooling is not configured yet, so contributors should document any new commands in `package.json` or the relevant build file when they introduce them. For a typical frontend setup, expose commands such as `npm install` for dependencies, `npm run dev` for local development, `npm run build` for production output, and `npm test` for automated checks. Do not add undocumented scripts.

## Coding Style & Naming Conventions
Use consistent formatting from the first committed source files onward. Prefer 2-space indentation for frontend code, `PascalCase` for React components, `camelCase` for functions and variables, and `kebab-case` for non-component filenames. Keep modules focused, avoid deep folder nesting, and choose descriptive names such as `src/components/UserTable.tsx` instead of generic files like `helpers.ts`.

## Testing Guidelines
Add automated tests alongside any new feature work. Name unit tests with the same base name as the source file, for example `InvoiceForm.test.tsx`. If a testing framework is added, include both the run command and any coverage command in project scripts. New features should ship with at least happy-path coverage and one failure or edge-case assertion.

## Commit & Pull Request Guidelines
There is no existing commit history yet, so start with short, imperative commit subjects such as `Add login form validation`. Keep each commit scoped to one logical change. Pull requests should include a concise description, testing notes, linked issue or ticket if available, and screenshots for UI changes.

## Configuration Notes
Do not commit secrets, `.env` files with real credentials, or generated build output. When adding project configuration, include a safe example file such as `.env.example` and document required variables near the code that uses them.
