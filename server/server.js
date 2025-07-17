const express = require('express');
const cors = require('cors');
const { createCanvas } = require('canvas');

const pool = require('./db');
const app = express();
const port = 5000;
const schema = 'notes';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPIRATION_INTERVAL = '1 day';

app.use(cors());
app.use(express.json());

app.post('/api/load', async (req, res) => {
    console.log('{load}');
    let sql = '', message, status, user_id, result;
    try {
        sql = `UPDATE ${schema}.users SET expiration = current_timestamp + interval '${EXPIRATION_INTERVAL}' WHERE session_id = $1 and current_timestamp < expiration RETURNING id`;
        result = await pool.query(sql, [req.body.session_id]);
        if (result.rowCount === 0) {
            status = 401;
            message = "unauthorized";
        } else {
            user_id = result.rows[0].id;
            sql = `SELECT id, zindex, content, position, size, color, content, fontsize FROM ${schema}.notes WHERE user_id = $1 ORDER BY id`;
            result = await pool.query(sql, [user_id]);
            status = 200;
            message = "ok";
        }
    } catch (err) {
        status = 500;
        message = "unknownerror";
        console.log(err);
    }
    res.status(status).json({ message: message, items: result.rowCount > 0 ? result.rows : [] });
});

app.post('/api/save', async (req, res) => {
    console.log('{save}');
    // console.log(JSON.stringify(req.body));
    let sql = '', message, status, user_id;
    try {
        sql = `UPDATE ${schema}.users SET expiration = current_timestamp + interval '${EXPIRATION_INTERVAL}' WHERE session_id = $1 and current_timestamp < expiration RETURNING id`;
        result = await pool.query(sql, [req.body.session_id]);
        if (result.rowCount === 0) {
            status = 401;
            message = "unauthorized";
        } else {
            user_id = result.rows[0].id;
            sql = `delete from ${schema}.notes where user_id = $1 and id not in ( select id FROM json_populate_recordset(null::notes.notes, $2) )`;
            result = await pool.query(sql, [user_id, JSON.stringify(req.body.notes)]);
            sql = `INSERT INTO ${schema}.notes (user_id, id, content, position, size, color, fontsize, zindex)
                SELECT $1, id, content, position, size, color, fontsize, zindex
                FROM json_populate_recordset(null::${schema}.notes, $2)
                ON CONFLICT (user_id, id) do update set content = excluded.content, position = excluded.position, size = excluded.size, color = excluded.color, fontsize = excluded.fontsize, zindex = excluded.zindex`;
            result = await pool.query(sql, [user_id, JSON.stringify(req.body.notes)]);
            status = 200;
            message = "ok";
        }
    } catch (err) {
        status = 500;
        message = "unknownerror";
        console.log(err);
    }
    res.status(status).json({ message: message });
});

app.post('/api/login', async (req, res) => {
    console.log('{login}');
    let result, message, session_id = "", notes = [];
    if (!EMAIL_REGEX.test(req.body.email)) { // check email format
        message = 'wrongemail';
    } else if (req.body.password.length < 6) { // check pass length
        message = 'shortpassword';
    } else {
        try {
            let sql;
            /*
            sql = `DELETE FROM ${schema}.captcha WHERE id = $1 AND val = $2 AND current_timestamp < expiration`;
            const result = await pool.query(sql, [req.body.captcha_id, String(req.body.captcha_value)]);
            if (result.rowCount === 0) {
                message = 'captchaerror';
            } else */{
                if (req.body.mode === 'signup') // signup new user
                    sql = `INSERT INTO ${schema}.users (email, password, registration, session_id, expiration, confirmation_id) VALUES ($1, md5($2), current_timestamp, md5(random()::text), current_timestamp + interval '${EXPIRATION_INTERVAL}', md5(random()::text)) RETURNING id, email, session_id`;
                else if (req.body.mode === 'signin') // signup new user
                    sql = `UPDATE ${schema}.users set session_id = md5(random()::text), expiration = current_timestamp + interval '${EXPIRATION_INTERVAL}' WHERE email = $1 AND password = md5($2) RETURNING id, email, session_id`;
                else // incorrect mode specified
                    sql = `RAISE`;
                result = await pool.query(sql, [req.body.email, req.body.password]);
                if (result.rowCount === 1) {
                    message = 'ok';
                    session_id = result.rows[0].session_id;
                    if (req.body.mode === 'signup' && req.body.notes.length > 0) {
                        sql = `INSERT INTO ${schema}.notes (user_id, id, content, position, size, color, fontsize, zindex)
                            SELECT $1, id, content, position, size, color, fontsize, zindex
                            FROM json_populate_recordset(null::${schema}.notes, $2)`;
                        result = await pool.query(sql, [result.rows[0].id, JSON.stringify(req.body.notes)]);
                    }
                } else {
                    message = 'wronguserpass';
                }
            }
        } catch (err) {
            console.log(err);
            if (parseInt(err.code) === 23505) {
                message = 'userexists';
            } else {
                message = 'unknownerror';
            }
        }
    }
    setTimeout(e => {
        res.status(200).json({ message: message, email: req.body.email, session_id: session_id });
    }, 100);
});

app.post('/api/verify', async (req, res) => {
    console.log('{verify}');
    res.status(200).json({ message: "notimplemented" });
});

function genCaptcha(number) {
    let w = 280, h = 80;
    let canvas = createCanvas(w, h);
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    for (let i = 0; i < 10; i++) { // Circles
        ctx.strokeStyle = "#" + Array(3).fill().reduce(e => e + (125 + Math.trunc(Math.random() * 130)).toString(16), '');
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 50, 0, 2 * Math.PI);
        ctx.stroke();
    }

    let str = '' + number;
    for (let i = 0; i < str.length; i++) { // Letters
        ctx.font = (40 + Math.random() * 25) + 'px Arial';
        ctx.fillStyle = "#" + Array(3).fill().reduce(e => e + (100 + Math.trunc(Math.random() * 100)).toString(16), '');
        ctx.save();
        ctx.translate(70 + i * 50, canvas.height - 10);
        ctx.rotate(- Math.random() * Math.PI / 8 * 2 + Math.PI / 8);
        ctx.textAlign = 'right';
        ctx.fillText(str[i], -15, -12);
        ctx.restore();
    }
    return canvas.toDataURL();
}

app.get('/api/captcha', async (req, res) => {
    console.log('{captcha}');
    let num = Math.trunc(1e4 + Math.random() * 9e4);
    let id;
    try {
        let sql = `DELETE FROM ${schema}.captcha WHERE current_timestamp >= expiration`; // delete expired captchas
        let result = await pool.query(sql);
        sql = `INSERT INTO ${schema}.captcha (val, expiration) VALUES ($1, current_timestamp + interval '1 minute') RETURNING id`;
        result = await pool.query(sql, [num]);
        message = 'ok';
        id = result.rows[0].id;
    } catch (err) {
        message = 'unknownerror';
    }
    setTimeout(() => {
        res.status(200).json({ message: message, id: id, image: genCaptcha(num) });
    }, 500);
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});