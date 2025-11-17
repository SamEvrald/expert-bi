import { ApiException } from '../types/api.types';
import { toast } from '../hooks/use-toast';

export class ErrorHandler {
  static handle(error: unknown, customMessage?: string): void {
    console.error('Error:', error);

    if (error instanceof ApiException) {
      this.handleApiException(error, customMessage);
    } else if (error instanceof Error) {
      this.handleGenericError(error, customMessage);
    } else {
      this.handleUnknownError(customMessage);
    }
  }

  private static handleApiException(error: ApiException, customMessage?: string): void {
    const message = customMessage || this.getApiErrorMessage(error);

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }

  private static handleGenericError(error: Error, customMessage?: string): void {
    toast({
      title: 'Error',
      description: customMessage || error.message,
      variant: 'destructive',
    });
  }

  private static handleUnknownError(customMessage?: string): void {
    toast({
      title: 'Error',
      description: customMessage || 'An unexpected error occurred',
      variant: 'destructive',
    });
  }

  private static getApiErrorMessage(error: ApiException): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'VALIDATION_ERROR':
        return this.formatValidationErrors(error.details);
      case 'SERVER_ERROR':
        return 'A server error occurred. Please try again later.';
      default:
        return error.message;
    }
  }

  private static formatValidationErrors(details: any): string {
    if (!details) return 'Validation failed';

    if (typeof details === 'string') return details;

    if (Array.isArray(details)) {
      return details.map((d) => d.message || d).join(', ');
    }

    if (typeof details === 'object') {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }

    return 'Validation failed';
  }

  static async withErrorHandling<T>(
    promise: Promise<T>,
    customMessage?: string
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handle(error, customMessage);
      return null;
    }
  }
}

export default ErrorHandler;