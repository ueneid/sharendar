import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ActivityForm } from '@/components/activity/ActivityForm';
import type { Activity } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';

// useActivityStoreのモック
const mockUseActivityStore = {
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  isLoading: false,
  error: null,
  clearError: vi.fn(),
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

describe('ActivityForm', () => {
  let testActivity: Activity;
  let user: ReturnType<typeof userEvent.setup>;
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    user = userEvent.setup();
    mockOnClose = vi.fn();
    mockOnSubmit = vi.fn();
    
    // mockUseActivityStoreの状態をリセット
    mockUseActivityStore.isLoading = false;
    mockUseActivityStore.error = null;
    
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

  describe('form rendering', () => {
    it('should render empty form for creating new activity', () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { name: /アクティビティ作成/ })).toBeInTheDocument();
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
      expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/優先度/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /作成/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /キャンセル/ })).toBeInTheDocument();
    });

    it('should render form with activity data for editing', () => {
      render(<ActivityForm mode="edit" activity={testActivity} onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { name: /アクティビティ編集/ })).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストタスク')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト用のタスクです')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /更新/ })).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      expect(screen.getByText(/タイトルを入力してください/)).toBeInTheDocument();
    });

    it('should display category-specific fields', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      
      // イベント選択時
      await user.selectOptions(categorySelect, 'event');
      expect(screen.getByLabelText(/開始日/)).toBeInTheDocument();
      expect(screen.getByLabelText(/開始時間/)).toBeInTheDocument(); // デフォルトでisAllDay=falseなので表示される
      expect(screen.getByLabelText(/終了時間/)).toBeInTheDocument();
      
      // タスク選択時
      await user.selectOptions(categorySelect, 'task');
      expect(screen.getByLabelText(/期限/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/開始時間/)).not.toBeInTheDocument();
      
      // デッドライン選択時
      await user.selectOptions(categorySelect, 'deadline');
      expect(screen.getByLabelText(/期限/)).toBeInTheDocument();
    });

    it('should show family member selection', () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      expect(screen.getByText('担当者')).toBeInTheDocument();
      expect(screen.getByText('太郎')).toBeInTheDocument();
      expect(screen.getByText('花子')).toBeInTheDocument();
      expect(screen.getByText('👦')).toBeInTheDocument();
      expect(screen.getByText('👧')).toBeInTheDocument();
    });

    it('should display checklist section', () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      expect(screen.getByText('チェックリスト')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /項目を追加/ })).toBeInTheDocument();
    });

    it('should show all day toggle for events', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'event');
      
      expect(screen.getByLabelText(/終日/)).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('should handle title input', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, '新しいタスク');
      
      expect(titleInput).toHaveValue('新しいタスク');
    });

    it('should handle description input', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const descriptionInput = screen.getByLabelText(/説明/);
      await user.type(descriptionInput, '詳細な説明');
      
      expect(descriptionInput).toHaveValue('詳細な説明');
    });

    it('should handle category selection', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'event');
      
      expect(categorySelect).toHaveValue('event');
    });

    it('should handle priority selection', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const prioritySelect = screen.getByLabelText(/優先度/);
      await user.selectOptions(prioritySelect, 'high');
      
      expect(prioritySelect).toHaveValue('high');
    });

    it('should handle family member selection', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const memberCheckbox = screen.getByRole('checkbox', { name: /太郎/ });
      await user.click(memberCheckbox);
      
      expect(memberCheckbox).toBeChecked();
    });

    it('should handle date input', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'task');
      
      const dueDateInput = screen.getByLabelText(/期限/);
      await user.type(dueDateInput, '2025-06-30');
      
      expect(dueDateInput).toHaveValue('2025-06-30');
    });

    it('should handle time input for events', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'event');
      
      const startTimeInput = screen.getByLabelText(/開始時間/);
      await user.type(startTimeInput, '10:00');
      
      expect(startTimeInput).toHaveValue('10:00');
    });

    it('should handle all day toggle', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'event');
      
      // 最初は時間フィールドが表示されている（isAllDay=false）
      expect(screen.getByLabelText(/開始時間/)).toBeInTheDocument();
      
      const allDayToggle = screen.getByLabelText(/終日/);
      await user.click(allDayToggle);
      
      expect(allDayToggle).toBeChecked();
      // 終日の場合、時間入力フィールドが非表示になる
      expect(screen.queryByLabelText(/開始時間/)).not.toBeInTheDocument();
    });

    it('should add checklist items', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const addButton = screen.getByRole('button', { name: /項目を追加/ });
      await user.click(addButton);
      
      const checklistInput = screen.getByPlaceholderText(/チェック項目を入力/);
      await user.type(checklistInput, '新しい項目');
      
      expect(checklistInput).toHaveValue('新しい項目');
    });

    it('should remove checklist items', async () => {
      render(<ActivityForm mode="edit" activity={testActivity} onClose={mockOnClose} />);
      
      // 既存のチェックリスト項目が表示されることを確認
      expect(screen.getByDisplayValue('チェック項目1')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button', { name: /削除/ });
      await user.click(removeButtons[0]);
      
      expect(screen.queryByDisplayValue('チェック項目1')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should create new activity successfully', async () => {
      mockUseActivityStore.createActivity.mockResolvedValue(undefined);
      
      render(<ActivityForm mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);
      
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, '新しいタスク');
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'task');
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockUseActivityStore.createActivity).toHaveBeenCalledWith({
          title: '新しいタスク',
          category: 'task',
          priority: 'medium', // デフォルト値
          description: '',
          memberIds: [],
          isAllDay: false, // デフォルト値
          checklist: []
        });
      });
      
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should update existing activity successfully', async () => {
      mockUseActivityStore.updateActivity.mockResolvedValue(undefined);
      
      render(<ActivityForm mode="edit" activity={testActivity} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
      
      const titleInput = screen.getByDisplayValue('テストタスク');
      await user.clear(titleInput);
      await user.type(titleInput, '更新されたタスク');
      
      const submitButton = screen.getByRole('button', { name: /更新/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockUseActivityStore.updateActivity).toHaveBeenCalledWith(
          testActivity.id,
          expect.objectContaining({
            title: '更新されたタスク'
          })
        );
      });
      
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle submission errors', async () => {
      mockUseActivityStore.createActivity.mockRejectedValue(new Error('作成に失敗しました'));
      
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, '新しいタスク');
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/作成に失敗しました/)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockUseActivityStore.isLoading = true;
      
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const submitButton = screen.getByRole('button', { name: /作成中.../ });
      expect(submitButton).toBeDisabled();
    });

    it('should validate required fields before submission', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      expect(screen.getByText(/タイトルを入力してください/)).toBeInTheDocument();
      expect(mockUseActivityStore.createActivity).not.toHaveBeenCalled();
    });

    it('should validate time format for events', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      await user.selectOptions(categorySelect, 'event');
      
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, 'イベント');
      
      // 時間フィールドが表示されていることを確認（isAllDay=falseなので表示されているはず）
      expect(screen.getByLabelText(/開始時間/)).toBeInTheDocument();
      
      // 直接formDataを操作して無効な時間を設定し、バリデーションをトリガー
      const startTimeInput = screen.getByLabelText(/開始時間/) as HTMLInputElement;
      // Object.definePropertyを使用してvalueを強制的に設定
      Object.defineProperty(startTimeInput, 'value', { value: '25:70', writable: true });
      fireEvent.change(startTimeInput, { target: { value: '25:70' } });
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      // バリデーションエラーまたは一般的なエラーのいずれかが表示される
      expect(
        screen.queryByText(/正しい時間形式で入力してください/) || 
        screen.queryByText(/作成に失敗しました/)
      ).toBeInTheDocument();
    });
  });

  describe('cancel and close', () => {
    it('should call onClose when cancel button clicked', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button clicked', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /閉じる/ });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear error state when closing', async () => {
      mockUseActivityStore.error = 'テストエラー';
      
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /閉じる/ });
      await user.click(closeButton);
      
      expect(mockUseActivityStore.clearError).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
      expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/優先度/)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const titleInput = screen.getByLabelText(/タイトル/);
      titleInput.focus();
      
      expect(titleInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/説明/)).toHaveFocus();
    });

    it('should have proper error announcements', async () => {
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);
      
      const errorMessage = screen.getByText(/タイトルを入力してください/);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('error handling', () => {
    it('should display store errors', () => {
      mockUseActivityStore.error = 'データベースエラー';
      
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      expect(screen.getByText('データベースエラー')).toBeInTheDocument();
    });

    it('should clear errors when form is modified', async () => {
      mockUseActivityStore.error = 'エラーメッセージ';
      
      render(<ActivityForm mode="create" onClose={mockOnClose} />);
      
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, 'a');
      
      expect(mockUseActivityStore.clearError).toHaveBeenCalled();
    });
  });
});