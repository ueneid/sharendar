'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Users, FileText, Loader2 } from 'lucide-react';
import { useCalendarStore, useEventForm, useCalendarAsync } from '@/lib/store/calendar-store';
import { useFamilyMembers } from '@/lib/store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const EventForm = () => {
  const { createEvent, updateEvent } = useCalendarStore();
  const { isOpen, editingEvent, close } = useEventForm();
  const { loading, error, setError } = useCalendarAsync();
  const familyMembers = useFamilyMembers();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [eventType, setEventType] = useState<'event' | 'task'>('event');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームの初期化
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // 編集モード
        setTitle(editingEvent.title);
        setDate(editingEvent.date);
        setTime(editingEvent.time || '');
        setSelectedMemberIds([...editingEvent.memberIds]);
        setEventType(editingEvent.type);
        setMemo(editingEvent.memo || '');
      } else {
        // 新規作成モード
        const today = new Date();
        setTitle('');
        setDate(format(today, 'yyyy-MM-dd'));
        setTime('');
        setSelectedMemberIds([]);
        setEventType('event');
        setMemo('');
      }
      setErrors({});
      setError(null);
    }
  }, [isOpen, editingEvent, setError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    } else if (title.trim().length > 50) {
      newErrors.title = 'タイトルは50文字以内で入力してください';
    }

    if (!date) {
      newErrors.date = '日付を選択してください';
    }

    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      newErrors.time = '時刻の形式が正しくありません（HH:MM）';
    }

    if (memo && memo.length > 200) {
      newErrors.memo = 'メモは200文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const eventData = {
      title: title.trim(),
      date,
      time: time || undefined,
      memberIds: selectedMemberIds,
      type: eventType,
      memo: memo.trim() || undefined,
    };

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await createEvent(eventData.title, eventData.date, {
          time: eventData.time,
          memberIds: eventData.memberIds,
          type: eventData.type,
          memo: eventData.memo,
        });
      }
    } catch (error) {
      console.error('Event save error:', error);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleClose = () => {
    close();
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editingEvent ? 'イベント編集' : 'イベント追加'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="イベントのタイトル"
              disabled={loading}
              maxLength={50}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* 日付・時間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                日付 *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline w-4 h-4 mr-1" />
                時刻
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.time ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.time && (
                <p className="text-red-600 text-sm mt-1">{errors.time}</p>
              )}
            </div>
          </div>

          {/* イベントタイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイプ
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="event"
                  checked={eventType === 'event'}
                  onChange={(e) => setEventType(e.target.value as 'event')}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm">イベント</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="task"
                  checked={eventType === 'task'}
                  onChange={(e) => setEventType(e.target.value as 'task')}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm">タスク</span>
              </label>
            </div>
          </div>

          {/* 担当者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              担当者
            </label>
            <div className="space-y-2">
              {familyMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="mr-3"
                    disabled={loading}
                  />
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar || member.name.charAt(0)}
                  </div>
                  <span className="text-sm">{member.name}</span>
                </label>
              ))}
              {familyMembers.length === 0 && (
                <p className="text-gray-500 text-sm">
                  まだ家族メンバーがいません
                </p>
              )}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline w-4 h-4 mr-1" />
              メモ
            </label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.memo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="メモ（任意）"
              rows={3}
              disabled={loading}
              maxLength={200}
            />
            {errors.memo && (
              <p className="text-red-600 text-sm mt-1">{errors.memo}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !date}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingEvent ? '更新' : '追加'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};