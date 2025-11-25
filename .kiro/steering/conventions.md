# Code Conventions and Best Practices

## TypeScript Guidelines

### Prefer TypeScript Over JavaScript
- Always write new code in TypeScript
- Convert JavaScript files to TypeScript when making significant changes
- Enable strict type checking for new plugins

### Avoid `any` Type
- Use `unknown` for truly unknown types
- Use generics for reusable type-safe code
- Enable `@typescript-eslint/no-explicit-any` rule for new plugins

### Avoid Non-Null Assertions
- Don't use `!.` operator unless absolutely necessary
- Use type guards or restructure code instead
- Enable `@typescript-eslint/no-non-null-assertion` for new plugins

### Handle Type Errors Properly
- Fix type errors rather than using `// @ts-expect-error`
- Only use `@ts-expect-error` for pre-existing issues with a comment explaining why
- Run `yarn typecheck` before submitting PRs

## JavaScript/TypeScript Style

### Modern Syntax
- Use `class` over prototype inheritance
- Use arrow functions over function expressions
- Use template strings over concatenation
- Use spread operator `[...arr]` over `arr.slice()`
- Use optional chaining `?.` and nullish coalescing `??` over lodash utilities

### Immutability
- Don't reassign variables
- Don't modify object properties directly
- Don't push to arrays - create new arrays instead
- Use `const` by default, `let` only when necessary

```typescript
// Good
function addBar(foos, foo) {
  const newFoo = { ...foo, name: 'bar' };
  return [...foos, newFoo];
}

// Bad
function addBar(foos, foo) {
  foo.name = 'bar';
  foos.push(foo);
}
```

### Early Returns
- Return early from functions to avoid deep nesting
- Throw errors early for invalid conditions

## React Guidelines

### Component Structure
- Import SASS at the top of component files: `import './component.scss'`
- Use functional components with hooks
- Use React Testing Library for component tests
- Avoid snapshot testing for React components

### Styling
- Create sibling SASS file with same name as component
- Use three-letter prefix for class names (e.g., `plgComponent`)
- All SASS files automatically include OUI variables and mixins

```tsx
// component.tsx
import './component.scss';

export const Component = () => {
  return <div className="plgComponent">Content</div>;
};
```

## HTML Conventions

### ID and Attribute Naming
- Use camelCase for `id` and `data-test-subj` attributes
- Use `htmlIdGenerator` from `@elastic/eui` for unique IDs
- Match capitalization between HTML and CSS exactly

```html
<button id="veryImportantButton" data-test-subj="clickMeButton">
  Click me
</button>
```

## File Naming

### All Files Use snake_case
```
src/opensearch-dashboards/index_patterns/index_pattern.ts  ✓
src/opensearch-dashboards/IndexPatterns/IndexPattern.ts    ✗
```

## Code Quality

### Linting and Formatting
- Run `node scripts/eslint --fix` to fix issues
- Enable ESLint in your IDE
- Prettier formats TypeScript and some JavaScript automatically
- Follow all linting rules unless exceptional circumstances require disabling

### Comments
- Never comment out code - delete it (we have version control)
- Write comments explaining "why", not "what"
- Document complex algorithms or business logic

## Testing Requirements

### Unit Tests
- Every logic file should have a corresponding test file
- Aim for 80%+ code coverage (enforced by Codecov)
- Use mocks for external dependencies
- Keep tests small and focused
- Use React Testing Library for component tests

### Integration Tests
- Prefer Cypress over Jest integration tests
- Test API endpoints with Cypress
- Use `osd_server` helper for Jest integration tests if needed

### Functional Tests (Cypress)
- Add tests to `cypress/integration/` directory
- Cover critical workflows and release blockers
- Keep tests focused - one feature per test
- Use UTC time in tests
- Use `cy.get()` instead of hard-coded delays
- Use `data-test-subj` attributes for element selection
- Setup/cleanup with proper hooks

### Test Coverage
- PRs must maintain or improve coverage
- Tests must pass before merge
- Maintainers can override in emergencies (with comment)

## API Development

### REST APIs
- Follow RESTful conventions
- Use proper HTTP methods and status codes
- Version APIs appropriately
- Document with OpenAPI/Swagger when possible

### Plugin APIs
- Follow conventions in `src/core/CONVENTIONS.md`
- Document public APIs thoroughly
- Run `yarn docs:acceptApiChanges` after API changes
- Review API signature changes carefully

## License Headers

### New Files
```typescript
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
```

### Modified Files
```typescript
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
```

## Git Workflow

### Commits
- Sign commits with DCO: `git commit -s`
- Write clear commit messages
- Keep commits focused and atomic

### Pull Requests
- Open an issue before starting work
- Reference issue in PR description
- Ensure all CI checks pass
- Respond to review comments promptly
- Maintainers handle backporting after merge

## Internationalization (i18n)

- Use `@osd/i18n` for all user-facing strings
- Run `yarn i18n:check` before submitting PRs
- Extract and integrate translations properly

## Security

- Never commit credentials or secrets
- Use environment variables for sensitive data
- Follow security best practices for authentication/authorization
- Report security issues per SECURITY.md guidelines
