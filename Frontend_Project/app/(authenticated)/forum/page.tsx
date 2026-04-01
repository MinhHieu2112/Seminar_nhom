'use client';

import { useState } from 'react';
import { useQuestions, useCreateQuestion, useVoteQuestion } from '@/hooks/useForum';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { VoteType, type QuestionFilter } from '@/types/api-types';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle } from 'lucide-react';

const SORT_OPTIONS: { value: QuestionFilter['sort']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_answered', label: 'Most Answered' },
];

export default function ForumPage() {
  const { user } = useAuth();
  const [sort, setSort] = useState<QuestionFilter['sort']>('newest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const { data: questions, isLoading, error } = useQuestions({ sort });
  const createQuestion = useCreateQuestion();
  const voteQuestion = useVoteQuestion();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      await createQuestion.mutateAsync({
        title: formData.title,
        content: formData.content,
      });
      toast.success('Question posted successfully!');
      setFormData({ title: '', content: '' });
      setShowCreateForm(false);
    } catch {
      toast.error('Failed to post question. Please try again.');
    }
  };

  const handleVote = async (questionId: string, voteType: VoteType) => {
    try {
      await voteQuestion.mutateAsync({
        questionId,
        data: { vote_type: voteType },
      });
    } catch {
      toast.error('Failed to vote. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="⚠️"
            title="Error Loading Forum"
            description="Failed to load forum questions. Please try again later."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Forum</h1>
          <p className="text-slate-400">Ask questions and share knowledge with the community</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as QuestionFilter['sort'])}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {user && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : 'Ask Question'}
            </Button>
          )}
        </div>

        {showCreateForm && (
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Ask a Question</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="What's your question?"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 h-32 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Provide more details..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createQuestion.isPending}>
                  {createQuestion.isPending ? 'Posting...' : 'Post Question'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!questions || questions.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No Questions Yet"
            description="Be the first to ask a question!"
          />
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-purple-500 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleVote(question.id, VoteType.UPVOTE)}
                      className="p-1 hover:bg-slate-800 rounded transition-colors"
                      disabled={voteQuestion.isPending}
                    >
                      <ThumbsUp className="w-5 h-5 text-slate-400 hover:text-purple-400" />
                    </button>
                    <span className="text-sm font-medium text-white">
                      {question.answer_count || 0}
                    </span>
                    <button
                      onClick={() => handleVote(question.id, VoteType.DOWNVOTE)}
                      className="p-1 hover:bg-slate-800 rounded transition-colors"
                      disabled={voteQuestion.isPending}
                    >
                      <ThumbsDown className="w-5 h-5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/forum/${question.id}`}>
                      <h3 className="text-lg font-semibold text-white hover:text-purple-400 mb-2">
                        {question.title}
                        {question.is_resolved && (
                          <CheckCircle className="inline-block w-5 h-5 text-emerald-400 ml-2" />
                        )}
                      </h3>
                    </Link>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{question.content}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Posted by {question.user?.username || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{question.view_count} views</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {question.answer_count || 0} answers
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
