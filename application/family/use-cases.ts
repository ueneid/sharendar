/**
 * 家族メンバー管理のユースケース
 * コマンドとクエリを組み合わせた高レベルな操作
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Result } from 'neverthrow';
import type { FamilyMember } from '@/domain/family/types';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import { TYPES } from '@/application/shared/types';

// コマンドとクエリの再エクスポート
export {
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  type CreateFamilyMemberCommand,
  type UpdateFamilyMemberCommand,
  type CommandError
} from './commands';

export {
  getAllFamilyMembers,
  getFamilyMemberById,
  getFamilyMemberCount,
  familyMemberExists,
  type QueryError
} from './queries';

// 統合エラー型
export type FamilyUseCaseError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

/**
 * 家族メンバー管理のファサード
 * InversifyJSで依存性注入を行う
 */
@injectable()
export class FamilyMemberUseCase {
  constructor(
    @inject(TYPES.IFamilyMemberRepository)
    private readonly repository: IFamilyMemberRepository
  ) {}

  /**
   * 新しい家族メンバーを作成
   */
  async createMember(
    name: string,
    options?: { color?: string; avatar?: string }
  ): Promise<Result<FamilyMember, FamilyUseCaseError>> {
    const { createFamilyMember } = await import('./commands');
    
    return createFamilyMember(
      {
        name,
        color: options?.color,
        avatar: options?.avatar
      },
      this.repository
    );
  }

  /**
   * 家族メンバーを更新
   */
  async updateMember(
    id: string,
    updates: { name?: string; color?: string; avatar?: string }
  ): Promise<Result<FamilyMember, FamilyUseCaseError>> {
    const { updateFamilyMember } = await import('./commands');
    
    return updateFamilyMember(
      {
        id,
        ...updates
      },
      this.repository
    );
  }

  /**
   * 家族メンバーを削除
   */
  async deleteMember(id: string): Promise<Result<void, FamilyUseCaseError>> {
    const { deleteFamilyMember } = await import('./commands');
    
    return deleteFamilyMember(id, this.repository);
  }

  /**
   * すべての家族メンバーを取得
   */
  async getAllMembers(): Promise<Result<readonly FamilyMember[], FamilyUseCaseError>> {
    const { getAllFamilyMembers } = await import('./queries');
    
    return getAllFamilyMembers(this.repository);
  }

  /**
   * IDで家族メンバーを取得
   */
  async getMemberById(id: string): Promise<Result<FamilyMember, FamilyUseCaseError>> {
    const { getFamilyMemberById } = await import('./queries');
    
    return getFamilyMemberById(id, this.repository);
  }

  /**
   * 家族メンバーの数を取得
   */
  async getMemberCount(): Promise<Result<number, FamilyUseCaseError>> {
    const { getFamilyMemberCount } = await import('./queries');
    
    return getFamilyMemberCount(this.repository);
  }

  /**
   * 家族メンバーが存在するかチェック
   */
  async memberExists(id: string): Promise<Result<boolean, FamilyUseCaseError>> {
    const { familyMemberExists } = await import('./queries');
    
    return familyMemberExists(id, this.repository);
  }
}