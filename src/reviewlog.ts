import { type Request, type Response, type NextFunction, Router } from "express";
import format from "pg-format";
import { db } from "./db";
import { PoolClient } from "pg";

const router = Router();

router.get("/", async (req, res) => {
    const userId = req.user!.id;
    const { from } = req.query;
    // query array of review log that are newer than fromDate
    const q = await db.query(
        `
        SELECT review_log FROM review_logs
        WHERE user_id = $1 AND review_date > $2
        ORDER BY review_date ASC
        `,
        [userId, from]
    );
    if (q.rowCount === 0) return res.status(204).end();
    res.json(q.rows);
});

router.get("/mostrecent/", async (req, res) => {
    const userId = req.user!.id;
    const q = await db.query(
        `
        SELECT review_log FROM review_logs
        WHERE user_id = $1
        ORDER BY review_date DESC
        LIMIT 1
        `,
        [userId]
    );
    if (q.rowCount === 0) return res.status(204).end();
    res.json(q.rows[0].review_log);
});

router.post("/", async (req, res) => {
    const userId = req.user!.id;
    const { force } = req.query;
    
    const client: PoolClient = await db.connect();
    
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: "Body must be an array" });
        }
        const reviewLogs: Array<{log:{review: string|number|Date}}> = req.body;
        
        const rows = reviewLogs.map((item: any) => [
            userId,
            item,
            new Date(item?.log?.review ?? Date.now()).toISOString(),
        ]);
        
        if (rows.length === 0) return res.status(204).end();
        const sql = format(
            `
            INSERT INTO review_logs (user_id, review_log, review_date)
            VALUES %L
            `,
            rows
        );
        await client.query("BEGIN");
        if (force === "true") {
            // delete all existing review logs
            await client.query(
                `
                DELETE FROM review_logs
                WHERE user_id = $1
                `,
                [userId]
            );
        }
        await client.query(sql);
         await client.query("COMMIT");
        res.json({ ok: true, inserted: rows.length });
    } catch (e) {
        console.error(e);
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Failed to insert review log" });
    }
});

export default router;