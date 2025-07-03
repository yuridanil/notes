const express = require('express');
const cors = require('cors');

const pool = require('./db');
const app = express();
const port = 5000;
const schema = 'notes';

app.use(cors());
app.use(express.json());

app.post('/api/load', async (req, res) => {
    try {
        let sql = `SELECT id::float, zindex, content, position, size, color, content, fontsize FROM ${schema}.notes WHERE user_id = $1 ORDER BY id`;
        const result = await pool.query(sql, [req.body.user_id]);
        res.status(200).json({ result: "ok", items: result.rows });
    } catch (err) {
        res.status(200).json({ result: "error", error: err });
    }
});

app.post('/api/save', async (req, res) => {
    try {
        let sql;
        let result;

        sql = `delete from ${schema}.notes where user_id = $1 and id not in ( select id FROM json_populate_recordset(null::notes.notes, $2) )`;
        result = await pool.query(sql, [req.body.user_id, JSON.stringify(req.body.notes)]);

        sql = ` INSERT INTO ${schema}.notes (id, user_id, content, position, size, color, fontsize, zindex)
                SELECT id, $1, content, position, size, color, fontsize, zindex
                FROM json_populate_recordset(null::${schema}.notes, $2)
                ON CONFLICT (id, user_id) do update set content = excluded.content, position = excluded.position, size = excluded.size, color = excluded.color, fontsize = excluded.fontsize, zindex = excluded.zindex
        `;
        result = await pool.query(sql, [req.body.user_id, JSON.stringify(req.body.notes)]);
        
        setTimeout(e => {
            res.status(200).json({ result: "ok" });
        }, 500)
    } catch (err) {
        res.status(200).json({ result: "error", error: err });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});