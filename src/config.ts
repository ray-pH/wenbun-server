
import dotenv from "dotenv";

dotenv.config();

export const allowedOrigins = (process.env.CLIENT_URLS ?? "").split(",").map(s => s.trim());
export const isProd = process.env.NODE_ENV === "production";
