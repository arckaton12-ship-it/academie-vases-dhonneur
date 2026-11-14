import { configDefaults, defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // tests/api.test.ts est une campagne d'intégration qui exige un accès réseau
    // réel à Supabase et des comptes de test. Il tourne à part (npm run test:api)
    // pour que `npm test` reste déterministe et utilisable hors ligne.
    exclude: [...configDefaults.exclude, 'tests/api.test.ts'],
    testTimeout: 15000,
  },
})
