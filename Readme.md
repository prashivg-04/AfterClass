# AfterClass

A tuition management platform that bridges the gap between offline teaching and digital learning continuity.

Teachers create tuition spaces, log classes, conduct quizzes, and track payments. Students join via a code, attempt quizzes, ask doubts, and manage their fees — all in one place.

**Live Demo:** [afterclass.vercel.app](https://afterclass.vercel.app) <!-- replace with actual URL -->

---

## Features

**For Teachers**
- Create and manage tuition spaces with a shareable join code
- Log classes with topics, date, and summary
- Mark and lock student attendance
- Build and publish quizzes with MCQs
- View quiz analytics and student performance
- Manage student fees — mark paid, pending, or unpaid
- Share UPI ID and QR code for payments
- Post announcements and chat with students

**For Students**
- Join multiple tuitions via code
- View class history and attendance
- Attempt quizzes and see results instantly
- Ask doubts on specific classes
- Track fee status and send payment requests
- Access resources and study materials

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| State Management | Redux Toolkit |
| Backend & Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Local Setup

```bash
# Clone the repo
git clone https://github.com/your-username/AfterClass.git
cd AfterClass

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Start development server
npm run dev
```

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for environment variable details and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Supabase deployment guide |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables reference |
| [SECURITY.md](docs/SECURITY.md) | RLS policies and security model |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Database schema and query patterns |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute |

---

## Project Structure

```
src/
├── components/        # Feature components
│   ├── class-detail/  # Class attendance, doubts, resources
│   ├── dashboard/     # Teacher and student dashboards
│   ├── payments/      # Fee management
│   └── tuition-detail/# Quizzes, announcements, discussion
├── lib/               # Supabase client, Redux store, Auth context
├── pages/             # Route-level page components
├── schemas/           # Zod validation schemas
└── utilities/         # Helper functions
```

---

## Security

- All database tables are protected with Row Level Security (RLS)
- Teachers can only access their own tuition data
- Students can only access tuitions they are enrolled in
- No secrets are committed to this repository

See [docs/SECURITY.md](docs/SECURITY.md) for the full security model.

---

## License

MIT