# E2E Tests

End-to-end tests for Scriptboard using Playwright.

## Running Tests

### Prerequisites
1. Backend server must be running on `http://localhost:8000`
2. Frontend server will be started automatically by Playwright

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test e2e/full-workflow.spec.ts
```

## Test Files

- `full-workflow.spec.ts` - Complete user workflow test
- `search-ui.spec.ts` - Search functionality tests
- `theme-toggle.spec.ts` - Theme persistence tests
- `keyboard-shortcuts.spec.ts` - Keyboard shortcut tests

## Notes

- Tests assume backend is running on port 8000
- Tests use clipboard API for pasting content
- Some tests may need adjustment based on actual UI implementation

