import { Result } from 'neverthrow';
import type { FamilyMember } from './types';
import type { MemberId } from '@/domain/shared/branded-types';

/**
 * 家族メンバーリポジトリのインターフェース
 * Domain層でインターフェースを定義し、Infrastructure層で実装する
 * 依存性逆転の原則 (DIP) に従った設計
 */

export type FamilyMemberRepositoryError = {
  type: 'DatabaseError';
  message: string;
};

export interface IFamilyMemberRepository {
  /**
   * 家族メンバーを保存する
   */
  save(member: FamilyMember): Promise<Result<void, FamilyMemberRepositoryError>>;

  /**
   * IDで家族メンバーを取得する
   */
  findById(id: MemberId): Promise<Result<FamilyMember | null, FamilyMemberRepositoryError>>;

  /**
   * すべての家族メンバーを取得する
   */
  findAll(): Promise<Result<readonly FamilyMember[], FamilyMemberRepositoryError>>;

  /**
   * 家族メンバーを削除する
   */
  delete(id: MemberId): Promise<Result<void, FamilyMemberRepositoryError>>;
}