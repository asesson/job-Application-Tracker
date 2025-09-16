# Job Application Tracker

A comprehensive job application tracking application built with Next.js 14, Supabase, and Tailwind CSS. Track your job applications, interviews, and career progress with an intuitive interface designed for job seekers.

## Features

### ✅ Core Features Implemented
- **User Authentication**: Secure login/signup with Supabase Auth (email/password + social logins)
- **Application Management**: Create, edit, delete, and track job applications
- **Dashboard**: Overview statistics, recent applications, and quick actions
- **Applications List**: Search, filter, and sort applications with advanced filtering
- **Kanban Board**: Drag-and-drop interface to update application status
- **Form Validation**: Comprehensive form handling with Zod validation
- **Real-time Updates**: Live updates using Supabase subscriptions
- **Responsive Design**: Mobile-first design that works on all devices

### 🚧 Features In Development
- Interview management system
- Document management with file uploads
- Analytics dashboard with charts
- Email notifications and reminders
- Data import/export functionality
- Team collaboration features

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **UI**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo>
cd job-application-tracking
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the migration to set up your database schema:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20241215000000_initial_schema.sql`
4. Execute the query

### 4. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Set Site URL to `http://localhost:3000` (or your production URL)
3. Add redirect URLs:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`
4. Enable email provider and configure SMTP (optional)
5. Enable social providers (Google, GitHub) if desired

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses the following main tables:

- **profiles**: User profile information (extends Supabase auth.users)
- **applications**: Job application records with all details
- **contacts**: Contact information for each application
- **interviews**: Interview scheduling and notes
- **documents**: File storage metadata for resumes, cover letters
- **activity_logs**: Timeline tracking for application changes

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── applications/      # Application management
│   ├── board/            # Kanban board
│   └── analytics/        # Analytics (coming soon)
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── board/           # Kanban board components
├── lib/                 # Utility libraries
│   ├── supabase/        # Supabase client config
│   ├── hooks/           # React hooks
│   ├── providers/       # Context providers
│   └── validations/     # Zod schemas
└── types/               # TypeScript type definitions
```

## Key Features Explained

### Application Status Pipeline

Applications flow through these statuses:
1. **Applied** - Initial application submitted
2. **Interview Scheduled** - Interview has been scheduled
3. **Interview Completed** - Interview process finished
4. **Offer Received** - Job offer received
5. **Rejected** - Application was unsuccessful
6. **Withdrawn** - You withdrew from the process

### Kanban Board

- Drag and drop applications between status columns
- Real-time updates across all users/devices
- Visual priority indicators
- Quick access to application details

### Search and Filtering

- Search by company name, job title, or tags
- Filter by status and priority
- Sort by various criteria (date, company, etc.)
- Clear filter functionality

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase redirect URLs to your production domain
5. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## Roadmap

- [ ] Interview management system
- [ ] Document upload and management
- [ ] Advanced analytics and reporting
- [ ] Email notifications and reminders
- [ ] Data import/export (CSV, JSON)
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] API integrations with job boards

---

Built with ❤️ using Next.js and Supabase