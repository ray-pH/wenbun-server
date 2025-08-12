import { type Request, type Response, type NextFunction, Router } from "express";
import { db } from "./db";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
    // tweak if your user field differs
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    next();
}

router.get("/", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const q = await db.query("SELECT data FROM profile_data WHERE user_id = $1 AND is_backup = false", [userId]);
    if (q.rowCount === 0) return res.status(204).end();
    const profile = q.rows[0].data;
    res.json(profile);
});

router.post("/", requireAuth, async (req, res) => {
    const { decision } = req.query;
    switch (decision) {
        case "pull": {
            pullPost(req, res);
        } break;
        case "push": {
        } break;
        default: {
            normalPost(req, res);
        }
    }
});

async function normalPost(req: Request, res: Response) {
    const userId = req.user!.id;
    const profileData = req.body;
    
    const existing = await db.query(
        "SELECT 1 FROM profile_data WHERE user_id = $1 AND is_backup = false",
        [userId]
    );
    
    if (existing === null) return res.status(404).json({ error: "Not found" });

    if (existing.rowCount! > 0) {
        // Update existing
        await db.query(
            `UPDATE profile_data
             SET data = $1, updated_at = now()
             WHERE user_id = $2 AND is_backup = false`,
            [profileData, userId]
        );
    } else {
        // Insert new
        await db.query(
            `INSERT INTO profile_data (user_id, data, updated_at)
             VALUES ($1, $2, now())`,
            [userId, profileData]
        );
    }

    res.json({ ok: true });
}

async function pullPost(req: Request, res: Response) {
    // user decide to use remote profile, and this post is the backup profile data from local
    const userId = req.user!.id;
    const profileData = req.body;
    
    await db.query(
        `INSERT INTO profile_data (user_id, data, is_backup, updated_at)
        VALUES ($1, $2, true, now())`,
        [userId, profileData]
    );
    res.json({ ok: true });
}

async function pushPost(req: Request, res: Response) {
    // user decide to use local profile
    // turn the current active profile to backup (set is_backup to true)
    // push the backup profile data to remote
    const userId = req.user!.id;
    const profileData = req.body;
    const client = await db.connect();
    
    await client.query("BEGIN");
    
    await client.query(
        `
        UPDATE profile_data
        SET is_backup = true
        WHERE user_id = $1 AND is_backup = false
        `,
        [userId]
    );
    
    await client.query(
        `
        INSERT INTO profile_data (user_id, data, updated_at)
        VALUES ($1, $2, now())
        `,
        [userId, profileData]
    );
    
    await client.query("COMMIT");
}

export default router;