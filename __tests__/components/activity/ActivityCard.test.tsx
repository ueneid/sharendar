import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ActivityCard } from '@/components/activity/ActivityCard';
import type { Activity } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';

// useActivityStoreのモック
const mockUseActivityStore = {
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
  completeActivity: vi.fn(),
  reopenActivity: vi.fn(),
  selectActivity: vi.fn(),
  setEditingActivity: vi.fn(),
  setShowEditForm: vi.fn(),
  isLoading: false,
  error: null,
};

vi.mock('@/lib/store/activity-store', () => ({
  useActivityStore: () => mockUseActivityStore,
}));

// useFamilyMemberStoreのモック
const mockFamilyMembers = [
  {
    id: 'member-1',
    name: '太郎',
    color: '#0ea5e9',
    avatar: '👦'
  },
  {
    id: 'member-2', 
    name: '花子',
    color: '#06b6d4',
    avatar: '👧'
  }
];

vi.mock('@/lib/store', () => ({
  useFamilyMembers: () => mockFamilyMembers,
}));

describe('ActivityCard', () => {
  let testActivity: Activity;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // テスト用のActivityデータ
    testActivity = {
      id: asActivityId('test-activity-1'),
      title: asActivityTitle('テストタスク'),
      description: 'テスト用のタスクです',
      category: 'task',
      status: 'pending',
      priority: 'medium',
      memberIds: [asMemberId('member-1')],
      checklist: [
        { id: 'check-1', title: 'チェック項目1', checked: false },
        { id: 'check-2', title: 'チェック項目2', checked: true }
      ],
      isAllDay: true,
      startDate: asDateString('2025-06-15'),
      dueDate: asDateString('2025-06-20'),
      createdAt: asDateString('2025-06-11'),
      updatedAt: asDateString('2025-06-11'),
      tags: ['重要', '家事']
    };
  });

  describe('rendering', () => {
    it('should render activity title and description', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      expect(screen.getByText('テスト用のタスクです')).toBeInTheDocument();
    });

    it('should display activity category badge', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('タスク')).toBeInTheDocument();
    });

    it('should show correct priority styling', () => {
      // 期限切れにならないように未来の日付を設定
      const activityWithFutureDate = {
        ...testActivity,
        dueDate: asDateString('2026-12-31')
      };
      
      render(<ActivityCard activity={activityWithFutureDate} />);
      
      // medium priority should have yellow styling
      const card = screen.getByTestId('activity-card');
      expect(card).toHaveClass('border-l-yellow-400');
    });

    it('should display due date when present', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText(/6月20日/)).toBeInTheDocument();
    });

    it('should show assigned members', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('太郎')).toBeInTheDocument();
      expect(screen.getByText('👦')).toBeInTheDocument();
    });

    it('should display checklist progress', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('1/2 完了')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show completion status for completed activities', () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      render(<ActivityCard activity={completedActivity} />);
      
      expect(screen.getByText(/完了:/)).toBeInTheDocument();
      expect(screen.getByText(/6月12日/)).toBeInTheDocument();
    });

    it('should show overdue indicator for overdue tasks', () => {
      const overdueActivity = {
        ...testActivity,
        dueDate: asDateString('2025-06-01') // 過去の日付
      };
      
      render(<ActivityCard activity={overdueActivity} />);
      
      expect(screen.getByText('期限切れ')).toBeInTheDocument();
      expect(screen.getByTestId('activity-card')).toHaveClass('border-l-red-400');
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode', () => {
      render(<ActivityCard activity={testActivity} compact />);
      
      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      // compact modeでは説明文は表示されない
      expect(screen.queryByText('テスト用のタスクです')).not.toBeInTheDocument();
    });

    it('should show limited member avatars in compact mode', () => {
      const activityWithManyMembers = {
        ...testActivity,
        memberIds: [asMemberId('member-1'), asMemberId('member-2')]
      };
      
      render(<ActivityCard activity={activityWithManyMembers} compact />);
      
      // compact modeでは最大2人まで表示
      expect(screen.getByText('👦')).toBeInTheDocument();
      expect(screen.getByText('👧')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should handle card click to select activity', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const card = screen.getByTestId('activity-card');
      await user.click(card);
      
      expect(mockUseActivityStore.selectActivity).toHaveBeenCalledWith(testActivity.id);
    });

    it('should toggle completion status when status button clicked', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const statusButton = screen.getByRole('button', { name: /完了にする/ });
      await user.click(statusButton);
      
      expect(mockUseActivityStore.completeActivity).toHaveBeenCalledWith(testActivity.id);
    });

    it('should reopen completed activity when status button clicked', async () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const
      };
      
      render(<ActivityCard activity={completedActivity} />);
      
      const statusButton = screen.getByRole('button', { name: /未完了に戻す/ });
      await user.click(statusButton);
      
      expect(mockUseActivityStore.reopenActivity).toHaveBeenCalledWith(testActivity.id);
    });

    it('should prevent event propagation when status button clicked', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const statusButton = screen.getByRole('button', { name: /完了にする/ });
      await user.click(statusButton);
      
      // selectActivity should not be called when clicking status button
      expect(mockUseActivityStore.selectActivity).not.toHaveBeenCalled();
    });

    it('should show edit button and handle edit click', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const editButton = screen.getByRole('button', { name: /編集/ });
      await user.click(editButton);
      
      expect(mockUseActivityStore.setEditingActivity).toHaveBeenCalledWith(testActivity);
      expect(mockUseActivityStore.setShowEditForm).toHaveBeenCalledWith(true);
    });

    it('should show delete button and handle delete with confirmation', async () => {
      // window.confirmをモック
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<ActivityCard activity={testActivity} />);
      
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalledWith('「テストタスク」を削除しますか？');
      expect(mockUseActivityStore.deleteActivity).toHaveBeenCalledWith(testActivity.id);
      
      mockConfirm.mockRestore();
    });

    it('should not delete when confirmation is cancelled', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<ActivityCard activity={testActivity} />);
      
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockUseActivityStore.deleteActivity).not.toHaveBeenCalled();
      
      mockConfirm.mockRestore();
    });
  });

  describe('checklist interactions', () => {
    it('should display checklist items', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('チェック項目1')).toBeInTheDocument();
      expect(screen.getByText('チェック項目2')).toBeInTheDocument();
    });

    it('should show checked state for checklist items', () => {
      render(<ActivityCard activity={testActivity} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked(); // チェック項目1
      expect(checkboxes[1]).toBeChecked(); // チェック項目2
    });

    it('should handle checklist item toggle', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      
      expect(mockUseActivityStore.updateActivity).toHaveBeenCalledWith(
        testActivity.id,
        expect.objectContaining({
          checklist: expect.arrayContaining([
            expect.objectContaining({ id: 'check-1', checked: true })
          ])
        })
      );
    });
  });

  describe('category-specific rendering', () => {
    it('should render event activity correctly', () => {
      const eventActivity = {
        ...testActivity,
        category: 'event' as const,
        startTime: '10:00' as any,
        endTime: '12:00' as any
      };
      
      render(<ActivityCard activity={eventActivity} />);
      
      expect(screen.getByText('イベント')).toBeInTheDocument();
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
    });

    it('should render deadline activity correctly', () => {
      const deadlineActivity = {
        ...testActivity,
        category: 'deadline' as const,
        priority: 'high' as const
      };
      
      render(<ActivityCard activity={deadlineActivity} />);
      
      expect(screen.getByText('締切')).toBeInTheDocument();
      // high priority should have red styling
      const card = screen.getByTestId('activity-card');
      expect(card).toHaveClass('border-l-red-400');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByRole('button', { name: /完了にする/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /編集/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /削除/ })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<ActivityCard activity={testActivity} />);
      
      const statusButton = screen.getByRole('button', { name: /完了にする/ });
      statusButton.focus();
      
      expect(statusButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockUseActivityStore.completeActivity).toHaveBeenCalledWith(testActivity.id);
    });

    it('should have semantic HTML structure', () => {
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('should show loading state when activity is being updated', () => {
      mockUseActivityStore.isLoading = true;
      
      render(<ActivityCard activity={testActivity} />);
      
      const statusButton = screen.getByRole('button', { name: /完了にする/ });
      expect(statusButton).toBeDisabled();
    });

    it('should display error message when present', () => {
      (mockUseActivityStore as any).error = 'テストエラー';
      
      render(<ActivityCard activity={testActivity} />);
      
      expect(screen.getByText('テストエラー')).toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('should format dates in Japanese locale', () => {
      const activityWithDate = {
        ...testActivity,
        startDate: asDateString('2025-12-25'),
        dueDate: asDateString('2025-12-31')
      };
      
      render(<ActivityCard activity={activityWithDate} />);
      
      expect(screen.getByText(/12月31日/)).toBeInTheDocument();
    });

    it('should show relative time for recent activities', () => {
      const recentActivity = {
        ...testActivity,
        createdAt: asDateString(new Date().toISOString().split('T')[0])
      };
      
      render(<ActivityCard activity={recentActivity} showDate />);
      
      // 今日作成されたアクティビティの表示確認
      expect(screen.getByText(/作成日:/)).toBeInTheDocument();
    });
  });
});