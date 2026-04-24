import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TaskList } from '@/components/scheduler/TaskList';

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/scheduler/goals"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Goals
        </Link>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Goal Details</h1>
        <p className="mt-2 text-gray-600">
          Manage tasks for this goal. Add tasks and generate your schedule.
        </p>
      </div>

      <TaskList goalId={id} />
    </div>
  );
}
