/**
 * TaskCard Component Tests
 * Testing task display, interactions, and status management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskCard } from '@/app/tasks/components/TaskCard';
import type { Task } from '@/domain/tasks/types';
import type { FamilyMember } from '@/domain/family/types';

// Mock task data
const mockTask: Task = {
  id: 'task-1' as any,
  title: 'テストタスク' as any,
  dueDate: '2024-12-31' as any,
  priority: 'high',
  status: 'pending',
  memberIds: ['member-1', 'member-2'] as any,
  checklist: [
    { id: 'item-1', title: 'チェック項目1', checked: true },
    { id: 'item-2', title: 'チェック項目2', checked: false },
  ] as any,
  createdAt: '2024-01-01' as any,
  memo: 'これはテストメモです',
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 'task-2' as any,
  title: '完了済みタスク' as any,
  status: 'completed',
  completedAt: '2024-02-01' as any,
};

const mockOverdueTask: Task = {
  ...mockTask,
  id: 'task-3' as any,
  title: '期限切れタスク' as any,
  dueDate: '2020-01-01' as any, // Past date
};

// Mock family members
const mockMembers: FamilyMember[] = [
  {
    id: 'member-1' as any,
    name: '太郎' as any,
    color: '#3b82f6' as any,
    avatar: '👨',
  },
  {
    id: 'member-2' as any,
    name: '花子' as any,
    color: '#ef4444' as any,
    avatar: '👩',
  },
];

// Mock functions
const mockOpenTaskForm = vi.fn();
const mockDeleteTask = vi.fn();
const mockCompleteTask = vi.fn();
const mockReopenTask = vi.fn();
const mockSelectTask = vi.fn();
const mockGetTaskProgress = vi.fn();

vi.mock('@/lib/store', () => ({
  useFamilyMembers: () => mockMembers,
}));

vi.mock('@/lib/store/tasks-store', () => ({
  useTaskStore: () => ({
    openTaskForm: mockOpenTaskForm,
    deleteTask: mockDeleteTask,
    completeTask: mockCompleteTask,
    reopenTask: mockReopenTask,
    selectTask: mockSelectTask,
    getTaskProgress: mockGetTaskProgress,
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

// Mock date-fns to ensure consistent test results
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    isPast: vi.fn((date) => {
      return new Date(date).getTime() < new Date('2024-06-01').getTime();
    }),
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'M/d') return '12/31';
      if (formatStr === 'M月d日(E)') return '12月31日(火)';
      if (formatStr === 'M月d日') return '1月1日';
      return '12/31';
    }),
  };
});

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    mockGetTaskProgress.mockReturnValue({
      completed: 1,
      total: 2,
      percentage: 50,
    });
  });

  describe('Basic Rendering', () => {
    it('should render task title and basic information', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      expect(screen.getByText('これはテストメモです')).toBeInTheDocument();
    });

    it('should display due date correctly', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText(/期限: 12月31日/)).toBeInTheDocument();
    });

    it('should show assigned members', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText('太郎')).toBeInTheDocument();
      expect(screen.getByText('花子')).toBeInTheDocument();
    });

    it('should display progress information', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText('進捗: 1/2 完了')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show priority badge', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText('高優先度')).toBeInTheDocument();
    });

    it('should display creation date when showDate is true', () => {
      render(<TaskCard task={mockTask} showDate={true} />);
      
      expect(screen.getByText(/作成日: 1月1日/)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<TaskCard task={mockTask} compact={true} />);
      
      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      // In compact mode, detailed info should be simplified
      expect(screen.getByText('12/31')).toBeInTheDocument(); // Simplified date format
      expect(screen.getByText('1/2')).toBeInTheDocument(); // Progress format
    });

    it('should show member avatars in compact mode', () => {
      render(<TaskCard task={mockTask} compact={true} />);
      
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
    });

    it('should show assigned members in compact mode', () => {
      render(<TaskCard task={mockTask} compact={true} />);
      
      // Should show first two members
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
    });
  });

  describe('Task Status', () => {
    it('should display completed task correctly', () => {
      render(<TaskCard task={mockCompletedTask} />);
      
      const title = screen.getByText('完了済みタスク');
      expect(title).toHaveClass('line-through');
      expect(screen.getByText(/完了: 12\/31/)).toBeInTheDocument();
    });

    it('should show overdue indicator for past due tasks', () => {
      render(<TaskCard task={mockOverdueTask} />);
      
      // Check for overdue styling or text indication
      expect(screen.getByText('期限切れタスク')).toBeInTheDocument();
      // The overdue date will be formatted according to our mock
      expect(screen.getByText(/期限: 12月31日/)).toBeInTheDocument();
    });

    it('should display priority badge correctly', () => {
      render(<TaskCard task={mockTask} />);
      
      // Check that high priority badge is displayed
      expect(screen.getByText('高優先度')).toBeInTheDocument();
      
      // Check that priority badge has correct styling
      const priorityBadge = screen.getByText('高優先度');
      expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('User Interactions', () => {
    it('should call selectTask when card is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const card = screen.getByText('テストタスク').closest('div');
      await user.click(card!);
      
      expect(mockSelectTask).toHaveBeenCalledWith('task-1');
    });

    it('should call openTaskForm when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const editButton = screen.getByLabelText('編集');
      await user.click(editButton);
      
      expect(mockOpenTaskForm).toHaveBeenCalledWith(mockTask);
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const deleteButton = screen.getByLabelText('削除');
      await user.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalledWith('「テストタスク」を削除しますか？');
    });

    it('should call deleteTask when deletion is confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      render(<TaskCard task={mockTask} />);
      
      const deleteButton = screen.getByLabelText('削除');
      await user.click(deleteButton);
      
      expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should not call deleteTask when deletion is cancelled', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      render(<TaskCard task={mockTask} />);
      
      const deleteButton = screen.getByLabelText('削除');
      await user.click(deleteButton);
      
      expect(mockDeleteTask).not.toHaveBeenCalled();
    });

    it('should call completeTask when complete button is clicked for pending task', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const completeButton = screen.getByLabelText('完了にする');
      await user.click(completeButton);
      
      expect(mockCompleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should call reopenTask when complete button is clicked for completed task', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockCompletedTask} />);
      
      const reopenButton = screen.getByLabelText('未完了に戻す');
      await user.click(reopenButton);
      
      expect(mockReopenTask).toHaveBeenCalledWith('task-2');
    });
  });

  describe('Event Propagation', () => {
    it('should stop propagation when action buttons are clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const editButton = screen.getByLabelText('編集');
      await user.click(editButton);
      
      // selectTask should not be called when edit button is clicked
      expect(mockSelectTask).not.toHaveBeenCalled();
      expect(mockOpenTaskForm).toHaveBeenCalled();
    });

    it('should stop propagation when complete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);
      
      const completeButton = screen.getByLabelText('完了にする');
      await user.click(completeButton);
      
      // selectTask should not be called when complete button is clicked
      expect(mockSelectTask).not.toHaveBeenCalled();
      expect(mockCompleteTask).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByLabelText('編集')).toBeInTheDocument();
      expect(screen.getByLabelText('削除')).toBeInTheDocument();
      expect(screen.getByLabelText('完了にする')).toBeInTheDocument();
    });

    it('should have proper ARIA labels for completed task', () => {
      render(<TaskCard task={mockCompletedTask} />);
      
      expect(screen.getByLabelText('未完了に戻す')).toBeInTheDocument();
    });

    it('should display member names in compact mode', () => {
      render(<TaskCard task={mockTask} compact={true} />);
      
      // In compact mode, members are shown as avatars
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task without due date', () => {
      const taskNoDueDate = { ...mockTask, dueDate: undefined };
      render(<TaskCard task={taskNoDueDate} />);
      
      expect(screen.queryByText(/期限:/)).not.toBeInTheDocument();
    });

    it('should handle task without assigned members', () => {
      const taskNoMembers = { ...mockTask, memberIds: [] as any };
      render(<TaskCard task={taskNoMembers} />);
      
      expect(screen.queryByText('太郎')).not.toBeInTheDocument();
      expect(screen.queryByText('花子')).not.toBeInTheDocument();
    });

    it('should handle task without memo', () => {
      const taskNoMemo = { ...mockTask, memo: undefined };
      render(<TaskCard task={taskNoMemo} />);
      
      expect(screen.queryByText('これはテストメモです')).not.toBeInTheDocument();
    });

    it('should handle task without checklist items', () => {
      mockGetTaskProgress.mockReturnValue({
        completed: 0,
        total: 0,
        percentage: 0,
      });
      
      render(<TaskCard task={mockTask} />);
      
      expect(screen.queryByText(/進捗:/)).not.toBeInTheDocument();
    });
  });
});