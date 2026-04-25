'use client';

import { useState } from 'react';
import { X, Calendar, UploadCloud, Target, AlignLeft, Clock } from 'lucide-react';
import { useAIGenerateSchedule } from '@/lib/hooks/useScheduler';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromDate: string;
  defaultToDate: string;
}

export function GenerateScheduleModal({ isOpen, onClose, defaultFromDate, defaultToDate }: GenerateScheduleModalProps) {
  const [subject, setSubject] = useState('');
  const [fromDate, setFromDate] = useState(defaultFromDate.split('T')[0]);
  const [toDate, setToDate] = useState(defaultToDate.split('T')[0]);
  const [studyHours, setStudyHours] = useState(2);
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['morning']);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const generateSchedule = useAIGenerateSchedule();

  if (!isOpen) return null;

  const handleTimeToggle = (time: string) => {
    setPreferredTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('fromDate', new Date(fromDate).toISOString());
    formData.append('toDate', new Date(toDate).toISOString());
    formData.append('studyHoursPerDay', studyHours.toString());
    formData.append('preferredTimes', JSON.stringify(preferredTimes));
    if (notes) formData.append('notes', notes);
    if (file) formData.append('csvFile', file);

    generateSchedule.mutate(formData, {
      onSuccess: () => {
        setSubject('');
        setFile(null);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate AI Schedule</h2>
              <p className="text-sm text-gray-500">Set up your study schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title/Subject */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Target className="h-4 w-4 text-gray-400" />
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Learn React Basics"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Study Hours & Preferred Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4 text-gray-400" />
                Hours per day <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                Preferred Time <span className="text-red-500">*</span>
              </label>
              <div className="flex h-11.5 items-center gap-4 rounded-xl border border-gray-200 px-4 shadow-none">
                {['morning', 'afternoon', 'evening'].map((time) => (
                  <label key={time} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferredTimes.includes(time)}
                      onChange={() => handleTimeToggle(time)}
                      className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="capitalize">{time}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Description/Notes */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlignLeft className="h-4 w-4 text-gray-400" />
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about your goal or AI preferences..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* CSV Upload */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <UploadCloud className="h-4 w-4 text-gray-400" />
              Timetable (CSV) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="mt-1 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-6 hover:bg-gray-50 transition-colors">
              <div className="space-y-2 text-center">
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer rounded-md bg-transparent font-medium text-blue-600 focus-within:outline-none hover:text-blue-500">
                    <span>Upload a file</span>
                    <input type="file" accept=".csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Only .csv files</p>
                {file && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    ✓ {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {generateSchedule.isError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {generateSchedule.error?.message || 'Có lỗi xảy ra khi tạo lịch. Vui lòng thử lại.'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generateSchedule.isPending || !subject || preferredTimes.length === 0}
              className="inline-flex items-center justify-center min-w-35 gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-none transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none [&:not(:disabled)]:bg-gradient-to-r [&:not(:disabled)]:from-blue-400 [&:not(:disabled)]:to-purple-400 [&:not(:disabled)]:hover:opacity-90"
            >
              {generateSchedule.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
