import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TaskList } from '@/components/scheduler/TaskList';

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

// UUID v4 pattern — bất kỳ giá trị nào không phải UUID đều bị chặn
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = await params;

  // FIX: "new" (và các string không phải UUID) bị Next.js route-match vào [id].
  // Nếu không chặn ở đây, TaskList sẽ gọi GET /scheduler/goals/new/tasks → backend 500.
  if (!id || !UUID_REGEX.test(id)) {
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