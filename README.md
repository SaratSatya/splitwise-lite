# Splitwise-lite

A Splitwise-inspired expense sharing app with groups, invite links, multi-split expenses, balances, and settlements.

## Features
- Auth: Google + GitHub OAuth (NextAuth)
- Groups: create group, membership enforcement
- Invites: owner-only invite links, join via token
- Expenses: EQUAL / EXACT / PERCENT splits, idempotency support
- Balances: net balances + minimized settlement suggestions
- Settlements: record settlements + “use suggestion” workflow
- Safety: soft-delete expenses + activity log (audit trail)
- Pagination: cursor-based “Load more” for expenses and settlements
- RBAC: owner-only member removal (cannot remove last owner; cannot remove member with non-zero balance)

## Tech Stack
- Next.js (App Router)
- NextAuth.js (OAuth)
- Prisma ORM + MongoDB Atlas
- TypeScript
- Tailwind CSS

---

## Local Setup
1)clone the project and install the dependenices using the command npm install

2) Create .env.local (in project root)

Create a file named .env.local next to package.json.

Include the code in the .env.local file 

DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/splitwise-lite?retryWrites=true&w=majority"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_LONG_RANDOM_SECRET"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

GITHUB_ID="..."
GITHUB_SECRET="..."


Notes:

Do NOT commit .env.local

Optional: create .env.example for the repo (without secrets)

3) Run the below Prisma commands
npx prisma db push
npx prisma generate

4) Run
npm run dev


Open: http://localhost:3000
