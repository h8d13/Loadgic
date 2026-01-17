import { spawn, ChildProcess } from 'node:child_process'
import { readFile, writeFile, mkdtemp, rm, chmod, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { getCstorePath, parseLgFile } from './CStore'

// Metric event from marker hit
export type LgMetric = {
  marker: 'EN' | 'BR' | 'EX'
  line: number
  time: number
  source: string
}

// Runner config
export type RunConfig = {
  file: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  projectRoot?: string // For reading .cstore metadata
}

// Language definition
type LangDef = {
  ext: string[]
  run: (file: string, args: string[]) => { cmd: string; args: string[] }
  inject: (marker: string, line: number, source: string) => string
  pattern: RegExp // to parse output
  preamble?: (traceFile: string) => string // optional: inject at start of file
}

const LANGS: Record<string, LangDef> = {
  javascript: {
    ext: ['.js', '.mjs'],
    run: (f, a) => ({ cmd: 'node', args: [f, ...a] }),
    inject: (m, l, s) => `require('fs').writeSync(global._lgFd||9,'[LG:${m}:${l}:'+(Date.now()/1000)+':${s}]\\n');`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
    preamble: (traceFile: string) => `global._lgFd=require('fs').openSync('${traceFile}','w');`,
  },
  typescript: {
    ext: ['.ts'],
    run: (f, a) => ({ cmd: 'npx', args: ['tsx', f, ...a] }),
    inject: (m, l, s) => `require('fs').writeSync(global._lgFd||9,'[LG:${m}:${l}:'+(Date.now()/1000)+':${s}]\\n');`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
    preamble: (traceFile: string) => `global._lgFd=require('fs').openSync('${traceFile}','w');`,
  },
  python: {
    ext: ['.py'],
    run: (f, a) => ({ cmd: 'python3', args: [f, ...a] }),
    // Use globals().__lgfd if defined (main script), otherwise fd 9 (child script inheriting from bash)
    inject: (m, l, s) => `__import__('os').write(globals().get('__lgfd',9),f'[LG:${m}:${l}:{__import__("time").time()}:${s}]\\n'.encode())`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
    preamble: (traceFile: string) => `import os;globals()['__lgfd']=os.open('${traceFile}',os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o644)`,
  },
  shell: {
    ext: ['.sh', '.bash', ''],
    run: (f, a) => ({ cmd: 'bash', args: [f, ...a] }),
    inject: (m, l, s) => `>&9 echo "[LG:${m}:${l}:$EPOCHREALTIME:${s}]"`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
    preamble: (traceFile: string) => `exec 9>${traceFile}`,
  },
  go: {
    ext: ['.go'],
    run: (f, a) => ({ cmd: 'go', args: ['run', f, ...a] }),
    inject: (m, l, s) => `fmt.Fprintf(os.Stderr, "[LG:${m}:${l}:%v:${s}]\\n", float64(time.Now().UnixNano())/1e9)`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
  },
  rust: {
    ext: ['.rs'],
    run: (f, a) => ({ cmd: 'cargo', args: ['run', '--quiet', '--', ...a] }),
    inject: (m, l, s) => `eprintln!("[LG:${m}:${l}:{}:${s}]", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs_f64());`,
    pattern: /\[LG:(\w+):(\d+):([\d.]+):([^\]]+)\]/,
  },
}

// Parse #lg=marker_ from source
const LG_REGEX = /#lg=(\w+)[_ ]/g
const MARKER_MAP: Record<string, 'EN' | 'BR' | 'EX'> = {
  entry: 'EN', en: 'EN',
  break: 'BR', br: 'BR',
  exit: 'EX', ex: 'EX',
}

// Parse #lgs=path to find child scripts to instrument
const LGS_REGEX = /#lgs=([^\s]+)/g

function findSourceMarkers(source: string, sourceDir: string): string[] {
  const scripts: string[] = []
  for (const line of source.split('\n')) {
    LGS_REGEX.lastIndex = 0
    let match
    while ((match = LGS_REGEX.exec(line)) !== null) {
      const scriptPath = match[1]
      const fullPath = path.resolve(sourceDir, scriptPath)
      scripts.push(fullPath)
    }
  }
  return [...new Set(scripts)]
}

