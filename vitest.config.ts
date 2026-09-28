import { defineConfig } from 'vitest/config'

// Pure-function unit tests — no DOM needed, so the lightweight node
// environment. Tests live outside src/ so the app build/typecheck
// (tsconfig.app.json includes only "src") never touches them.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
