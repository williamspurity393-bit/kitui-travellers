import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp() as ReturnType<typeof defineApp>;
app.use(betterAuth);
app.use(rateLimiter);

export default app;
