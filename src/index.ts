import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import passport from "passport";
import cors from "cors"
import dotenv from "dotenv";
import "./auth";
import profileDataRouter from "./profiledata";
import reviewLogRouter from "./reviewlog";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === "production";

const limiter = rateLimit({
	windowMs: 60_000, // 1 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 1 minutes).
	standardHeaders: "draft-7",
	legacyHeaders: false,
})

// If behind a proxy/load balancer in prod, uncomment these:
app.set('trust proxy', 1);

app.use(limiter);
app.use(cors({
    origin: isProd ? process.env.CLIENT_BASE_URL ?? process.env.CLIENT_URL : true,
    credentials: true,
}));

app.use(express.json());

// simple slow internet simulation
// if (process.env.NODE_ENV !== "production") {
//     app.use((_req, _res, next) => {
//         setTimeout(next, 1000);
//     });
// }

app.use(
    session({
        store: new (connectPgSimple(session))({
            pool: db,
            createTableIfMissing: true,
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        // if under the same domain:
        // cookie: {
        //     sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
        //     secure: process.env.NODE_ENV === "production",
        // },
        // otherwise:
        cookie: {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        }
    }),
);

app.use((req, res, next) => {
    if (!req.session.passport && req.path.startsWith("/auth")) return next();
    if (!req.session.passport) return res.status(401).json({ error: "Not authenticated" });
    next();
})

app.use(passport.initialize());
app.use(passport.session());

// Kick off OAuth from the SERVER route:
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google redirects back here (must match Console redirect URI)
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (_req, res) => {
        const clientSettingsUrl = process.env.CLIENT_URL! + "/settings";
        res.redirect(clientSettingsUrl);
    },
);

app.get("/profile", (req, res) => {
    if (!req.user) return res.status(401).send("Not logged in");
    res.json(req.user);
});

app.get("/auth/logout", (req, res) => {
    const clientSettingsUrl = process.env.CLIENT_URL! + "/settings";
    req.logout(() => res.redirect(clientSettingsUrl));
});

app.use("/profiledata", profileDataRouter);
app.use("/reviewlog", reviewLogRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
