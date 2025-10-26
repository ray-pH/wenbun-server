import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware that extracts and verifies a Bearer JWT from the Authorization header.
 * If valid, populates req.user so downstream routes can use it.
 */
export function jwtMiddleware(req: Request, _res: Response, next: NextFunction) {
    // Use Express's built-in .get() helper to avoid TS "authorization" error
    const authHeader = req.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) return next();

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            sub?: string;
            email?: string;
            name?: string;
            [k: string]: unknown;
        };

        (req as any).user = {
            id: payload.sub ?? payload["user_id"] ?? payload["id"],
            email: payload.email,
            name: payload.name,
            jwt: payload, // optional: keep raw payload
        };
    } catch {
        // ignore invalid/expired tokens
    }

    next();
}