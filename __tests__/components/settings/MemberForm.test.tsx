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
const mockSetError = vi.fn();

let mockFormState = {
  isOpen: true,
  editingMember: null,
  close: mockCloseMemberForm,
};

let mockAsyncState = {
  loading: false,
  error: null,
  setError: mockSetError,
};

vi.mock('@/lib/store', () => ({
  useFamilyMemberStore: () => ({
    createMember: mockCreateMember,
    updateMember: mockUpdateMember,
    closeMemberForm: mockCloseMemberForm,
  }),
  useFamilyMemberForm: () => mockFormState,
  useFamilyMemberAsync: () => mockAsyncState,
}));

describe('MemberForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    mockFormState.isOpen = true;
    mockFormState.editingMember = null;
    mockAsyncState.loading = false;
    mockAsyncState.error = null;
  });

  describe('Form Rendering', () => {
    it('should render the member form with all required fields', () => {
      render(<MemberForm />);
      
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
      expect(screen.getByText('カラー')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /追加/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument();
    });

    it('should show form title for creating new member', () => {
      render(<MemberForm />);
      
      expect(screen.getByText('メンバー追加')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when name is empty', async () => {
      render(<MemberForm />);
      
      // Submit button should be disabled when name is empty
      const submitButton = screen.getByRole('button', { name: /追加/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show validation error when name is too long', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, 'a'.repeat(21)); // 21 characters (over limit)
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('名前は20文字以内で入力してください')).toBeInTheDocument();
      });
    });

    it('should show validation error when submitting empty trimmed name', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      // Type some spaces to enable the button, then submit
      await user.type(nameInput, '   '); // only spaces
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('名前を入力してください')).toBeInTheDocument();
      });
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
      
      // Select red color
      const redColorButton = screen.getByLabelText('カラー #ef4444');
      await user.click(redColorButton);
      
      // Check if the color is visually selected (has different border)
      expect(redColorButton).toHaveClass('border-gray-400');
    });

    it('should have red as default selected color', () => {
      render(<MemberForm />);
      
      const redColorButton = screen.getByLabelText('カラー #ef4444');
      expect(redColorButton).toHaveClass('border-gray-400');
    });
  });

  describe('Form Submission', () => {
    it('should call createMember with correct data when form is valid', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, '太郎');
      
      // Select red color
      const redColorButton = screen.getByLabelText('カラー #ef4444');
      await user.click(redColorButton);
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalledWith('太郎', {
          color: '#ef4444',
          avatar: undefined,
        });
      });
    });

    it('should show loading state during submission', async () => {
      // Set loading state
      mockAsyncState.loading = true;

      render(<MemberForm />);
      
      const submitButton = screen.getByRole('button', { name: /追加/i });
      expect(submitButton).toBeDisabled();
    });

    it('should display error message when submission fails', () => {
      // Set error state
      mockAsyncState.error = 'メンバーの作成に失敗しました';

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

    it('should call close function when canceled', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      const nameInput = screen.getByLabelText(/名前/i);
      await user.type(nameInput, '太郎');
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);
      
      expect(mockCloseMemberForm).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      render(<MemberForm />);
      
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
      expect(screen.getByText('カラー')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MemberForm />);
      
      // Focus starts on the close button, then moves to name input
      const nameInput = screen.getByLabelText(/名前/i);
      await user.click(nameInput);
      expect(nameInput).toHaveFocus();
      
      // Tab to first color button
      await user.tab();
      expect(screen.getByLabelText('カラー #ef4444')).toHaveFocus();
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