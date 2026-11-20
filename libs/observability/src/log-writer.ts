import { createWriteStream, mkdirSync, type WriteStream } from 'fs';
import { join } from 'path';

export interface LogWriterOptions {
  /** Directory for app-YYYY-MM-DD.log / error-YYYY-MM-DD.log. Default: <cwd>/logs */
  logsDir?: string;
  /** Write log files (default true; set LOG_TO_FILE=false to log to stdout only). */
  toFiles?: boolean;
}

class DailyFile {
  private date = '';
  private stream: WriteStream | null = null;
  private failed = false;

  constructor(private readonly dir: string, private readonly prefix: string) {}

  write(line: string) {
    if (this.failed) return;
    const today = localDate();
    if (!this.stream || this.date !== today) {
      this.stream?.end();
      this.date = today;
      this.stream = createWriteStream(join(this.dir, `${this.prefix}-${today}.log`), { flags: 'a' });
      this.stream.on('error', (err) => {
        // Report once and stop writing files; stdout logging continues.
        this.failed = true;
        process.stderr.write(`Log file ${this.prefix} disabled: ${err.message}\n`);
      });
    }
    this.stream.write(line);
  }

  close() {
    this.stream?.end();
    this.stream = null;
  }
}

function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Structured JSON log writer shared by the Node services
 * (docs/guides/coding-standards-and-observability.md).
 *
 * Every entry goes to stdout/stderr as one JSON line and, asynchronously, to daily
 * files: all entries to app-<date>.log, errors also to error-<date>.log. File
 * writes use buffered streams, so request handling never blocks on disk I/O
 * (the previous implementation used fs.appendFileSync per request).
 */
export class LogWriter {
  private readonly appFile: DailyFile | null;
  private readonly errorFile: DailyFile | null;

  constructor(options: LogWriterOptions = {}) {
    const toFiles = options.toFiles ?? process.env.LOG_TO_FILE !== 'false';
    const dir = options.logsDir ?? join(process.cwd(), 'logs');
    let canWrite = toFiles;
    if (canWrite) {
      try {
        mkdirSync(dir, { recursive: true });
      } catch (err) {
        canWrite = false;
        process.stderr.write(`Cannot create logs directory ${dir}: ${(err as Error).message}\n`);
      }
    }
    this.appFile = canWrite ? new DailyFile(dir, 'app') : null;
    this.errorFile = canWrite ? new DailyFile(dir, 'error') : null;
  }

  info(payload: object) {
    const line = JSON.stringify(payload) + '\n';
    process.stdout.write(line);
    this.appFile?.write(line);
  }

  error(payload: object) {
    const line = JSON.stringify(payload) + '\n';
    process.stderr.write(line);
    this.appFile?.write(line);
    this.errorFile?.write(line);
  }

  close() {
    this.appFile?.close();
    this.errorFile?.close();
  }
}
