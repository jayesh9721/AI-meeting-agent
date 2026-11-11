# AI Meeting Agent

A dashboard for meetings processed by an AI pipeline. Recorded meetings (via Fathom) run through an n8n workflow that writes summaries, participants and action items to Supabase. This app shows them to the team: what was discussed, who owns which task, and what's coming up.

## Features
- **Dashboard:** today's overview with key stats and upcoming meetings
- **Meetings:** every processed meeting with title, date, participants, AI summary and recording link
- **Tasks:** action items extracted from meetings and assigned to team members
- **Team & Activity:** team directory and an activity log of what changed
- **Auth:** email sign-in with Supabase Auth

## Tech stack
React 19 · Vite · Supabase (Postgres + Auth) · n8n · Lucide icons

## Data model
| Table | Holds |
|---|---|
| `fathom_meetings` | Processed meetings, summaries and recording links |
| `fathom_meeting_tasks` | Action items extracted from each meeting |
| `team_members` | People that tasks are assigned to |
| `upcoming_meetings` | Scheduled meetings |
| `activity_logs` | Audit trail of changes |

## Run locally
```bash
npm install
```
Create a `.env` file:
```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Then:
```bash
npm run dev      # http://localhost:5173
npm run build    # production build
```

## License
MIT, see [LICENSE](LICENSE).
