export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("unauthenticated") ||
      message.includes("unauthorized") ||
      message.includes("not authenticated")
    );
  }
  return false;
}

export function isAuthorizationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("forbidden") || message.includes("access required");
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred. Please try again.";
}
