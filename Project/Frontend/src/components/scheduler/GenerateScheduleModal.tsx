'use client';

import { useState, useRef } from 'react';
import { X, Target, UploadCloud, FileText, Calendar, Clock, Plus, Trash2, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useGoals } from '@/lib/hooks/useScheduler';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromDate: string;
  defaultToDate: string;
}

interface ManualTask {
  id: string;
  title: string;
  duration: number;
  priority: number;
  deadline: string;
}

interface BusySlot {
  id: string;
  day: string;
  slots: string;
}

interface UnifiedTaskPreview {
  id: string;
  title: string;
  duration: number;
  priority: number;
  deadline?: string;
}

interface UnifiedConstraintEntry {
  day: string;
  slots: string[];
}

interface UnifiedPreviewData {
  tasks: UnifiedTaskPreview[];
  constraints: {
    availableTime: UnifiedConstraintEntry[];
    busyTime: UnifiedConstraintEntry[];
  };
}

type Step = 'input' | 'preview' | 'done';
type InputMode = 'manual' | 'csv';

function formatLocalDateInput(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split('T')[0];
}

function getMinAllowedDate(defaultFromDate: string) {
  const today = formatLocalDateInput(new Date());
  const fallback = defaultFromDate.split('T')[0];
  return fallback > today ? fallback : today;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export function GenerateScheduleModal({ isOpen, onClose, defaultFromDate, defaultToDate }: GenerateScheduleModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const minAllowedDate = getMinAllowedDate(defaultFromDate);

  const [step, setStep] = useState<Step>('input');
  const [mode, setMode] = useState<InputMode>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');

  // Manual mode state
  const [tasks, setTasks] = useState<ManualTask[]>([
    { id: '1', title: '', duration: 60, priority: 3, deadline: defaultToDate.split('T')[0] }
  ]);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);

  // CSV mode state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');

  // Unified JSON preview (after Phase 1)
  const [unifiedData, setUnifiedData] = useState<UnifiedPreviewData | null>(null);

  const { data: goalData } = useGoals(1, 50);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    const goal = goalData?.data.find(g => g.id === goalId);
    if (goal) {
      setGoalTitle(goal.title);
      if (goal.tasks && goal.tasks.length > 0) {
        setTasks(goal.tasks.map(t => ({
          id: t.id,
          title: t.title,
          duration: 60, // default
          priority: t.priority || 3,
          deadline: goal.deadline ? goal.deadline.split('T')[0] : defaultToDate.split('T')[0]
        })));
      }
    }
  };

  if (!isOpen) return null;

  // ... (Manual task helpers)

  const addTask = () => {
    setTasks(prev => [...prev, { id: Date.now().toString(), title: '', duration: 60, priority: 3, deadline: defaultToDate.split('T')[0] }]);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: keyof ManualTask, value: string | number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addBusySlot = () => {
    setBusySlots(prev => [...prev, { id: Date.now().toString(), day: minAllowedDate, slots: '09:00-10:00' }]);
  };

  const removeBusySlot = (id: string) => {
    setBusySlots(prev => prev.filter(b => b.id !== id));
  };

  const updateBusySlot = (id: string, field: keyof BusySlot, value: string) => {
    setBusySlots(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // ── CSV helpers ───────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const text = await file.text();
    setCsvPreview(text.split('\n').slice(0, 6).join('\n'));
  };

  // ── Phase 1: Normalize ────────────────────────────────────────────────────

  const handleNormalize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let unified: UnifiedPreviewData;

      if (mode === 'csv' && csvFile) {
        const result = await aiApi.normalizeInput('csv', '', csvFile);
        unified = result.data?.data || result.data;
      } else {
        // Convert manual tasks to CSV string for normalization
        const csvString = [
          'title,duration,priority,deadline',
          ...tasks.filter(t => t.title).map(t => `${t.title},${t.duration},${t.priority},${t.deadline}`)
        ].join('\n');
        const result = await aiApi.normalizeInput('csv', csvString);
        unified = result.data?.data || result.data;
      }

      if (busySlots.some((slot) => slot.day < minAllowedDate)) {
        setError('Busy Time chỉ được phép chọn từ hiện tại trở đi.');
        setIsLoading(false);
        return;
      }

      // Inject busyTime from manual input
      if (busySlots.length > 0) {
        const busyByDay: Record<string, string[]> = {};
        for (const b of busySlots) {
          if (!busyByDay[b.day]) busyByDay[b.day] = [];
          busyByDay[b.day].push(b.slots);
        }
        unified.constraints.busyTime = Object.entries(busyByDay).map(([day, slots]) => ({ day, slots }));
      }

      setUnifiedData(unified);
      setStep('preview');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Phân tích dữ liệu thất bại. Vui lòng kiểm tra lại dữ liệu của bạn.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phase 2: Generate Schedule ────────────────────────────────────────────

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        goalTitle: goalTitle.trim() || 'Lịch trình chung',
        tasks: unifiedData?.tasks ?? [],
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        constraints: unifiedData?.constraints ?? { availableTime: [], busyTime: [] },
      };

      if (!payload.tasks.length) {
        setError('Không tìm thấy nhiệm vụ nào. Vui lòng kiểm tra lại đầu vào của bạn.');
        setIsLoading(false);
        return;
      }

      await aiApi.generateFromUnified(payload);
      
      // Invalidate all related queries to ensure UI updates without reload
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] }),
      ]);
      
      setStep('done');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Tạo lịch trình thất bại. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setError(null);
    setUnifiedData(null);
    setCsvFile(null);
    setCsvPreview('');
    setGoalTitle('');
    setTasks([{ id: '1', title: '', duration: 60, priority: 3, deadline: defaultToDate.split('T')[0] }]);
    setBusySlots([]);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tạo lịch thông minh</h2>
              <p className="text-xs text-gray-500">
                {step === 'input' ? 'Bước 1: Nhập môn học & ràng buộc' :
                  step === 'preview' ? 'Bước 2: Xác nhận thông tin' :
                    'Lịch đã được tạo!'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {['Nhập liệu', 'Xem trước', 'Xong'].map((label, i) => {
            const current = step === 'input' ? 0 : step === 'preview' ? 1 : 2;
            const active = i <= current;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                {i < 2 && <ChevronRight className="h-3 w-3 text-gray-300" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Input ── */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* Mode Toggle */}
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileText className="h-4 w-4" /> Nhập thủ công
                </button>
                <button
                  type="button"
                  onClick={() => setMode('csv')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${mode === 'csv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UploadCloud className="h-4 w-4" /> Tải lên CSV
                </button>
              </div>

              {/* Goal Selection & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-blue-500" />
                    Chọn từ Mục tiêu
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => handleGoalSelect(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">-- Chọn mục tiêu đã tạo --</option>
                    {(goalData?.data || []).map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tên lịch học dự kiến</label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={e => setGoalTitle(e.target.value)}
                    placeholder="VD: Lịch học Toán cao cấp"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manual Mode */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Danh sách môn học</h3>
                    <button type="button" onClick={addTask} className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Thêm môn học
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task, idx) => (
                      <div key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{idx + 1}</span>
                          <input
                            type="text"
                            value={task.title}
                            onChange={e => updateTask(task.id, 'title', e.target.value)}
                            placeholder="Tên môn học (VD: Toán, Tiếng Anh)"
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          {tasks.length > 1 && (
                            <button type="button" onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Thời lượng (phút/ngày)</label>
                            <input type="number" min={15} max={480} value={task.duration} onChange={e => updateTask(task.id, 'duration', Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Ưu tiên (1-5)</label>
                            <input type="number" min={1} max={5} value={task.priority} onChange={e => updateTask(task.id, 'priority', Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Deadline (ngày thi)</label>
                            <input type="date" min={minAllowedDate} value={task.deadline} onChange={e => updateTask(task.id, 'deadline', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Busy Time */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Thời gian bận <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span></h3>
                      <button type="button" onClick={addBusySlot} className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Thêm khoảng bận
                      </button>
                    </div>
                    {busySlots.map(b => (
                      <div key={b.id} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 p-2">
                        <Clock className="h-4 w-4 flex-shrink-0 text-orange-400" />
                        <input type="date" min={minAllowedDate} value={b.day} onChange={e => updateBusySlot(b.id, 'day', e.target.value)}
                          className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-sm focus:outline-none" />
                        <input type="text" value={b.slots} onChange={e => updateBusySlot(b.id, 'slots', e.target.value)}
                          placeholder="09:00-10:00" className="flex-1 rounded-lg border border-orange-200 bg-white px-2 py-1 text-sm focus:outline-none" />
                        <button type="button" onClick={() => removeBusySlot(b.id)} className="text-orange-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {busySlots.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Chưa có khoảng bận — thuật toán sẽ dùng giờ rảnh mặc định (07:00–22:00)</p>
                    )}
                  </div>
                </div>
              )}

              {/* CSV Mode */}
              {mode === 'csv' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">📋 Required CSV format:</p>
                    <pre className="text-xs text-blue-600 font-mono bg-white rounded-lg p-2 border border-blue-100">
{`title,duration,priority,deadline
Học Toán,120,3,2026-04-30
Làm bài tập,60,2,2026-04-28
Ôn lại bài,45,4,2026-05-01`}
                    </pre>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${csvFile ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'}`}
                  >
                    {csvFile ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <p className="text-sm font-semibold text-green-700">{csvFile.name}</p>
                        <p className="text-xs text-green-500">Nhấp để thay đổi tệp</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-gray-300" />
                        <p className="text-sm text-gray-500">Nhấp để tải lên CSV</p>
                        <p className="text-xs text-gray-400">chỉ tệp .csv</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  </div>

                  {csvPreview && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-500">Xem trước (6 dòng đầu):</p>
                      <pre className="rounded-lg bg-gray-900 p-3 text-xs text-green-400 overflow-x-auto font-mono">{csvPreview}</pre>
                    </div>
                  )}

                  {/* Busy Time for CSV mode */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Thời gian bận <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span></h3>
                      <button type="button" onClick={addBusySlot} className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Thêm
                      </button>
                    </div>
                    {busySlots.map(b => (
                      <div key={b.id} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 p-2">
                        <input type="date" min={minAllowedDate} value={b.day} onChange={e => updateBusySlot(b.id, 'day', e.target.value)}
                          className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-sm focus:outline-none" />
                        <input type="text" value={b.slots} placeholder="09:00-10:00" onChange={e => updateBusySlot(b.id, 'slots', e.target.value)}
                          className="flex-1 rounded-lg border border-orange-200 bg-white px-2 py-1 text-sm focus:outline-none" />
                        <button type="button" onClick={() => removeBusySlot(b.id)} className="text-orange-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview Unified JSON ── */}
          {step === 'preview' && unifiedData && (
            <div className="space-y-4">
              {/* Tasks */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  ✅ {unifiedData.tasks?.length || 0} môn học đã chuẩn hoá
                </h3>
                <div className="space-y-2">
                  {unifiedData.tasks?.map((t: UnifiedTaskPreview, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.duration}phút/ngày · Ưu tiên {t.priority}{t.deadline ? ` · Hạn ${t.deadline}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Time */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">📅 Thời gian rảnh ({unifiedData.constraints?.availableTime?.length || 0} ngày)</h3>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-1">
                  {unifiedData.constraints?.availableTime?.map((a: UnifiedConstraintEntry, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      <span className="font-medium text-gray-700">{a.day}:</span>
                      <span className="text-gray-500">{a.slots?.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Busy Time */}
              {unifiedData.constraints?.busyTime?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">🚫 Thời gian bận ({unifiedData.constraints.busyTime.length} khoảng)</h3>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 p-2 space-y-1">
                    {unifiedData.constraints.busyTime.map((b: UnifiedConstraintEntry, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-orange-400" />
                        <span className="font-medium text-gray-700">{b.day}:</span>
                        <span className="text-orange-600">{b.slots?.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  <strong>Sẵn sàng tạo lịch!</strong> Thuật toán sẽ xếp lịch theo thứ tự: buổi sáng (07:00–11:00), buổi chiều (13:00–17:00), buổi tối (18:00–22:00) và ưu tiên theo deadline → mức độ quan trọng.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lịch học đã được tạo! 🎉</h3>
                <p className="mt-1 text-sm text-gray-500">Lịch học của bạn đã sẵn sàng. Hãy vào “Lịch học của tôi” để xem các khối học.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={step === 'input' ? handleClose : () => setStep('input')}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {step === 'input' ? 'Hủy' : '← Quay lại'}
          </button>

          {step === 'input' && (
            <button
              type="button"
              onClick={handleNormalize}
              disabled={isLoading || (mode === 'manual' && tasks.every(t => !t.title)) || (mode === 'csv' && !csvFile)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích...</> : <>Phân tích & Xem trước <ChevronRight className="h-4 w-4" /></>}
            </button>
          )}

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xếp lịch...</> : <>Tạo lịch học ✨</>}
            </button>
          )}

          {step === 'done' && (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-all"
            >
              Xem lịch học của tôi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
