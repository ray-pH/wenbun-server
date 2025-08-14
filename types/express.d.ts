declare global {
    namespace Express {
        interface User {
            id: string; // or UUID type
            email?: string;
            name?: string;
        }
        interface Request {
            user?: User;
        }
    }
}

declare module "express-session" {
    interface SessionData {
        passport?: { user: any };
    }
}

export {};