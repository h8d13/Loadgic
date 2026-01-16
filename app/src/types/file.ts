export type FileContent =
  | { kind: 'text'; content: string }
  | { kind: 'image'; mime: string; data: string }
  | { kind: 'unsupported'; reason: string }
