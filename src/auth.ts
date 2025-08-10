import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";

enum PROVIDER {
    GOOGLE = "google",
}

/**
 * Finds (or creates) a user given an OAuth provider + provider user id.
 * - If (provider, provider_user_id) exists -> return that user.
 * - Else if email matches an existing user -> link provider to that user.
 * - Else create a new user, then link provider.
 */
async function findOrCreateUserFromProvider(opts: {
    provider: string; // 'google' | 'github' | 'facebook' | 'local' | ...
    providerUserId: string; // ID from provider (profile.id)
    email?: string | null; // may be missing/hidden for some providers
    name?: string | null;
}) {
    const { provider, providerUserId, email, name } = opts;

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // 1) Already linked?
        const linked = await client.query(
            `
            SELECT u.*
            FROM auth_providers ap
            JOIN users u ON u.id = ap.user_id
            WHERE ap.provider = $1 AND ap.provider_user_id = $2
            `,
            [provider, providerUserId],
        );
        if (linked.rows.length > 0) {
            await client.query("COMMIT");
            return linked.rows[0];
        }

        // 2) Try to find by email (if available)
        let userRow;
        if (email) {
            const byEmail = await client.query(
                `SELECT * FROM users WHERE email = $1`,
                [email],
            );
            if (byEmail.rows.length > 0) {
                userRow = byEmail.rows[0];
            }
        }

        // 3) If no user yet, create one (allow empty email if provider doesn't give it)
        if (!userRow) {
            const insertedUser = await client.query(
                `
                INSERT INTO users (email, name)
                VALUES ($1, $2)
                RETURNING *
                `,
                [email ?? "", name ?? ""],
            );
            userRow = insertedUser.rows[0];
        }

        // 4) Link provider
        await client.query(
            `
            INSERT INTO auth_providers (user_id, provider, provider_user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (provider, provider_user_id) DO NOTHING
            `,
            [userRow.id, provider, providerUserId],
        );

        await client.query("COMMIT");
        return userRow;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const res = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
        done(null, res.rows[0] ?? false);
    } catch (err) {
        done(err);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: "/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value ?? null;
                const name =
                    profile.displayName ||
                    [profile.name?.givenName, profile.name?.familyName]
                        .filter(Boolean)
                        .join(" ") ||
                    null;

                const user = await findOrCreateUserFromProvider({
                    provider: PROVIDER.GOOGLE,
                    providerUserId: profile.id,
                    email,
                    name,
                });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        },
    ),
);

export default passport;
