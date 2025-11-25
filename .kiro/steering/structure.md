# Project Structure

## Top-Level Organization

```
OpenSearch-Dashboards/
├── src/                    # Core application code
│   ├── core/              # Core platform (server & public APIs)
│   ├── plugins/           # Built-in plugins
│   ├── cli/               # CLI tools
│   ├── cli_keystore/      # Keystore management
│   ├── cli_plugin/        # Plugin management CLI
│   ├── dev/               # Development tools
│   ├── optimize/          # Build optimization
│   └── setup_node_env/    # Node environment setup
├── packages/              # Shared packages (@osd/* namespace)
├── plugins/               # External/custom plugins directory
├── examples/              # Developer example plugins
├── test/                  # Test suites
├── cypress/               # Cypress E2E tests
├── scripts/               # Build and utility scripts
├── config/                # Configuration files
├── docs/                  # Documentation
└── tasks/                 # Grunt tasks
```

## Core Directory (`src/core/`)

The heart of OpenSearch Dashboards platform:
- **`public/`** - Client-side core APIs (browser)
- **`server/`** - Server-side core APIs (Node.js)
- **`utils/`** - Shared utilities
- **Key concepts**: Plugin system, HTTP server, saved objects, UI settings, capabilities

## Plugins Directory (`src/plugins/`)

Built-in plugins that extend core functionality:
- Each plugin is self-contained with its own `public/` and `server/` directories
- Common plugins: `data`, `discover`, `visualizations`, `dashboard`, `dev_tools`
- Plugin structure follows conventions in `src/core/CONVENTIONS.md`

## Packages Directory (`packages/`)

Reusable packages in the monorepo:
- Prefixed with `@osd/` (e.g., `@osd/config`, `@osd/i18n`, `@osd/test`)
- Independent versioning and building
- Can be used by core, plugins, or other packages
- Examples: `osd-optimizer`, `osd-dev-utils`, `osd-ui-framework`

## Test Directory (`test/`)

Organized by test type:
- **`functional/`** - Selenium-based functional tests (legacy)
- **`api_integration/`** - API integration tests
- **`plugin_functional/`** - Plugin-specific functional tests
- **`accessibility/`** - Accessibility tests
- **`common/`** - Shared test utilities

## Cypress Directory (`cypress/`)

Modern E2E testing:
- **`integration/`** - Test specs organized by feature
- **`fixtures/`** - Test data
- **`utils/`** - Helper functions and commands
- **`support/`** - Cypress configuration and setup

## Configuration Files

- **`package.json`** - Project metadata and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`.eslintrc.js`** - ESLint rules
- **`.prettierrc`** - Prettier formatting
- **`opensearch_dashboards.d.ts`** - Global type definitions

## File Naming Conventions

- **Source files**: `snake_case.ts` or `snake_case.tsx`
- **Test files**: `*.test.ts`, `*.test.tsx`
- **Integration tests**: `**/integration_tests/**/*.test.ts`
- **Type definitions**: `*.d.ts`
- **SASS files**: `*.scss` (import directly in component files)

## Plugin Structure

Standard plugin layout:
```
my_plugin/
├── public/
│   ├── index.ts           # Public plugin entry
│   ├── plugin.ts          # Plugin class
│   ├── components/        # React components
│   ├── services/          # Business logic
│   └── types.ts           # TypeScript types
├── server/
│   ├── index.ts           # Server plugin entry
│   ├── plugin.ts          # Plugin class
│   ├── routes/            # API routes
│   └── services/          # Server-side logic
├── common/                # Shared code
├── README.md
└── opensearch_dashboards.json  # Plugin manifest
```

## Import Patterns

- Use absolute imports for packages: `import { x } from '@osd/package'`
- Use relative imports within a plugin: `import { y } from './utils'`
- Core APIs imported from: `opensearch-dashboards/public` or `opensearch-dashboards/server`
- Avoid circular dependencies

## Build Artifacts

Generated during build (gitignored):
- `build/` - Production build output
- `target/` - Intermediate build files
- `data/` - Runtime data
- `.opensearch/` - Local OpenSearch snapshots
- `node_modules/` - Dependencies
