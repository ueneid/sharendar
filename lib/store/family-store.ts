/**
 * 家族メンバー管理ストア
 * Application層のFamilyMemberUseCaseと統合
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FamilyMember } from '@/domain/family/types';
import type { Priority } from '@/domain/tasks/types';
import { getFamilyMemberUseCase } from './container';
import { createAsyncActions, createInitialAsyncState, normalizeError } from './helpers';
import type { AsyncState, BaseStore } from './types';

// ストア状態の型定義
interface FamilyMemberState extends AsyncState, BaseStore {
  // データ
  members: readonly FamilyMember[];
  selectedMemberId: string | null;
  
  // UI状態
  isFormOpen: boolean;
  editingMember: FamilyMember | null;
  
  // アクション
  loadMembers: () => Promise<void>;
  createMember: (name: string, options?: { color?: string; avatar?: string }) => Promise<void>;
  updateMember: (id: string, updates: { name?: string; color?: string; avatar?: string }) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  // UI操作
  selectMember: (id: string | null) => void;
  openCreateForm: () => void;
  openEditForm: (member: FamilyMember) => void;
  closeForm: () => void;
  
  // ユーティリティ
  getMemberById: (id: string) => FamilyMember | undefined;
  getMembersByIds: (ids: string[]) => FamilyMember[];
  getMemberColor: (id: string) => string;
  
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
export const useFamilyMemberStore = create<FamilyMemberState>()(
  devtools(
    (set, get) => {
      const asyncActions = createAsyncActions(set, get);
      
      return {
        // 初期状態
        ...createInitialAsyncState(),
        members: [],
        selectedMemberId: null,
        isFormOpen: false,
        editingMember: null,
        
        // データ操作
        loadMembers: async () => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getFamilyMemberUseCase();
              const result = await useCase.getAllMembers();
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (members) => {
              set({ members });
            }
          );
        },
        
        createMember: async (name: string, options = {}) => {
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getFamilyMemberUseCase();
              const result = await useCase.createMember(name, options);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (newMember) => {
              set(state => ({
                members: [...state.members, newMember],
                isFormOpen: false,
                editingMember: null,
              }));
            }
          );
        },
        
        updateMember: async (id: string, updates) => {
          const originalMembers = get().members;
          
          // 楽観的更新
          const currentMembers = get().members;
          set({
            members: currentMembers.map(member =>
              member.id === id ? { ...member, ...updates } as FamilyMember : member
            ),
          });
          
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getFamilyMemberUseCase();
              const result = await useCase.updateMember(id, updates);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
              
              return result.value;
            },
            (updatedMember) => {
              set(state => ({
                members: state.members.map(member =>
                  member.id === id ? updatedMember : member
                ),
                isFormOpen: false,
                editingMember: null,
              }));
            },
            () => {
              // エラー時は元に戻す
              set({ members: originalMembers });
            }
          );
        },
        
        deleteMember: async (id: string) => {
          const originalMembers = get().members;
          
          // 楽観的更新
          const currentState = get();
          set({
            members: currentState.members.filter(member => member.id !== id),
            selectedMemberId: currentState.selectedMemberId === id ? null : currentState.selectedMemberId,
          });
          
          await asyncActions.handleAsyncOperation(
            async () => {
              const useCase = getFamilyMemberUseCase();
              const result = await useCase.deleteMember(id);
              
              if (result.isErr()) {
                throw new Error(result.error.message);
              }
            },
            () => {
              // 成功時は追加の処理なし（既に楽観的更新済み）
            },
            () => {
              // エラー時は元に戻す
              set({ members: originalMembers });
            }
          );
        },
        
        // UI操作
        selectMember: (id: string | null) => {
          set({ selectedMemberId: id });
        },
        
        openCreateForm: () => {
          set({
            isFormOpen: true,
            editingMember: null,
          });
        },
        
        openEditForm: (member: FamilyMember) => {
          set({
            isFormOpen: true,
            editingMember: member,
          });
        },
        
        closeForm: () => {
          set({
            isFormOpen: false,
            editingMember: null,
          });
        },
        
        // ユーティリティ
        getMemberById: (id: string) => {
          return get().members.find(member => member.id === id);
        },
        
        getMembersByIds: (ids: string[]) => {
          const { members } = get();
          return ids.map(id => members.find(member => member.id === id)).filter(Boolean) as FamilyMember[];
        },
        
        getMemberColor: (id: string) => {
          const member = get().getMemberById(id);
          return member?.color || '#6b7280'; // デフォルトカラー
        },
        
        // リセット
        reset: () => {
          set({
            ...createInitialAsyncState(),
            members: [],
            selectedMemberId: null,
            isFormOpen: false,
            editingMember: null,
          });
        },
        
        // 非同期アクション（明示的に展開）
        setLoading: asyncActions.setLoading,
        setError: asyncActions.setError,
        handleAsyncOperation: asyncActions.handleAsyncOperation,
      };
    },
    {
      name: 'family-member-store',
    }
  )
);

// セレクター（パフォーマンス最適化用）
export const useFamilyMembers = () => useFamilyMemberStore(state => state.members);
export const useSelectedMember = () => useFamilyMemberStore(state => 
  state.selectedMemberId ? state.getMemberById(state.selectedMemberId) : null
);
export const useFamilyMemberForm = () => useFamilyMemberStore(state => ({
  isOpen: state.isFormOpen,
  editingMember: state.editingMember,
  openCreate: state.openCreateForm,
  openEdit: state.openEditForm,
  close: state.closeForm,
}));
export const useFamilyMemberAsync = () => useFamilyMemberStore(state => ({
  loading: state.loading,
  error: state.error,
  setError: state.setError,
}));