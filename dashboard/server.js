const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.resolve(__dirname, '../results.db');

app.use(cors());
app.use(express.json());

// Open connection to SQLite results store
function getDb() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database not found at ${DB_PATH}. Please run tests or initialize database first.`);
  }
  return new Database(DB_PATH);
}

/**
 * GET /api/runs - Serves full test run history
 */
app.get('/api/runs', (req, res) => {
  try {
    const db = getDb();
    const runs = db.prepare('SELECT * FROM test_runs ORDER BY id DESC').all();
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/triage - Triggers the AI triage script on demand
 */
app.post('/api/triage', (req, res) => {
  const triageScript = path.resolve(__dirname, '../ai/triage.ts');
  exec(`npx ts-node "${triageScript}"`, { cwd: path.resolve(__dirname, '..') }, (err, stdout, stderr) => {
    if (err) {
      console.error('Triage execution failed:', stderr);
      return res.status(500).json({ error: stderr || err.message });
    }
    console.log(stdout);
    res.json({ success: true, message: 'AI triage completed successfully', output: stdout });
  });
});

// Serve static artifacts (screenshots/videos) if present
const resultsStoreDir = path.resolve(__dirname, '../results-store');
if (fs.existsSync(resultsStoreDir)) {
  app.use('/results-store', express.static(resultsStoreDir));
}

const testResultsDir = path.resolve(__dirname, '../test-results');
if (fs.existsSync(testResultsDir)) {
  app.use('/test-results', express.static(testResultsDir));
}

// Serve production React client if built
const clientDist = path.resolve(__dirname, 'client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}


const server = app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on http://localhost:${PORT}`);
  console.log(`📊 Connected to results database: ${DB_PATH}`);
});

module.exports = { app, server };
