/**
 * カレンダーイベント管理ストア
 * Application層のCalendarEventUseCaseと統合
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CalendarEvent } from '@/domain/calendar/types';
import type { DateString, MemberId } from '@/domain/shared/branded-types';
import { asDateString } from '@/domain/shared/branded-types';
import { getCalendarEventUseCase } from './container';
import { createAsyncActions, createInitialAsyncState } from './helpers';
import type { AsyncState, BaseStore } from './types';

// ビューモード
export type CalendarView = 'month' | 'week' | 'day';

// フィルターオプション
export interface CalendarFilter {
  memberIds: string[];
  showCompleted: boolean;
}

// ストア状態の型定義
interface CalendarState extends AsyncState, BaseStore {
  // データ
  events: readonly CalendarEvent[];
  selectedDate: DateString | null;
  
  // UI状態
  currentView: CalendarView;
  filter: CalendarFilter;
  isEventFormOpen: boolean;
  editingEvent: CalendarEvent | null;
  selectedEventId: string | null;
  
  // アクション - データ操作
  loadEvents: () => Promise<void>;
  loadEventsByMonth: (yearMonth: string) => Promise<void>;
  loadEventsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  createEvent: (
    title: string,
    date: string,
    options?: {
      time?: string;
      memberIds?: string[];
      type?: 'event' | 'task';
      memo?: string;
    }
  ) => Promise<void>;
  updateEvent: (
    id: string,
    updates: {
      title?: string;
      date?: string;
      time?: string | null;
      memberIds?: string[];
      type?: 'event' | 'task';
      memo?: string;
    }
  ) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  // UI操作
  setSelectedDate: (date: DateString | null) => void;
  setCurrentView: (view: CalendarView) => void;
  setFilter: (filter: Partial<CalendarFilter>) => void;
  openEventForm: (event?: CalendarEvent) => void;
  closeEventForm: () => void;
  selectEvent: (id: string | null) => void;
  
  // ユーティリティ
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsByDate: (date: DateString) => CalendarEvent[];
  getEventsByMember: (memberId: MemberId) => CalendarEvent[];
  getFilteredEvents: () => CalendarEvent[];
  
  // 非同期操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleAsyncOperation: <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
}

// ストア実装
export const useCalendarStore = create<CalendarState>()(
  devtools(
    (set, get) => {
      const asyncActions = createAsyncActions(set, get);
      
      return {
        // 初期状態
        ...createInitialAsyncState(),
        events: [],
        selectedDate: null,
        currentView: 'month',
        filter: {
          memberIds: [],
          showCompleted: true,
        },
        isEventFormOpen: false,
        editingEvent: null,
        selectedEventId: null,
        
        // データ操作
        loadEvents: async () => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.getAllEvents();
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (events) => {
              set({ events });
            }
          );
        },
        
        loadEventsByMonth: async (yearMonth: string) => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.getEventsByMonth(yearMonth);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (events) => {
              set({ events });
            }
          );
        },
        
        loadEventsByDateRange: async (startDate: string, endDate: string) => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.getEventsByDateRange(startDate, endDate);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (events) => {
              set({ events });
            }
          );
        },
        
        createEvent: async (title, date, options = {}) => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.createEvent(title, date, options);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (newEvent) => {
              set(state => ({
                events: [...state.events, newEvent],
                isEventFormOpen: false,
                editingEvent: null,
              }));
            }
          );
        },
        
        updateEvent: async (id, updates) => {
          const originalEvents = get().events;
          
          // 楽観的更新
          const currentEvents = get().events;
          set({
            events: currentEvents.map(event =>
              event.id === id ? { ...event, ...updates } as CalendarEvent : event
            ),
          });
          
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.updateEvent(id, updates);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (updatedEvent) => {
              set(state => ({
                events: state.events.map(event =>
                  event.id === id ? updatedEvent : event
                ),
                isEventFormOpen: false,
                editingEvent: null,
              }));
            },
            () => {
              // エラー時は元に戻す
              set({ events: originalEvents });
            }
          );
        },
        
        deleteEvent: async (id: string) => {
          const originalEvents = get().events;
          
          // 楽観的更新
          set(state => ({
            events: state.events.filter(event => event.id !== id),
            selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
          }));
          
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getCalendarEventUseCase();
              const result = await useCase.deleteEvent(id);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
            },
            () => {
              // 成功時は追加の処理なし
            },
            () => {
              // エラー時は元に戻す
              set({ events: originalEvents });
            }
          );
        },
        
        // UI操作
        setSelectedDate: (date: DateString | null) => {
          set({ selectedDate: date });
        },
        
        setCurrentView: (view: CalendarView) => {
          set({ currentView: view });
        },
        
        setFilter: (filter: Partial<CalendarFilter>) => {
          set(state => ({
            filter: { ...state.filter, ...filter },
          }));
        },
        
        openEventForm: (event?: CalendarEvent) => {
          set({
            isEventFormOpen: true,
            editingEvent: event || null,
          });
        },
        
        closeEventForm: () => {
          set({
            isEventFormOpen: false,
            editingEvent: null,
          });
        },
        
        selectEvent: (id: string | null) => {
          set({ selectedEventId: id });
        },
        
        // ユーティリティ
        getEventById: (id: string) => {
          return get().events.find(event => event.id === id);
        },
        
        getEventsByDate: (date: DateString) => {
          return get().events.filter(event => event.date === date);
        },
        
        getEventsByMember: (memberId: MemberId) => {
          return get().events.filter(event => 
            event.memberIds.includes(memberId)
          );
        },
        
        getFilteredEvents: () => {
          const { events, filter } = get();
          
          return events.filter(event => {
            // メンバーフィルター
            if (filter.memberIds.length > 0) {
              const hasSelectedMember = event.memberIds.some(id => 
                filter.memberIds.includes(id)
              );
              if (!hasSelectedMember) return false;
            }
            
            // 完了済みタスクのフィルター
            if (!filter.showCompleted && event.type === 'task') {
              // タスクの完了状態をチェック（この実装では省略）
              // TODO: タスクストアと連携して完了状態を確認
            }
            
            return true;
          });
        },
        
        // リセット
        reset: () => {
          set({
            ...createInitialAsyncState(),
            events: [],
            selectedDate: null,
            currentView: 'month',
            filter: {
              memberIds: [],
              showCompleted: true,
            },
            isEventFormOpen: false,
            editingEvent: null,
            selectedEventId: null,
          });
        },
        
        // 非同期アクション
        setLoading: asyncActions.setLoading,
        setError: asyncActions.setError,
        handleAsyncOperation: asyncActions.handleAsyncOperation,
      };
    },
    {
      name: 'calendar-store',
    }
  )
);

// セレクター
export const useCalendarEvents = () => useCalendarStore(state => state.events);
export const useFilteredEvents = () => useCalendarStore(state => state.getFilteredEvents());
export const useSelectedDate = () => useCalendarStore(state => state.selectedDate);
export const useCalendarView = () => useCalendarStore(state => state.currentView);
export const useCalendarFilter = () => useCalendarStore(state => state.filter);
export const useEventForm = () => useCalendarStore(state => ({
  isOpen: state.isEventFormOpen,
  editingEvent: state.editingEvent,
  open: state.openEventForm,
  close: state.closeEventForm,
}));
export const useCalendarAsync = () => useCalendarStore(state => ({
  loading: state.loading,
  error: state.error,
  setError: state.setError,
}));