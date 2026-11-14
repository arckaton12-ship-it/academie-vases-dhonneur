#!/usr/bin/env node
/**
 * Vérifie la séquence des migrations SQL du dossier supabase/migrations.
 *
 * Le dépôt contient des anomalies historiques connues (numéros en double,
 * suffixes b/c, plage 032–039 absente). Elles sont acceptées explicitement
 * ci-dessous. Toute NOUVELLE anomalie fait échouer le script.
 *
 * Sortie : code 0 si seules les anomalies connues sont présentes, 1 sinon.
 */

import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Anomalies historiques assumées, à résorber lors de la création du baseline. */
const KNOWN = {
  missing: new Set([32, 33, 34, 35, 36, 37, 38, 39]),
  duplicates: new Set([27, 51, 52, 72, 87, 88]),
  irregularNames: new Set([
    '027b_course_dates_exact.sql',
    '027c_fix_dates.sql',
    '072b_fix_daily_verse_dow_mapping.sql',
  ]),
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'supabase', 'migrations')

let files
try {
  files = readdirSync(dir).filter((name) => name.endsWith('.sql'))
} catch {
  console.error(`Dossier introuvable : ${dir}`)
  process.exit(1)
}

const errors = []
const warnings = []
const seen = new Map()

const entries = files
  .map((name) => {
    const match = /^(\d{3})([a-z]?)_.*\.sql$/.exec(name)
    if (!match) {
      errors.push(`Nom invalide (attendu NNN_nom.sql) : ${name}`)
      return null
    }
    const number = Number(match[1])
    if (match[2] && !KNOWN.irregularNames.has(name)) {
      errors.push(`Suffixe de migration non prévu : ${name}`)
    }
    return { name, number, raw: match[1], suffix: match[2] }
  })
  .filter(Boolean)
  .sort((a, b) => a.number - b.number)

for (const entry of entries) {
  if (seen.has(entry.number)) {
    seen.get(entry.number).push(entry.name)
  } else {
    seen.set(entry.number, [entry.name])
  }
}

for (const [number, names] of seen) {
  if (names.length > 1) {
    const label = `Numéro ${String(number).padStart(3, '0')} en double : ${names.join(' et ')}`
    if (KNOWN.duplicates.has(number)) warnings.push(label)
    else errors.push(label)
  }
}

const max = entries.length > 0 ? entries[entries.length - 1].number : 0
for (let n = 1; n <= max; n += 1) {
  if (!seen.has(n)) {
    const label = `Migration manquante : ${String(n).padStart(3, '0')}`
    if (KNOWN.missing.has(n)) warnings.push(label)
    else errors.push(label)
  }
}

if (warnings.length > 0) {
  console.log(`Anomalies historiques connues : ${warnings.length}`)
  for (const warning of warnings) console.log(`  ~ ${warning}`)
}

if (errors.length > 0) {
  console.error(`\nMigrations : ${errors.length} problème(s) nouveau(x)\n`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(
  `\nMigrations : ${entries.length} fichiers, plage 001 → ${String(max).padStart(3, '0')}, aucune anomalie nouvelle.`
)
