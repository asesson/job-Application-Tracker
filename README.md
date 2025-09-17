# Job Application Tracker

A comprehensive job application tracking application built with Next.js 15, Supabase, and Tailwind CSS. Track your job applications, interviews, and career progress with an intuitive interface designed for job seekers.

## Features

### ✅ Core Features Implemented
- **User Authentication**: Secure login/signup with Supabase Auth (email/password + social logins)
- **Application Management**: Create, edit, delete, and track job applications
- **Dashboard**: Overview statistics, recent applications, and quick actions
- **Applications List**: Search, filter, and sort applications with advanced filtering
- **Kanban Board**: Drag-and-drop interface to update application status
- **Calendar Integration**: Interactive calendar with event management
- **Google Calendar Sync**: Bidirectional synchronization with Google Calendar (OAuth2)
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

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **UI**: Tailwind CSS, shadcn/ui components
- **Calendar**: React Big Calendar with Google Calendar API integration
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud Console project (for Calendar integration)

### 1. Clone and Install

```bash
git clone https://github.com/asesson/job-Application-Tracker.git
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
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Google Calendar Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your credentials to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google-calendar/callback
```

### 4. Database Setup

Run the migrations to set up your database schema:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order:
   - `supabase/migrations/20241215000000_initial_schema.sql`
   - `supabase/migrations/20241217000000_google_calendar_sync.sql`

### 5. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Set Site URL to `http://localhost:3001` (or your production URL)
3. Add redirect URLs:
   - `http://localhost:3001/dashboard`
   - `http://localhost:3001/auth/callback`
4. Enable email provider and configure SMTP (optional)
5. Enable social providers (Google, GitHub) if desired

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3001` to see the application.

## Database Schema

The application uses the following main tables:

- **profiles**: User profile information (extends Supabase auth.users)
- **applications**: Job application records with all details
- **contacts**: Contact information for each application
- **interviews**: Interview scheduling and notes
- **calendar_events**: Calendar events and scheduling
- **documents**: File storage metadata for resumes, cover letters
- **activity_logs**: Timeline tracking for application changes
- **google_calendar_tokens**: OAuth tokens for Google Calendar integration
- **google_calendar_settings**: User preferences for calendar sync
- **google_calendar_event_mappings**: Links between local and Google events

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Project Structure

```
src/
├── app/                         # Next.js App Router pages
│   ├── (auth)/                 # Authentication pages
│   ├── dashboard/              # Dashboard page
│   ├── applications/           # Application management
│   ├── board/                 # Kanban board
│   ├── calendar/              # Calendar view
│   ├── settings/              # Settings and integrations
│   └── api/                   # API routes
│       └── google-calendar/   # Google Calendar integration
├── components/                # React components
│   ├── ui/                   # shadcn/ui components
│   ├── auth/                 # Authentication components
│   ├── forms/                # Form components
│   ├── layout/               # Layout components
│   ├── board/                # Kanban board components
│   └── calendar/             # Calendar components
├── lib/                      # Utility libraries
│   ├── supabase/            # Supabase client config
│   ├── hooks/               # React hooks
│   ├── providers/           # Context providers
│   ├── services/            # API services (Google Calendar)
│   └── validations/         # Zod schemas
└── types/                   # TypeScript type definitions
```

## Key Features Explained

### Google Calendar Integration

- **OAuth2 Authentication**: Secure connection to Google Calendar
- **Bidirectional Sync**: Events sync both ways between the app and Google Calendar
- **Selective Sync**: Choose which event types to synchronize
- **Real-time Status**: Visual indicators showing sync status
- **Test Environment**: Dedicated testing endpoints for OAuth flow

### Application Status Pipeline

Applications flow through these statuses:
1. **Applied** - Initial application submitted
2. **Interview Scheduled** - Interview has been scheduled
3. **Interview Completed** - Interview process finished
4. **Offer Received** - Job offer received
5. **Rejected** - Application was unsuccessful
6. **Withdrawn** - You withdrew from the process

### Calendar Management

- **Interactive Calendar**: Monthly, weekly, and daily views
- **Event Types**: Interviews, deadlines, follow-ups, custom events
- **Quick Creation**: Add events directly from calendar interface
- **Event Details**: Rich event information with job application links
- **Google Sync**: Optional synchronization with Google Calendar

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
5. Update Google OAuth redirect URIs to production URLs
6. Deploy!

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

- [x] Google Calendar integration with OAuth2
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
