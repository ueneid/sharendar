/**
 * MemberList Component Tests
 * Testing list display, member management, and interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemberList } from '@/app/settings/components/MemberList';
import type { FamilyMember } from '@/domain/family/types';

// Mock family members data
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
  {
    id: 'member-3' as any,
    name: '次郎' as any,
    color: '#10b981' as any,
  },
];

// Mock functions
const mockDeleteMember = vi.fn();
const mockOpenCreate = vi.fn();
const mockOpenEdit = vi.fn();

let mockMembers_state = [...mockMembers];

vi.mock('@/lib/store', () => ({
  useFamilyMembers: () => mockMembers_state,
  useFamilyMemberStore: () => ({
    deleteMember: mockDeleteMember,
  }),
  useFamilyMemberForm: () => ({
    openCreate: mockOpenCreate,
    openEdit: mockOpenEdit,
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

describe('MemberList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMembers_state = [...mockMembers];
    mockConfirm.mockReturnValue(true);
  });

  describe('Rendering with Members', () => {
    it('should render header with member count', () => {
      render(<MemberList />);
      
      expect(screen.getByText('家族メンバー')).toBeInTheDocument();
      expect(screen.getByText('(3人)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });

    it('should render all family members', () => {
      render(<MemberList />);
      
      expect(screen.getByText('太郎')).toBeInTheDocument();
      expect(screen.getByText('花子')).toBeInTheDocument();
      expect(screen.getByText('次郎')).toBeInTheDocument();
    });

    it('should display member avatars and colors correctly', () => {
      render(<MemberList />);
      
      // Check avatars
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
      // 次郎 should show first character since no avatar
      expect(screen.getByText('次')).toBeInTheDocument();
      
      // Check color displays
      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
      expect(screen.getByText('#ef4444')).toBeInTheDocument();
      expect(screen.getByText('#10b981')).toBeInTheDocument();
    });

    it('should render action buttons for each member', () => {
      render(<MemberList />);
      
      expect(screen.getByLabelText('太郎を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('太郎を削除')).toBeInTheDocument();
      expect(screen.getByLabelText('花子を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('花子を削除')).toBeInTheDocument();
      expect(screen.getByLabelText('次郎を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('次郎を削除')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockMembers_state = [];
    });

    it('should show empty state when no members', () => {
      render(<MemberList />);
      
      expect(screen.getByText('まだメンバーがいません')).toBeInTheDocument();
      expect(screen.getByText('家族メンバーを追加して予定やタスクを共有しましょう')).toBeInTheDocument();
      expect(screen.getByText('(0人)')).toBeInTheDocument();
    });

    it('should show add first member button in empty state', () => {
      render(<MemberList />);
      
      expect(screen.getByRole('button', { name: '最初のメンバーを追加' })).toBeInTheDocument();
    });

    it('should call openCreate when clicking add first member button', async () => {
      const user = userEvent.setup();
      render(<MemberList />);
      
      const addButton = screen.getByRole('button', { name: '最初のメンバーを追加' });
      await user.click(addButton);
      
      expect(mockOpenCreate).toHaveBeenCalled();
    });
  });

  describe('Member Actions', () => {
    it('should call openCreate when clicking add button', async () => {
      const user = userEvent.setup();
      render(<MemberList />);
      
      const addButton = screen.getByRole('button', { name: '追加' });
      await user.click(addButton);
      
      expect(mockOpenCreate).toHaveBeenCalled();
    });

    it('should call openEdit when clicking edit button', async () => {
      const user = userEvent.setup();
      render(<MemberList />);
      
      const editButton = screen.getByLabelText('太郎を編集');
      await user.click(editButton);
      
      expect(mockOpenEdit).toHaveBeenCalledWith(mockMembers[0]);
    });

    it('should show confirmation dialog when clicking delete button', async () => {
      const user = userEvent.setup();
      render(<MemberList />);
      
      const deleteButton = screen.getByLabelText('太郎を削除');
      await user.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalledWith('太郎さんを削除しますか？');
    });

    it('should call deleteMember when confirming deletion', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      render(<MemberList />);
      
      const deleteButton = screen.getByLabelText('太郎を削除');
      await user.click(deleteButton);
      
      expect(mockDeleteMember).toHaveBeenCalledWith('member-1');
    });

    it('should not call deleteMember when canceling deletion', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      render(<MemberList />);
      
      const deleteButton = screen.getByLabelText('太郎を削除');
      await user.click(deleteButton);
      
      expect(mockDeleteMember).not.toHaveBeenCalled();
    });
  });

  describe('Information Section', () => {
    it('should display information about family members', () => {
      render(<MemberList />);
      
      expect(screen.getByText('家族メンバーについて')).toBeInTheDocument();
      expect(screen.getByText('• 家族メンバーを追加すると、予定やタスクを割り当てできます')).toBeInTheDocument();
      expect(screen.getByText('• 色分けで誰の予定やタスクかが一目で分かります')).toBeInTheDocument();
      expect(screen.getByText('• アバターを設定して個性を表現できます')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(<MemberList />);
      
      const editButtons = screen.getAllByRole('button', { name: /を編集$/ });
      const deleteButtons = screen.getAllByRole('button', { name: /を削除$/ });
      
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
      
      editButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
      
      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MemberList />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: '追加' })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('太郎を編集')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('太郎を削除')).toHaveFocus();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct styling based on member colors', () => {
      render(<MemberList />);
      
      // Check that color values are displayed in the UI
      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
      expect(screen.getByText('#ef4444')).toBeInTheDocument();
      expect(screen.getByText('#10b981')).toBeInTheDocument();
    });

    it('should display fallback avatar for members without avatar', () => {
      render(<MemberList />);
      
      // 次郎 should show first character of name
      expect(screen.getByText('次')).toBeInTheDocument();
    });
  });
});