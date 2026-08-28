import * as fs from 'fs';
import * as path from 'path';

export class FileLogger {
  private static logsDir = path.join(process.cwd(), 'logs');

  private static ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private static getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static getAppLogPath(): string {
    return path.join(this.logsDir, `app-${this.getFormattedDate()}.log`);
  }

  private static getErrorLogPath(): string {
    return path.join(this.logsDir, `error-${this.getFormattedDate()}.log`);
  }

  static logInfo(payload: object) {
    const jsonString = JSON.stringify(payload);
    console.log(jsonString); // Console Output for Docker/K8s

    try {
      this.ensureLogsDir();
      fs.appendFileSync(this.getAppLogPath(), jsonString + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write app log file:', err);
    }
  }

  static logError(payload: object) {
    const jsonString = JSON.stringify(payload);
    console.error(jsonString); // Console Error for Docker/K8s

    try {
      this.ensureLogsDir();
      fs.appendFileSync(this.getAppLogPath(), jsonString + '\n', 'utf8');
      fs.appendFileSync(this.getErrorLogPath(), jsonString + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write error log file:', err);
    }
  }
}
