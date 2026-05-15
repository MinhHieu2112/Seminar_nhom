# Frontend Architecture (Five S Standard)

This project follows the **Five S** methodology for frontend architecture to ensure a clean, maintainable, and scalable codebase.

## 🚀 Getting Started

This project uses `pnpm` as the package manager. **Do not use `npm` or `yarn`.**

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## 📂 Directory Structure

All source code resides in the `src/` directory, organized as follows:

- `app/`: Next.js App Router pages and layouts.
- `components/`: UI components, organized by feature or common usage.
- `hooks/`: Custom React hooks. All hooks should reside here.
- `store/`: Global state management (Zustand/Context). Contains `auth-store.ts`, `ui-store.ts`, etc.
- `services/`: API service layers. All backend communication logic (axios/fetch) goes here. Files should follow the `*.service.ts` naming convention.
- `lib/`: Shared utilities, configurations, and third-party client initializations (e.g., `api-client.ts`, `providers.tsx`).
- `types/`: TypeScript definitions and interfaces.

## 🛠 Coding Conventions

- **Imports**: Always use absolute paths with the `@/` alias (e.g., `@/components/...`).
- **Services**: Use the centralized `apiClient` from `@/lib/api-client` for all HTTP requests.
- **Data Flow**: Ensure all data flows through the defined service layer. **Mock data is strictly prohibited** in production-ready code.
- **Naming**: Use camelCase for functions and variables, PascalCase for components and types.

## 🧹 Five S Principles Applied

1.  **Sort (Sàng lọc)**: Removed redundant files (like `package-lock.json`) and kept only essential dependencies.
2.  **Set in Order (Sắp xếp)**: Consolidated hooks, stores, and services into their dedicated directories.
3.  **Shine (Sạch sẽ)**: Cleaned up duplicate logic and standardized import paths.
4.  **Standardize (Săn sóc)**: Enforced a consistent directory structure across the team.
5.  **Sustain (Sẵn sàng)**: Documented these standards to ensure long-term maintenance.
