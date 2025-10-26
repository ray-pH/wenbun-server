import { Router } from "express";
import { Resend } from "resend";
import crypto from "crypto";
import { db } from "./db";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY!);

// POST /account/request-delete
router.post("/request-delete", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    const allowedOrigins = (process.env.CLIENT_URLS ?? "").split(",").map(s => s.trim());
    const clientUrl = allowedOrigins[0];

    try {
        const { rows } = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email],
        );

        if (rows.length > 0) {
            const userId = rows[0].id;
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

            await db.query(
                "INSERT INTO deletion_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
                [token, userId, expiresAt],
            );

            const link = `${clientUrl}/account/delete?token=${token}`;

            await resend.emails.send({
                from: "WenBun <noreply@mail.wenbun.com>",
                to: email,
                subject: "Confirm WenBun account deletion",
                html: `
                <div style="background-color: #E0E0E0; padding: 2em; font-family: 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="background-color: white; padding: 2em; border-radius: 0.5em; max-width: 24em; margin: auto; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 1em;">
                            <h1 style="font-size: 1.5em; color: #333; margin: 0;">WenBun</h1>
                        </div>
                        <p>You requested to delete your account.</p>
                        <p>If this was you, click the button below:</p>
                        <p style="margin: 2em;">
                            <a href="${link}" style="
                                color: white;
                                background-color: #3E92CC;
                                border-radius: 0.5em;
                                padding: 0.7em 1.2em;
                                text-decoration: none;
                            ">Delete My Account</a>
                        </p>
                        <p>This link expires in 24 hours.</p>
                    </div>
                </div>
                `,
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /account/delete
router.get("/delete", async (req, res) => {
    const { token } = req.query as { token?: string };
    if (!token) return res.status(400).send("Missing token");

    try {
        const { rows } = await db.query(
            "SELECT user_id, expires_at FROM deletion_tokens WHERE token = $1",
            [token],
        );

        if (rows.length === 0) {
            return res.status(400).send("Invalid link");
        }

        const record = rows[0];
        if (new Date(record.expires_at) < new Date()) {
            return res.status(400).send("Expired link");
        }

        await db.query("DELETE FROM users WHERE id = $1", [record.user_id]);

        await db.query("DELETE FROM deletion_tokens WHERE user_id = $1", [record.user_id]);

        res.send("Your account has been deleted.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

export default router;
