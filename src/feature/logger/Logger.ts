
type LogLevel = 'info' | 'warn' | 'error';

type LogOptions = {
  context?: string;
  extra?: Record<string, unknown>;
};

export class Logger {
  private static instance: Logger;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
  }

  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    const timestamp = new Date().toISOString();
    const { context, extra } = options;

    const contextText = context ? `[${context}]` : '';
    const extraText = extra ? JSON.stringify(extra) : '';

    const finalMessage = `[${timestamp}] ${contextText} ${message} ${extraText}`;

    switch (level) {
      case 'info':
        console.info(finalMessage);
        break;
      case 'warn':
        console.warn(finalMessage);
        break;
      case 'error':
        console.error(finalMessage);
        break;
    }
    //TODO: SENTRY or other error tracking service

  }

  info(message: string, options?: LogOptions) {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions) {
    this.log('warn', message, options);
  }

  error(error: unknown, options?: LogOptions) {
    let message = 'Unknown error';

    if (error instanceof Error) {
      message = `${error.message}\n${error.stack || ''}`;
    } else if (typeof error === 'string') {
      message = error;
    } else if (typeof error === 'object') {
      message = JSON.stringify(error);
    }

    this.log('error', message, options);
  }

}


export const logger = Logger.getInstance();
