import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import passport from "passport";
import cors from "cors"
import dotenv from "dotenv";
import authRouter from "./auth";
import profileDataRouter from "./profiledata";
import reviewLogRouter from "./reviewlog";
import accountDeleteRouter from "./account_delete";
import rateLimit from "express-rate-limit";
import { allowedOrigins, isProd } from "./config";

dotenv.config();

const app = express();

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
    origin: (origin, callback) => {
        // Allow requests with no origin (like curl or mobile app)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
    
        console.warn("Blocked CORS request from:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    if (!req.session.passport && req.path.startsWith("/auth")) return next();
    if (!req.session.passport && req.path.startsWith("/account-delete")) return next();
    if (!req.session.passport) return res.status(401).json({ error: "Not authenticated" });
    next();
})

app.get("/profile", (req, res) => {
    if (!req.user) return res.status(401).send("Not logged in");
    res.json(req.user);
});

app.use("/auth", authRouter);
app.use("/profiledata", profileDataRouter);
app.use("/reviewlog", reviewLogRouter);
app.use("/account-delete", accountDeleteRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
