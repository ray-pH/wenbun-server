import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors"
import dotenv from "dotenv";
import "./auth";

dotenv.config();

const app = express();

// If behind a proxy/load balancer in prod, uncomment these:
// app.set('trust proxy', 1);

app.use(cors({
    origin: true, // allow all origins for development
    credentials: true,
}));

app.use(
    session({
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        // If frontend is on a different domain and you need cross-site cookies for API calls:
        // cookie: { sameSite: 'lax', secure: false } // set secure:true on HTTPS
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

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
