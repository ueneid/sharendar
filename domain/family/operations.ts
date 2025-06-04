import { FamilyMember } from './types';
import { MemberId, MemberName, Color } from '@/domain/shared/branded-types';
import { nanoid } from 'nanoid';

/**
 * 家族メンバーに関する純粋関数
 */

// 新しい家族メンバーを作成
export const createFamilyMember = (
  name: MemberName,
  color: Color,
  avatar?: string
): FamilyMember => ({
  id: nanoid() as MemberId,
  name,
  color,
  avatar,
});

// 家族メンバーの名前を更新
export const updateMemberName = (
  member: FamilyMember,
  name: MemberName
): FamilyMember => ({
  ...member,
  name,
});

// 家族メンバーの色を更新
export const updateMemberColor = (
  member: FamilyMember,
  color: Color
): FamilyMember => ({
  ...member,
  color,
});

// 家族メンバーのアバターを更新
export const updateMemberAvatar = (
  member: FamilyMember,
  avatar: string | undefined
): FamilyMember => ({
  ...member,
  avatar,
});

// デフォルトのメンバーカラー
export const DEFAULT_MEMBER_COLORS: Color[] = [
  '#0ea5e9' as Color, // 青
  '#06b6d4' as Color, // シアン
  '#14b8a6' as Color, // ティール
  '#10b981' as Color, // エメラルド
  '#84cc16' as Color, // ライム
  '#eab308' as Color, // イエロー
  '#f97316' as Color, // オレンジ
  '#ef4444' as Color, // レッド
  '#ec4899' as Color, // ピンク
  '#a855f7' as Color, // パープル
];

// 次に使用すべき色を取得
export const getNextColor = (
  existingMembers: ReadonlyArray<FamilyMember>
): Color => {
  const usedColors = new Set(existingMembers.map(m => m.color));
  const availableColor = DEFAULT_MEMBER_COLORS.find(
    color => !usedColors.has(color)
  );
  return availableColor || DEFAULT_MEMBER_COLORS[0];
};