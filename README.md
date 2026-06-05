# PreOne

**All-in-One Preschool Operating System**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

ERP + Communication + AI Growth Platform for modern preschools.

---

## Features

### Admin Portal

- Student management
- Teacher management
- Attendance tracking
- Fee management with invoices/payments
- CRM & Admissions pipeline
- Growth tracking
- Activity management
- Communication hub
- Transport management
- Reports & exports
- System settings

### Teacher Portal

- My class dashboard
- Daily updates (meals/nap/mood)
- Attendance marking
- Observations
- Growth assessments
- Schedule
- Activities
- Communication

### Parent Portal

- Child dashboard
- Attendance view
- Fee payments & receipts
- Daily updates
- Growth tracking
- Observations
- Communication with teachers

### CRM (Task Master)

- Lead pipeline (Kanban)
- Follow-up management
- Task tracking
- Revenue estimation

### Cross-Portal

- Real-time notifications
- Role-based access control
- Branch management

---

## Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                 |
| Language   | TypeScript 5                                       |
| Database   | Prisma ORM (SQLite dev / PostgreSQL prod)          |
| UI         | Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion |
| Charts     | Recharts, TanStack Table                           |
| Auth       | Custom JWT (HMAC-SHA256), 4 roles                  |
| State      | Zustand, TanStack React Query                      |
| Export     | PDF (PDFKit), Excel (ExcelJS)                      |
| Deployment | Vercel / Docker                                    |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/nueera/preone.git

# Navigate into the project directory
cd preone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma db push
npx prisma generate

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
preone/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin portal pages
│   │   ├── teacher/        # Teacher portal pages
│   │   ├── parent/         # Parent portal pages
│   │   └── api/            # API route handlers (grouped by module)
│   ├── components/
│   │   └── ui/             # Shared UI components (shadcn/ui)
│   └── lib/
│       ├── auth.ts         # Authentication utilities
│       ├── db.ts           # Database client
│       ├── notifications.ts # Notification service
│       ├── theme-tokens.ts  # Theme configuration
│       └── ...             # Other utilities
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                 # Static assets
└── ...config files
```

---

## API Reference

The API is organized into the following route groups:

| Route Group          | Description                         |
| -------------------- | ----------------------------------- |
| `/api/auth`          | Authentication & session management |
| `/api/students`      | Student CRUD operations             |
| `/api/teachers`      | Teacher CRUD operations             |
| `/api/parents`       | Parent CRUD operations              |
| `/api/attendance`    | Attendance tracking                 |
| `/api/fees`          | Fee management, invoices & payments |
| `/api/growth`        | Growth tracking & assessments       |
| `/api/activities`    | Activity management                 |
| `/api/transport`     | Transport management                |
| `/api/communication` | Messages & notifications            |
| `/api/crm`           | CRM leads, pipeline & tasks         |
| `/api/reports`       | Reports & data exports              |
| `/api/settings`      | System configuration                |

---

## Default Login Credentials

| Role    | Email              | Password   |
| ------- | ------------------ | ---------- |
| Admin   | admin@preone.com   | admin123   |
| Teacher | teacher@preone.com | teacher123 |
| Parent  | parent@preone.com  | parent123  |

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## Links

- **GitHub**: [https://github.com/nueera/preone](https://github.com/nueera/preone)
