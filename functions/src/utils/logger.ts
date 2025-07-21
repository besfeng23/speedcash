export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  transactionId?: string;
  operation?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  metadata?: Record<string, any>;
}

export class Logger {
  private level: LogLevel;
  private service: string;

  constructor(service: string, level: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'pin', 'ssn', 'creditCard',
      'accountNumber', 'cvv', 'expiry', 'idToken', 'refreshToken'
    ];

    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeData(context) : undefined,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata: metadata ? this.sanitizeData(metadata) : undefined
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, context, error, metadata);
    
    // In production, this would send to a logging service like Cloud Logging, DataDog, etc.
    console.log(JSON.stringify({
      service: this.service,
      ...logEntry
    }));
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  warn(message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, error, metadata);
  }

  error(message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  fatal(message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  // Transaction-specific logging
  transactionStart(transactionId: string, operation: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Transaction started: ${operation}`, {
      transactionId,
      operation,
      userId,
      ...metadata
    });
  }

  transactionSuccess(transactionId: string, operation: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Transaction completed: ${operation}`, {
      transactionId,
      operation,
      userId,
      ...metadata
    });
  }

  transactionError(transactionId: string, operation: string, error: Error, userId?: string, metadata?: Record<string, any>): void {
    this.error(`Transaction failed: ${operation}`, {
      transactionId,
      operation,
      userId,
      ...metadata
    }, error);
  }

  // API-specific logging
  apiRequest(method: string, path: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`API Request: ${method} ${path}`, {
      operation: 'api_request',
      userId,
      method,
      path,
      ...metadata
    });
  }

  apiResponse(method: string, path: string, statusCode: number, userId?: string, metadata?: Record<string, any>): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${path} - ${statusCode}`, {
      operation: 'api_response',
      userId,
      method,
      path,
      statusCode
    }, undefined, metadata);
  }

  // Performance logging
  performance(operation: string, duration: number, userId?: string, metadata?: Record<string, any>): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation: 'performance',
      userId,
      duration
    }, undefined, metadata);
  }
}

// Create logger instances for different services
export const transactionLogger = new Logger('transactions');
export const apiLogger = new Logger('api');
export const authLogger = new Logger('auth');
export const kycLogger = new Logger('kyc');
export const partnerLogger = new Logger('partners');

// Utility function to create a logger for a specific context
export function createLogger(service: string, level?: LogLevel): Logger {
  return new Logger(service, level);
} 