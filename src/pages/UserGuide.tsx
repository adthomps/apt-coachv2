import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Dashboard',
    body: 'Your Command Center. Glance at active health signals, training continuity, and the day\'s priority direction.',
    to: '/dashboard',
  },
  {
    title: 'Training',
    body: 'Library of exercises, workouts, programs, and your session history. Start, pause, and resume sessions live.',
    to: '/training',
  },
  {
    title: 'Schedule',
    body: 'Plan upcoming sessions and review what\'s completed. Pausing a session auto-shifts the schedule forward.',
    to: '/schedule',
  },
  {
    title: 'Health Data',
    body: 'DEXA body scans, smart-scale (Withings) readings, and Rythm blood panels — with grounded AI insights.',
    to: '/health',
  },
  {
    title: 'Imports',
    body: 'All data imports (BodySpec, Withings, Rythm, libraries) live in Admin → Imports.',
    to: '/admin?tab=imports',
  },
];

const UserGuide: React.FC = () => (
  <Layout>
    <div className="space-y-6">
      <PageHeader
        title="User Guide"
        icon={<BookOpen className="h-8 w-8 text-primary" />}
        description="Quick orientation to APT Coach. Every recommendation is grounded in data you import — no guessing."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <SectionCard key={s.title} title={s.title} description={s.body}>
            <Link to={s.to}>
              <Button variant="ghost" size="sm" className="text-xs">
                Open <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </SectionCard>
        ))}
      </div>
    </div>
  </Layout>
);

export default UserGuide;
