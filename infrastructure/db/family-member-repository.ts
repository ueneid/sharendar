/**
 * Dexie.jsを使用したFamilyMemberRepositoryの実装
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Result, ok, err } from 'neverthrow';
import type { IFamilyMemberRepository, FamilyMemberRepositoryError } from '@/domain/family/repository';
import type { FamilyMember } from '@/domain/family/types';
import type { MemberId } from '@/domain/shared/branded-types';
import { asMemberId, asMemberName, asColor } from '@/domain/shared/branded-types';
import { db, type FamilyMemberDTO } from './schema';

/**
 * DTOからドメインモデルへの変換
 */
const toDomain = (dto: FamilyMemberDTO): FamilyMember => ({
  id: asMemberId(dto.id),
  name: asMemberName(dto.name),
  avatar: dto.avatar,
  color: asColor(dto.color)
});

/**
 * ドメインモデルからDTOへの変換
 */
const toDTO = (domain: FamilyMember): FamilyMemberDTO => ({
  id: domain.id,
  name: domain.name,
  avatar: domain.avatar,
  color: domain.color
});

@injectable()
export class DexieFamilyMemberRepository implements IFamilyMemberRepository {
  async save(member: FamilyMember): Promise<Result<void, FamilyMemberRepositoryError>> {
    try {
      await db.familyMembers.put(toDTO(member));
      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの保存に失敗しました: ${errorMessage}`
      });
    }
  }

  async findById(id: MemberId): Promise<Result<FamilyMember | null, FamilyMemberRepositoryError>> {
    try {
      const dto = await db.familyMembers.get(id);
      return ok(dto ? toDomain(dto) : null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの取得に失敗しました: ${errorMessage}`
      });
    }
  }

  async findAll(): Promise<Result<readonly FamilyMember[], FamilyMemberRepositoryError>> {
    try {
      const dtos = await db.familyMembers.toArray();
      return ok(dtos.map(toDomain));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return err({
        type: 'DatabaseError',
        message: `家族メンバー一覧の取得に失敗しました: ${errorMessage}`
      });
    }
  }

  async delete(id: MemberId): Promise<Result<void, FamilyMemberRepositoryError>> {
    try {
      await db.familyMembers.delete(id);
      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの削除に失敗しました: ${errorMessage}`
      });
    }
  }
}