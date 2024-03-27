import express from "express"
import {Connection} from 'postgresql-client';
import 'dotenv/config'

const app = express()
const port = 3000
const connection = new Connection(process.env.DATABASE_URL)
await connection.connect()

app.set('view engine', 'ejs');
app.use(
  express.static('assets'), 
  express.json(),
  express.urlencoded({ extended: true })
);

app.get("/", async (req, res) => {
  // Get all the notes to show 
  let db_notes_req = `SELECT * FROM notes WHERE DATE(created_at) = DATE(NOW());`
  const db_note_resp = await connection.execute(db_notes_req)
  const notes = db_note_resp.results[0].rows

  // Get the summary and score of the day
  let db_day_req = `SELECT * FROM days WHERE DATE(created_at) = DATE(NOW());`
  const db_day_resp = await connection.execute(db_day_req)

  let description = db_day_resp.results[0].rows[0]?.[1]
  let score = db_day_resp.results[0].rows[0]?.[2]

  res.render('index', { data: notes.reverse(), score: score, description: description})
})



app.post("/add", async (req, res) => {
  ///  escape single quotes
  let text = req.body.note.replaceAll("'", "''")

  /// Construct a SQL request that that performs sentiment analysis when entered into database:
  /// 
  /// 1. Analyzes the sentiment of the note
  /// 2. Converts sentiment score to +/1 or 0 dependingn on pos, neg, or neutral
  /// 3. Inserts the note and the sentiment score into the notes table
  let db_request = `
    WITH note AS (
      SELECT pgml.transform(
        inputs => ARRAY['${text}'],
        task => '{"task": "text-classification", "model": "finiteautomata/bertweet-base-sentiment-analysis"}'::JSONB
      ) AS market_sentiment
    ), 

    score AS (
      SELECT 
        CASE 
          WHEN (SELECT market_sentiment FROM note)[0]::JSONB ->> 'label' = 'POS' THEN 1
          WHEN (SELECT market_sentiment FROM note)[0]::JSONB ->> 'label' = 'NEG' THEN -1
          ELSE 0
        END AS score
    )

    INSERT INTO notes (note, score) VALUES ('${text}', (SELECT score FROM score));
  `

  await connection.execute(db_request);

  res.redirect('/')
})

app.get("/analyze", async (req, res) => {

  /// Construct a SQL request to compute daily analysis and summarization of notes:
  /// 1. Get all notes from today
  /// 2. Summarize the notes
  /// 3. Insert the summary and the sentiment score into the days table
  let db_request = `
  WITH day AS (
    SELECT 
      note,
      score
    FROM notes 
    WHERE DATE(created_at) = DATE(NOW())),

    sum AS (
      SELECT pgml.transform(
        task => '{"task": "summarization", "model": "sshleifer/distilbart-cnn-12-6"}'::JSONB,
        inputs => array[(SELECT STRING_AGG(note, '\n') FROM day)],
        args => '{"min_length" : 20, "max_length" : 70}'::JSONB
      ) AS summary
    )

    INSERT INTO days (summary, score) 
    VALUES ((SELECT summary FROM sum)[0]::JSONB ->> 'summary_text', (SELECT SUM(score) FROM day))
    On Conflict (created_at) DO UPDATE SET summary=EXCLUDED.summary, score=EXCLUDED.score 
    RETURNING score;
  `

  await connection.execute(db_request);

  res.redirect('/')
})

app.listen(port, async () => {
  // Create the notes table if it does not exist
  const notes = await connection.execute(`
    CREATE TABLE IF NOT EXISTS notes ( 
      id BIGSERIAL PRIMARY KEY, 
      note VARCHAR(5000), 
      score FLOAT, 
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  )

  // Create the days table if it does not exist
  const day = await connection.execute(`
    CREATE TABLE IF NOT EXISTS days ( 
      id BIGSERIAL PRIMARY KEY, 
      summary VARCHAR, 
      score FLOAT, 
      created_at DATE NOT NULL UNIQUE DEFAULT DATE(NOW())
    );`
  )

  console.log(`Server is running at http://localhost:${port}`)
})
