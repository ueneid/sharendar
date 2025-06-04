import { Result, ok, err } from 'neverthrow';
import type { FamilyMember } from '@/domain/family/types';
import { asMemberId } from '@/domain/shared/branded-types';
import type { IFamilyMemberRepository } from '@/domain/family/repository';

/**
 * 家族メンバー管理のクエリ操作
 * 状態を変更しない読み取り専用操作（Read）
 */

// クエリのエラー型
export type QueryError = 
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

/**
 * すべての家族メンバーを取得する
 */
export const getAllFamilyMembers = async (
  repository: IFamilyMemberRepository
): Promise<Result<readonly FamilyMember[], QueryError>> => {
  const result = await repository.findAll();
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * IDで家族メンバーを取得する
 */
export const getFamilyMemberById = async (
  id: string,
  repository: IFamilyMemberRepository
): Promise<Result<FamilyMember, QueryError>> => {
  const result = await repository.findById(asMemberId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  const member = result.value;
  if (!member) {
    return err({
      type: 'NotFound',
      message: '指定された家族メンバーが見つかりません'
    });
  }

  return ok(member);
};

/**
 * 家族メンバーの数を取得する
 */
export const getFamilyMemberCount = async (
  repository: IFamilyMemberRepository
): Promise<Result<number, QueryError>> => {
  const result = await getAllFamilyMembers(repository);
  
  if (result.isErr()) {
    return err(result.error);
  }

  return ok(result.value.length);
};

/**
 * 家族メンバーが存在するかチェックする
 */
export const familyMemberExists = async (
  id: string,
  repository: IFamilyMemberRepository
): Promise<Result<boolean, QueryError>> => {
  const result = await repository.findById(asMemberId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value !== null);
};