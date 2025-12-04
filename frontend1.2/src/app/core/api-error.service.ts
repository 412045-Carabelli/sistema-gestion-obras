import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models/api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {

  parse(error: unknown): ApiError | null {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      const message = this.resolveMessage(body) || error.message;
      const status = this.resolveStatus(body) ?? error.status ?? 500;
      const timestamp = this.resolveTimestamp(body) ?? new Date().toISOString();
      return { message, status, timestamp };
    }
    if (error && typeof error === 'object' && 'message' in (error as any)) {
      const anyError = error as any;
      return {
        message: anyError.message ?? 'Error desconocido',
        status: anyError.status ?? 500,
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  getMessage(error: unknown, fallback: string): string {
    const parsed = this.parse(error);
    if (parsed?.message) return parsed.message;
    return fallback;
  }

  private resolveMessage(body: any): string | null {
    if (!body) return null;
    if (typeof body === 'string') return body;
    return body.message || body.mensaje || body.error || null;
  }

  private resolveStatus(body: any): number | null {
    if (!body) return null;
    return typeof body.status === 'number' ? body.status : null;
  }

  private resolveTimestamp(body: any): string | null {
    if (!body) return null;
    return typeof body.timestamp === 'string' ? body.timestamp : null;
  }
}
