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
export {};