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

## Architecture

The application uses a modular NestJS architecture:

```text
HTTP controllers
        |
Application services
        |
Repositories  ----  AI providers
        |
Prisma service
        |
SQLite (local) / Turso LibSQL (production)
```

- `AppModule` composes the application modules.
- `AnalysisModule` handles uploads, document extraction, analysis orchestration, and history endpoints.
- `AiModule` integrates Gemini as the primary provider and Groq as a fallback.
- `PrismaModule` provides database access through Prisma Client adapters.
- PDF and DOCX text extraction is kept separate from analysis logic so parsers can be replaced independently.

## Design decisions

- **Modular boundaries:** Controllers handle HTTP concerns, services coordinate use cases, and the repository owns persistence queries.
- **Provider fallback:** Gemini is attempted first; Groq is used when configured and Gemini fails, improving availability without coupling the application to one AI vendor.
- **Environment-based storage:** Local development uses SQLite, while production uses Turso LibSQL through environment-configured Prisma adapters.
- **Validated configuration:** Startup validates required environment variables and provider credentials before accepting requests.
- **Validated uploads:** Only PDF and DOCX files are accepted, with file type and size validation before extraction.
- **Bounded output:** Extracted document text is normalized and capped at 100,000 characters to control memory usage and AI request size.
- **Structured AI output:** AI responses are validated with Zod before being stored, preventing malformed analysis data from entering the database.
- **Serverless compatibility:** The NestJS entrypoint and PDF canvas support are configured for Vercel deployment.

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