function detectLangFromShebang(content: string): LangDef | null {
  const firstLine = content.split('\n')[0]
  if (!firstLine.startsWith('#!')) return null

  if (firstLine.includes('node')) return LANGS.javascript
  if (firstLine.includes('python')) return LANGS.python
  if (firstLine.includes('bash') || firstLine.includes('/sh')) return LANGS.shell
  return null
}

function detectLang(file: string, content?: string): LangDef | null {
  const ext = path.extname(file).toLowerCase()
  for (const lang of Object.values(LANGS)) {
    if (lang.ext.includes(ext)) return lang
  }
  // No extension - try shebang
  if (!ext && content) {
    return detectLangFromShebang(content)
  }
  return null
}

function parseCodeMarkers(source: string): Map<number, 'EN' | 'BR' | 'EX'> {
  const markers = new Map<number, 'EN' | 'BR' | 'EX'>()
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    LG_REGEX.lastIndex = 0
    const match = LG_REGEX.exec(lines[i])
    if (match) {
      const type = MARKER_MAP[match[1].toLowerCase()]
      if (type) markers.set(i + 1, type)
    }
  }
  return markers
}

// Parse markers from .cstore metadata
function parseCstoreMarkers(meta: string[]): Map<number, 'EN' | 'BR' | 'EX'> {
  const markers = new Map<number, 'EN' | 'BR' | 'EX'>()
  for (const tag of meta) {
    const [lineStr, type] = tag.split(':')
    const line = parseInt(lineStr, 10)
    if (isNaN(line)) continue
    if (type === 'EN') markers.set(line, 'EN')
    else if (type === 'BR') markers.set(line, 'BR')
    else if (type === 'EX') markers.set(line, 'EX')
  }
  return markers
}

// Read .cstore metadata for a file
async function readCstoreMeta(file: string, projectRoot: string): Promise<string[]> {
  try {
    const cstorePath = getCstorePath(projectRoot, file)
    const content = await readFile(cstorePath, 'utf8')
    const { meta } = parseLgFile(content)
    return meta
  } catch {
    return []
  }
}

