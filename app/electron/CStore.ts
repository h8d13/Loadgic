import { readFile, readdir, rm } from 'node:fs/promises'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

export const CSTORE_DIR = '.cstore'
const IGNORED = new Set(['.git', 'node_modules', CSTORE_DIR])

// Fast FNV-1a hash
export function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function hashName(name: string): string {
  return fnv1a(name) + '.lg'
}

// Get .cstore path for a file given its path relative to project root
export function getCstorePath(projectRoot: string, filePath: string): string {
  const rel = path.relative(projectRoot, filePath)
  const parts = rel.split(path.sep)
  const hashedParts = parts.map(hashName)
  return path.join(projectRoot, CSTORE_DIR, ...hashedParts)
}

type FileEntry = { storePath: string; hashes: string; meta?: string[] }

const META_SEP = '---'

// .lg file format:
// line1_hash
// line2_hash
// ---
// 1:EN
// 5:BR
// 10:EX

export function parseLgFile(content: string): { hashes: string[]; meta: string[] } {
  const parts = content.split(`\n${META_SEP}\n`)
  const hashes = parts[0]?.split('\n') ?? []
  const meta = parts[1]?.split('\n').filter(Boolean) ?? []
  return { hashes, meta }
}

export function serializeLgFile(hashes: string[], meta: string[] = []): string {
  if (meta.length === 0) return hashes.join('\n')
  return `${hashes.join('\n')}\n${META_SEP}\n${meta.join('\n')}`
}

// Collect all files first (parallel reads)
async function collectFiles(
  srcDir: string,
  cstoreDir: string,
  entries: FileEntry[]
): Promise<void> {
  const dirEntries = await readdir(srcDir, { withFileTypes: true }).catch(() => [])
  const filtered = dirEntries.filter((e) => !IGNORED.has(e.name))

  await Promise.all(
    filtered.map(async (entry) => {
      const srcPath = path.join(srcDir, entry.name)
      const storePath = path.join(cstoreDir, hashName(entry.name))

      if (entry.isDirectory()) {
        await collectFiles(srcPath, storePath, entries)
      } else if (entry.isFile()) {
        try {
          const content = await readFile(srcPath, 'utf8')
          const hashes = content.split('\n').map(fnv1a).join('\n')
          entries.push({ storePath, hashes })
        } catch {
          // Ignore files that can't be read (e.g., permission denied)
        }
      }
    })
  )
}

// Write all files (sync - faster for many small files)
function writeAll(entries: FileEntry[]): void {
  // Create all directories first
  const dirs = new Set(entries.map((e) => path.dirname(e.storePath)))
  for (const d of dirs) {
    mkdirSync(d, { recursive: true })
  }

  // Write files sync
  for (const e of entries) {
    writeFileSync(e.storePath, e.hashes)
  }
}

export async function generateCStore(rootPath: string): Promise<string> {
  const cstorePath = path.join(rootPath, CSTORE_DIR)

  // Clean
  await rm(cstorePath, { recursive: true, force: true })

  // Collect all file hashes in memory
  const entries: FileEntry[] = []
  await collectFiles(rootPath, cstorePath, entries)

  // Sync write (faster for many small files)
  writeAll(entries)

  return cstorePath
}
