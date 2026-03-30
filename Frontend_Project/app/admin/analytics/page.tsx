'use client';

import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';

export default function AdminAnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Advanced Analytics"
        description="Detailed platform analytics and insights"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Analytics</h3>
          <p className="text-slate-400">Detailed user engagement, retention, and growth metrics.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Content Performance</h3>
          <p className="text-slate-400">Analytics on course completion rates, exercise difficulty metrics, and engagement.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Submission Trends</h3>
          <p className="text-slate-400">Code submission patterns, language popularity, and success rates by skill level.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue & Usage</h3>
          <p className="text-slate-400">Platform usage statistics, resource consumption, and potential monetization metrics.</p>
        </div>
      </div>
    </PageContainer>
  );
}
