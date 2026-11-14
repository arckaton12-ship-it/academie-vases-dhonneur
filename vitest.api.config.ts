import { defineConfig } from 'vitest/config'

/**
 * Campagne d'intégration : elle interroge le vrai projet Supabase avec de vrais
 * comptes de test. Elle n'est donc pas lancée par `npm test` (voir vitest.config.ts)
 * et se déclenche explicitement avec `npm run test:api`, depuis un poste connecté.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api.test.ts'],
    testTimeout: 20000,
    hookTimeout: 60000,
  },
})
