import { Result, ok, err } from 'neverthrow';
import type { FamilyMember } from '@/domain/family/types';
import type { MemberName, Color } from '@/domain/shared/branded-types';
import { asMemberId } from '@/domain/shared/branded-types';
import { 
  createFamilyMember as createMemberPure,
  updateMemberName,
  updateMemberColor,
  updateMemberAvatar,
  getNextColor
} from '@/domain/family/operations';
import { 
  createMemberName,
  createColor,
  validateAvatar
} from '@/domain/family/validations';
import type { 
  IFamilyMemberRepository,
  FamilyMemberRepositoryError
} from '@/domain/family/repository';

/**
 * 家族メンバー管理のコマンド操作
 * 状態を変更する操作（Create, Update, Delete）
 */

// コマンドのエラー型
export type CommandError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

// 家族メンバー作成コマンド
export interface CreateFamilyMemberCommand {
  name: string;
  color?: string;
  avatar?: string;
}

// 家族メンバー更新コマンド
export interface UpdateFamilyMemberCommand {
  id: string;
  name?: string;
  color?: string;
  avatar?: string;
}

/**
 * 家族メンバーを作成する
 */
export const createFamilyMember = async (
  command: CreateFamilyMemberCommand,
  repository: IFamilyMemberRepository
): Promise<Result<FamilyMember, CommandError>> => {
  // バリデーション
  const nameResult = createMemberName(command.name);
  if (nameResult.isErr()) {
    return err({ type: 'ValidationError', message: nameResult.error });
  }

  // カラーが指定されていない場合は自動選択
  let color: Color;
  if (command.color) {
    const colorResult = createColor(command.color);
    if (colorResult.isErr()) {
      return err({ type: 'ValidationError', message: colorResult.error });
    }
    color = colorResult.value;
  } else {
    // 既存メンバーを取得して次の色を決定
    const existingMembersResult = await repository.findAll();
    if (existingMembersResult.isErr()) {
      return err({ 
        type: 'DatabaseError', 
        message: existingMembersResult.error.message 
      });
    }
    color = getNextColor(existingMembersResult.value);
  }

  // アバターのバリデーション
  if (command.avatar) {
    const avatarResult = validateAvatar(command.avatar);
    if (avatarResult.isErr()) {
      return err({ type: 'ValidationError', message: avatarResult.error });
    }
  }

  // ドメインオブジェクト作成
  const member = createMemberPure(
    nameResult.value,
    color,
    command.avatar
  );

  // 永続化
  const saveResult = await repository.save(member);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(member);
};

/**
 * 家族メンバーを更新する
 */
export const updateFamilyMember = async (
  command: UpdateFamilyMemberCommand,
  repository: IFamilyMemberRepository
): Promise<Result<FamilyMember, CommandError>> => {
  // 既存メンバーを取得
  const memberResult = await repository.findById(asMemberId(command.id));
  if (memberResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: memberResult.error.message
    });
  }

  const existingMember = memberResult.value;
  if (!existingMember) {
    return err({
      type: 'NotFound',
      message: '指定された家族メンバーが見つかりません'
    });
  }

  let updatedMember = existingMember;

  // 名前の更新
  if (command.name !== undefined) {
    const nameResult = createMemberName(command.name);
    if (nameResult.isErr()) {
      return err({ type: 'ValidationError', message: nameResult.error });
    }
    updatedMember = updateMemberName(updatedMember, nameResult.value);
  }

  // 色の更新
  if (command.color !== undefined) {
    const colorResult = createColor(command.color);
    if (colorResult.isErr()) {
      return err({ type: 'ValidationError', message: colorResult.error });
    }
    updatedMember = updateMemberColor(updatedMember, colorResult.value);
  }

  // アバターの更新
  if (command.avatar !== undefined) {
    const avatarResult = validateAvatar(command.avatar);
    if (avatarResult.isErr()) {
      return err({ type: 'ValidationError', message: avatarResult.error });
    }
    updatedMember = updateMemberAvatar(updatedMember, command.avatar || undefined);
  }

  // 永続化
  const saveResult = await repository.save(updatedMember);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedMember);
};

/**
 * 家族メンバーを削除する
 */
export const deleteFamilyMember = async (
  id: string,
  repository: IFamilyMemberRepository
): Promise<Result<void, CommandError>> => {
  // 存在確認
  const memberResult = await repository.findById(asMemberId(id));
  if (memberResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: memberResult.error.message
    });
  }

  if (!memberResult.value) {
    return err({
      type: 'NotFound',
      message: '指定された家族メンバーが見つかりません'
    });
  }

  // 削除実行
  const deleteResult = await repository.delete(asMemberId(id));
  if (deleteResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: deleteResult.error.message
    });
  }

  return ok(undefined);
};