function instrumentSource(source: string, lang: LangDef, markers: Map<number, 'EN' | 'BR' | 'EX'>, sourceName: string, traceFile?: string): string {
  const lines = source.split('\n')
  const result: string[] = []

  // Inject preamble after shebang (if any)
  let shebangHandled = false
  if (lang.preamble && traceFile) {
    if (lines[0]?.startsWith('#!')) {
      result.push(lines[0])
      result.push(lang.preamble(traceFile))
      shebangHandled = true
    } else {
      result.push(lang.preamble(traceFile))
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && shebangHandled) continue // already added shebang

    const lineNum = i + 1
    const marker = markers.get(lineNum)
    const currentLine = lines[i]

    if (marker) {
      // Check if this line is ONLY a #lg= comment (not inline with code)
      const isStandaloneMarker = /^\s*#lg=\w+[_ ]\s*$/.test(currentLine)
      // Check if this is a control flow continuation (elif, else, except, finally, case)
      // These can't have code injected before them - must inject after the colon
      const isControlFlowContinuation = /^\s*(elif|else|except|finally|case)\b.*:\s*(#.*)?$/.test(currentLine)

      if (isControlFlowContinuation) {
        // Push the control flow line first, then inject with increased indentation
        result.push(currentLine)
        const baseIndent = currentLine.match(/^(\s*)/)?.[1] ?? ''
        const extraIndent = '    ' // Python standard indent
        result.push(baseIndent + extraIndent + lang.inject(marker, lineNum, sourceName))
      } else {
        // For standalone marker comments, use indent from next line; otherwise use current line's indent
        const indentSource = isStandaloneMarker ? (lines[i + 1] ?? '') : currentLine
        const indent = indentSource.match(/^(\s*)/)?.[1] ?? ''
        // Inject with matching indentation
        result.push(indent + lang.inject(marker, lineNum, sourceName))
        result.push(currentLine)
      }
    } else {
      result.push(currentLine)
    }
  }

  return result.join('\n')
}

export class LgRunner extends EventEmitter {
  private proc: ChildProcess | null = null
  private tmpDir: string | null = null
  private metrics: LgMetric[] = []
  private lang: LangDef | null = null

  async run(config: RunConfig): Promise<{ code: number | null; metrics: LgMetric[] }> {
    const { file, args = [], cwd, env, projectRoot } = config

    // Read source first (needed for shebang detection)
    const source = await readFile(file, 'utf8')

    // Detect language
    this.lang = detectLang(file, source)
    if (!this.lang) {
      throw new Error(`Unsupported file type: ${path.extname(file) || 'no extension'}`)
    }

    // Collect markers from code (#lg= tags)
    const codeMarkers = parseCodeMarkers(source)

    // Collect markers from .cstore metadata (UI gutter clicks)
    let cstoreMarkers = new Map<number, 'EN' | 'BR' | 'EX'>()
    if (projectRoot) {
      const meta = await readCstoreMeta(file, projectRoot)
      cstoreMarkers = parseCstoreMarkers(meta)
    }

    // Merge markers (cstore takes precedence)
    const allMarkers = new Map<number, 'EN' | 'BR' | 'EX'>([...codeMarkers, ...cstoreMarkers])

    // Write to temp file
    this.tmpDir = await mkdtemp(path.join(tmpdir(), 'lg-'))
    const traceFile = this.lang.preamble ? path.join(this.tmpDir, 'trace.lg') : undefined

    // Find and instrument child scripts (#lgs= markers)
    const sourceDir = path.dirname(file)
    const childScripts = findSourceMarkers(source, sourceDir)
    const scriptMap = new Map<string, string>() // original -> temp path

    for (const childPath of childScripts) {
      try {
        const childSource = await readFile(childPath, 'utf8')
        const childLang = detectLang(childPath, childSource)
        if (!childLang) continue

        // Collect markers from code (#lg= tags)
        const childCodeMarkers = parseCodeMarkers(childSource)

        // Collect markers from .cstore metadata (UI gutter clicks)
        let childCstoreMarkers = new Map<number, 'EN' | 'BR' | 'EX'>()
        if (projectRoot) {
          const childMeta = await readCstoreMeta(childPath, projectRoot)
          childCstoreMarkers = parseCstoreMarkers(childMeta)
          if (process.env.DEBUG === 'true') {
            console.log('DEBUG [LgRunner] child script:', childPath)
            console.log('DEBUG [LgRunner] childMeta from cstore:', childMeta)
            console.log('DEBUG [LgRunner] childCstoreMarkers:', [...childCstoreMarkers.entries()])
          }
        }

        // Merge markers (cstore takes precedence)
        const childMarkers = new Map<number, 'EN' | 'BR' | 'EX'>([...childCodeMarkers, ...childCstoreMarkers])

        // Instrument WITHOUT preamble - inherits fd 9 from parent
        const childName = path.basename(childPath)
        const childInstrumented = instrumentSource(childSource, childLang, childMarkers, childName, undefined)

        // Preserve directory structure relative to source dir
        const relPath = path.relative(sourceDir, childPath)
        const childTmpFile = path.join(this.tmpDir, relPath)
        const childTmpDir = path.dirname(childTmpFile)
        await mkdir(childTmpDir, { recursive: true })
        await writeFile(childTmpFile, childInstrumented)
        await chmod(childTmpFile, 0o755) // make executable
        scriptMap.set(childPath, childTmpFile)
      } catch {
        // Skip if can't read child script
      }
    }

    // Instrument main script - no need to rewrite paths since structure is preserved
    const mainName = path.basename(file)
    const instrumented = instrumentSource(source, this.lang, allMarkers, mainName, traceFile)

    // Debug: log markers and instrumented content
    if (process.env.DEBUG === 'true') {
      console.log('DEBUG [LgRunner] allMarkers:', [...allMarkers.entries()])
      console.log('DEBUG [LgRunner] traceFile:', traceFile)
      console.log('DEBUG [LgRunner] instrumented first 500 chars:', instrumented.slice(0, 500))
    }

    const tmpFile = path.join(this.tmpDir, path.basename(file))
    await writeFile(tmpFile, instrumented)
    await chmod(tmpFile, 0o755) // make executable

    // Build command
    const { cmd, args: cmdArgs } = this.lang.run(tmpFile, args)

    return new Promise((resolve) => {
      this.metrics = []

      this.proc = spawn(cmd, cmdArgs, {
        cwd: cwd ?? path.dirname(file),
        env: { ...process.env, ...env },
        stdio: ['inherit', 'pipe', 'pipe'],
      })

      // Capture stdout (pass through)
      this.proc.stdout?.on('data', (data: Buffer) => {
        const str = data.toString()
        this.emit('stdout', str)
        process.stdout.write(data)
      })

      // Capture stderr (parse metrics + pass through)
      this.proc.stderr?.on('data', (data: Buffer) => {
        const str = data.toString()
        this.parseMetrics(str)

        // Filter out metric lines from output
        const filtered = str.split('\n')
          .filter(l => !this.lang!.pattern.test(l))
          .join('\n')
        if (filtered.trim()) {
          this.emit('stderr', filtered)
          process.stderr.write(filtered)
        }
      })

      this.proc.on('close', async (code) => {
        // Read trace file if using fd-based tracing
        if (traceFile) {
          try {
            const traceContent = await readFile(traceFile, 'utf8')
            this.parseMetrics(traceContent)
          } catch {
            // Trace file may not exist if no markers hit
          }
        }

        // Cleanup
        if (this.tmpDir) {
          await rm(this.tmpDir, { recursive: true, force: true })
          this.tmpDir = null
        }

        // Calculate durations
        const summary = this.calculateSummary()
        this.emit('done', { code, metrics: this.metrics, summary })

        resolve({ code, metrics: this.metrics })
      })
    })
  }

  private parseMetrics(output: string) {
    if (!this.lang) return

    for (const line of output.split('\n')) {
      const match = this.lang.pattern.exec(line)
      if (match) {
        const metric: LgMetric = {
          marker: match[1] as 'EN' | 'BR' | 'EX',
          line: parseInt(match[2], 10),
          time: parseFloat(match[3]),
          source: match[4] || 'unknown',
        }
        this.metrics.push(metric)
        this.emit('metric', metric)
      }
    }
  }

  private calculateSummary() {
    // Calculate durations between consecutive markers
    const durations: { from: number; to: number; fromMarker: string; toMarker: string; duration: number }[] = []

    for (let i = 0; i < this.metrics.length - 1; i++) {
      const curr = this.metrics[i]
      const next = this.metrics[i + 1]
      durations.push({
        from: curr.line,
        to: next.line,
        fromMarker: curr.marker,
        toMarker: next.marker,
        duration: (next.time - curr.time) * 1000, // ms
      })
    }

    return {
      totalMetrics: this.metrics.length,
      entries: this.metrics.filter(m => m.marker === 'EN').length,
      breaks: this.metrics.filter(m => m.marker === 'BR').length,
      exits: this.metrics.filter(m => m.marker === 'EX').length,
      durations,
    }
  }

  kill() {
    this.proc?.kill()
  }
}

// CLI usage example
export async function runFile(file: string, args: string[] = []) {
  const runner = new LgRunner()

  runner.on('metric', (m: LgMetric) => {
    console.log(`[${m.marker}] line ${m.line} @ ${m.time.toFixed(3)}`)
  })

  runner.on('done', ({ summary }) => {
    console.log('\n--- LG Summary ---')
    console.log(`Entries: ${summary.entries}, Breaks: ${summary.breaks}, Exits: ${summary.exits}`)
    for (const d of summary.durations) {
      console.log(`  L${d.entry} → L${d.exit}: ${d.duration.toFixed(2)}ms`)
    }
  })

  return runner.run({ file, args })
}
