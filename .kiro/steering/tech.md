# Technology Stack

## Core Technologies

- **Runtime**: Node.js (>=14.20.1 <21)
- **Package Manager**: Yarn 1.22.19 (managed via corepack)
- **Language**: TypeScript 4.5.5 (primary), JavaScript (legacy)
- **UI Framework**: React 16.14.0
- **UI Component Library**: @elastic/eui (OpenSearch fork: @opensearch-project/oui)
- **State Management**: Redux with Redux Toolkit
- **Backend Framework**: @hapi/hapi 20.2.1
- **Build System**: Custom optimizer (@osd/optimizer)
- **Bundler**: Webpack (via @amoo-miki/webpack fork)

## Key Libraries

- **Data Visualization**: Vega, Vega-Lite, D3.js, @elastic/charts
- **OpenSearch Client**: @opensearch-project/opensearch
- **Styling**: SASS/SCSS
- **Testing**: Jest, Cypress, Selenium (legacy)
- **Linting**: ESLint, Stylelint, Prettier
- **Monorepo Management**: Yarn workspaces

## Common Commands

### Development
```bash
# Bootstrap project (install dependencies and build packages)
yarn osd bootstrap

# Start development server
yarn start

# Start with developer examples
yarn start --run-examples

# Start with security enabled
yarn start:security

# Debug mode
yarn debug
```

### Testing
```bash
# Run all tests
yarn test

# Unit tests
yarn test:jest
yarn test:jest:coverage

# Integration tests
yarn test:jest_integration

# Functional tests
yarn test:ftr
yarn test:ftr:server
yarn test:ftr:runner

# Cypress tests
yarn cy
yarn cypress:run-without-security
yarn cypress:run-with-security

# Type checking
yarn typecheck
```

### Code Quality
```bash
# Linting
yarn lint
yarn lint:es
yarn lint:style

# Fix linting issues
node scripts/eslint --fix

# Check licenses
yarn checkLicenses

# i18n checks
yarn i18n:check
yarn i18n:extract
yarn i18n:integrate
```

### Building
```bash
# Build platform
yarn build-platform

# Build all platforms
yarn build --skip-os-packages

# Build specific platform
yarn build-platform --darwin
yarn build-platform --linux
yarn build-platform --windows

# Build Docker image
yarn build --docker
```

### OpenSearch Management
```bash
# Run OpenSearch snapshot
yarn opensearch snapshot

# Run with plugins
yarn opensearch snapshot --P <plugin-url>

# Run with security
yarn opensearch snapshot --security
```

### Cleanup
```bash
# Clean build artifacts
yarn osd clean
```

## Project Structure

- Monorepo with workspaces in `packages/`, `examples/`, and test plugin directories
- Plugin-based architecture with core platform in `src/core/`
- Shared packages prefixed with `@osd/` or `opensearch-`
- TypeScript project references for incremental builds
