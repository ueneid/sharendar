/**
 * MemberForm Component Tests
 * Testing form validation, user interactions, and store integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemberForm } from '@/app/settings/components/MemberForm';

// Mock the family store
const mockCreateMember = vi.fn();
const mockUpdateMember = vi.fn();
const mockCloseMemberForm = vi.fn();

vi.mock('@/lib/store', () => ({
  useFamilyMemberStore: () => ({
    createMember: mockCreateMember,
    updateMember: mockUpdateMember,
    closeMemberForm: mockCloseMemberForm,
  }),
  useFamilyMemberForm: () => ({
    isOpen: true,
    editingMember: null,
  }),
  useFamilyMemberAsync: () => ({
    loading: false,
    error: null,
    setError: vi.fn(),
  }),
}));

describe('MemberForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render the member form with all required fields', () => {
      render(<MemberForm />);
      
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/カラー/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /追加/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument();
    });

    it('should show form title for creating new member', () => {
      render(<MemberForm />);
      
      expect(screen.getByText('メンバー追加')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      expect(screen.getByText('名前を入力してください')).toBeInTheDocument();
    });

    it('should show error when name is too long', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, 'a'.repeat(21)); // 21 characters (over limit)
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      expect(screen.getByText('名前は20文字以内で入力してください')).toBeInTheDocument();
    });

    it('should trim whitespace from name input', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, '  太郎  ');
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalledWith('太郎', expect.any(Object));
      });
    });
  });

  describe('Color Selection', () => {
    it('should allow user to select a color', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      // Select blue color
      const blueColorOption = screen.getByLabelText('#3B82F6');
      await user.click(blueColorOption);
      
      expect(blueColorOption).toBeChecked();
    });

    it('should have blue as default selected color', () => {
      render(<MemberForm />);
      
      const blueColorOption = screen.getByLabelText('#3B82F6');
      expect(blueColorOption).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('should call createMember with correct data when form is valid', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, '太郎');
      
      // Select red color
      const redColorOption = screen.getByLabelText('#EF4444');
      await user.click(redColorOption);
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalledWith('太郎', {
          color: '#EF4444',
        });
      });
    });

    it('should show loading state during submission', async () => {
      // Mock loading state
      vi.mocked(require('@/lib/store').useFamilyMemberAsync).mockReturnValue({
        loading: true,
        error: null,
        setError: vi.fn(),
      });

      render(<MemberForm />);
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      expect(submitButton).toBeDisabled();
    });

    it('should display error message when submission fails', () => {
      // Mock error state
      vi.mocked(require('@/lib/store').useFamilyMemberAsync).mockReturnValue({
        loading: false,
        error: 'メンバーの作成に失敗しました',
        setError: vi.fn(),
      });

      render(<MemberForm />);
      
      expect(screen.getByText('メンバーの作成に失敗しました')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('should call closeMemberForm when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);
      
      expect(mockCloseMemberForm).toHaveBeenCalled();
    });

    it('should reset form when canceled', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, '太郎');
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);
      
      expect(nameInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      render(<MemberForm />);
      
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/カラー/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/名前/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('#3B82F6')).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<MemberForm />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});