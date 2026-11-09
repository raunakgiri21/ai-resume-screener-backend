# Resume Screener Backend

## Setup

```bash
npm install
copy .env.example .env
```

Add at least one AI provider key to `.env`:

```env
GEMINI_API_KEY=your-key
# or
GROQ_API_KEY=your-key
```

## Run

```bash
npm run start:dev
```

The API runs at `http://localhost:3000`.

## Client API

### Health check

`GET /health`

### Create an analysis

`POST /api/analyses`

Send `multipart/form-data` with:

- `candidateName`: candidate name
- `jobDescription`: PDF or DOCX file, maximum 5 MB
- `resume`: PDF or DOCX file, maximum 5 MB

### List analysis history

`GET /api/analyses`

Optional query parameters:

- `search`
- `minScore`
- `maxScore`
- `page` (default `1`)
- `limit` (default `10`, maximum `50`)

### Get one analysis

`GET /api/analyses/:id`

For browser clients, set `FRONTEND_URL` in `.env` to the client origin, for example `http://localhost:5173`.

## Note

GitHub Copilot was used for minor bug fixes and documentation.
