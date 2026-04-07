import { handler } from "@/lib/auth-server";

export const { GET, POST } = handler;

// Better Auth occasionally uses other HTTP methods via plugins
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
