import { MemberId, MemberName, Color } from '@/domain/shared/branded-types';

/**
 * 家族メンバーのドメインモデル
 */
export type FamilyMember = Readonly<{
  id: MemberId;
  name: MemberName;
  avatar?: string; // 絵文字 or アイコンID
  color: Color;
}>;

// エクスポート
export type { MemberId };