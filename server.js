
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const DB_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const defaultDb = {
    users: [],
    ownerPassword: "owner123"
};

app.get('/api/db', async (req, res) => {
    try {
        const response = await fetch(DB_URL + '/latest', { headers: { 'X-Master-Key': API_KEY } });
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        res.json(data.record);
    } catch (err) {
        console.error('GET Error:', err.message);
        res.json(defaultDb);
    }
});

app.post('/api/db', async (req, res) => {
    try {
        const response = await fetch(DB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(req.body)
        });
        if (!response.ok) throw new Error('Save failed');
        res.json({ success: true });
    } catch (err) {
        console.error('POST Error:', err.message);
        res.status(500).json({ error: 'Failed to save database' });
    }
});

app.listen(PORT, () => console.log(`NeoLearn Server is running on http://localhost:${PORT}`));
