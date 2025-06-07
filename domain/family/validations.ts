import { Result, ok, err } from 'neverthrow';
import { MemberName, Color } from '@/domain/shared/branded-types';

/**
 * 家族メンバーに関するバリデーション
 */

// メンバー名のバリデーション
export const createMemberName = (value: string): Result<MemberName, string> => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return err('名前を入力してください');
  }
  
  if (trimmed.length > 20) {
    return err('名前は20文字以内で入力してください');
  }
  
  // 絵文字や特殊文字も許可
  return ok(trimmed as MemberName);
};

// カラーコードのバリデーション
export const createColor = (value: string): Result<Color, string> => {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  
  if (!colorRegex.test(value)) {
    return err('カラーコードの形式が正しくありません（例: #0ea5e9）');
  }
  
  return ok(value as Color);
};

// アバター（絵文字）のバリデーション
export const validateAvatar = (value: string): Result<string, string> => {
  if (value.length === 0) {
    return ok(''); // 空は許可
  }
  
  // 絵文字は1〜2文字（簡易的なチェック）
  // 注：完全な絵文字検証は複雑なため、簡易的に実装
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
  
  if (!emojiRegex.test(value) && value.length > 2) {
    return err('絵文字を1つ選択してください');
  }
  
  return ok(value);
};