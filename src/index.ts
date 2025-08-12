import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors"
import dotenv from "dotenv";
import "./auth";
import profileDataRouter from "./profiledata";
import reviewLogRouter from "./reviewlog";

dotenv.config();

const app = express();

// If behind a proxy/load balancer in prod, uncomment these:
// app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : true,
    credentials: true,
}));

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
            secure: process.env.NODE_ENV === "production",
        },
    }),
);

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
