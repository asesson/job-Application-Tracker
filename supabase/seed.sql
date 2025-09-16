-- Seed data for development and testing
-- This will create sample data for a test user

-- Note: This assumes you have a test user with a specific UUID
-- In production, you'd insert real data through the application

-- Sample applications for demonstration
INSERT INTO public.applications (
  user_id,
  company_name,
  job_title,
  description,
  application_date,
  status,
  salary_min,
  salary_max,
  salary_currency,
  job_url,
  notes,
  tags,
  priority
) VALUES
(
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'TechCorp Inc',
  'Senior Frontend Developer',
  'Looking for an experienced React developer to join our growing team.',
  '2024-01-15',
  'interview_scheduled',
  80000,
  120000,
  'USD',
  'https://techcorp.com/careers/senior-frontend',
  'Applied through company website. HR responded within 2 days.',
  ARRAY['remote', 'react', 'frontend'],
  'high'
),
(
  '00000000-0000-0000-0000-000000000000',
  'StartupXYZ',
  'Full Stack Engineer',
  'Early-stage startup building innovative fintech solutions.',
  '2024-01-10',
  'rejected',
  70000,
  90000,
  'USD',
  'https://startupxyz.com/jobs/fullstack',
  'Fast-paced environment, equity compensation.',
  ARRAY['startup', 'fullstack', 'fintech'],
  'medium'
),
(
  '00000000-0000-0000-0000-000000000000',
  'BigTech Solutions',
  'Software Engineer II',
  'Join our platform engineering team working on scalable systems.',
  '2024-01-20',
  'applied',
  95000,
  130000,
  'USD',
  'https://bigtech.com/careers/swe-ii',
  'Referral from John Doe. Large team, good benefits.',
  ARRAY['platform', 'backend', 'scale'],
  'high'
);

-- Note: To use this seed file, you would need to:
-- 1. Create a Supabase project
-- 2. Run the migration
-- 3. Replace the user_id with your actual authenticated user ID
-- 4. Run this seed file