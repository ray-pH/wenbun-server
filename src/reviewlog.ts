import { Router } from "express";
import format from "pg-format";
import { db } from "./db";
import { PoolClient } from "pg";

const router = Router();

// Legacy read endpoint, retained for clients released before write-only review logs.
router.get("/", async (req, res) => {
    const userId = req.user!.id;
    const { from } = req.query;
    const q = await db.query(
        `
        SELECT review_log FROM review_logs
        WHERE user_id = $1 AND review_date > $2
        ORDER BY review_date ASC
        `,
        [userId, from],
    );
    if (q.rowCount === 0) return res.status(204).end();
    return res.json(q.rows);
});

// Legacy endpoint, retained for clients released before write-only review logs.
router.get("/mostrecent/", async (req, res) => {
    const userId = req.user!.id;
    const q = await db.query(
        `
        SELECT review_log FROM review_logs
        WHERE user_id = $1
        ORDER BY review_date DESC
        LIMIT 1
        `,
        [userId],
    );
    if (q.rowCount === 0) return res.status(204).end();
    return res.json(q.rows[0].review_log);
});

router.post("/", async (req, res) => {
    const userId = req.user!.id;
    const { force } = req.query;
    const isLegacyBatch = Array.isArray(req.body);
    const reviewLogs = isLegacyBatch ? req.body : [req.body];

    if (!reviewLogs.length) return res.status(204).end();
    if (reviewLogs.some((reviewLog: unknown) => !reviewLog || typeof reviewLog !== "object" || Array.isArray(reviewLog))) {
        return res.status(400).json({ error: "Body must be a review log object or an array of review log objects" });
    }

    const rows = reviewLogs.map((reviewLog: any) => {
        const reviewDate = new Date(reviewLog?.log?.review ?? Date.now());
        if (Number.isNaN(reviewDate.getTime())) return null;
        return [userId, reviewLog, reviewDate.toISOString()];
    });
    if (rows.some((row: unknown) => row === null)) {
        return res.status(400).json({ error: "Review log has an invalid review date" });
    }

    try {
        // The current client sends one log at a time. The batch/force behavior is
        // retained only so already-released clients continue to work.
        if (!isLegacyBatch) {
            await db.query(
                `
                INSERT INTO review_logs (user_id, review_log, review_date)
                VALUES ($1, $2, $3)
                `,
                rows[0],
            );
            return res.status(201).json({ ok: true, inserted: 1 });
        }

        const client: PoolClient = await db.connect();
        let inTransaction = false;
        try {
            const sql = format(
                `
                INSERT INTO review_logs (user_id, review_log, review_date)
                VALUES %L
                `,
                rows,
            );
            await client.query("BEGIN");
            inTransaction = true;
            if (force === "true") {
                await client.query("DELETE FROM review_logs WHERE user_id = $1", [userId]);
            }
            await client.query(sql);
            await client.query("COMMIT");
            inTransaction = false;
            return res.json({ ok: true, inserted: rows.length });
        } catch (error) {
            if (inTransaction) {
                try { await client.query("ROLLBACK"); }
                catch (rollbackError) { console.error("Rollback failed:", rollbackError); }
            }
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Failed to insert review log:", error);
        return res.status(500).json({ error: "Failed to insert review log" });
    }
});

export default router;
