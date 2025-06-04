import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FamilyMemberUseCase } from '@/application/family/use-cases';
import { createFamilyUseCase } from '@/application/family';
import { FamilyMemberRepository } from '@/infrastructure/db/repository';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import { db } from '@/infrastructure/db/schema';

describe('FamilyMemberUseCase', () => {
  let useCase: FamilyMemberUseCase;
  let repository: IFamilyMemberRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    repository = new FamilyMemberRepository();
    // テストでは直接インスタンス作成（DIコンテナを使わない）
    useCase = createFamilyUseCase(repository);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('Integration Tests', () => {
    it('should handle complete family member lifecycle', async () => {
      // 1. 家族メンバーを作成
      const createResult = await useCase.createMember('太郎', {
        color: '#0ea5e9',
        avatar: '👦'
      });

      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) return;

      const member = createResult.value;
      expect(member.name).toBe('太郎');
      expect(member.color).toBe('#0ea5e9');
      expect(member.avatar).toBe('👦');

      // 2. メンバーを取得できることを確認
      const getResult = await useCase.getMemberById(member.id);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.id).toBe(member.id);
      }

      // 3. すべてのメンバーを取得
      const getAllResult = await useCase.getAllMembers();
      expect(getAllResult.isOk()).toBe(true);
      if (getAllResult.isOk()) {
        expect(getAllResult.value).toHaveLength(1);
        expect(getAllResult.value[0].id).toBe(member.id);
      }

      // 4. メンバー数を確認
      const countResult = await useCase.getMemberCount();
      expect(countResult.isOk()).toBe(true);
      if (countResult.isOk()) {
        expect(countResult.value).toBe(1);
      }

      // 5. メンバーの存在確認
      const existsResult = await useCase.memberExists(member.id);
      expect(existsResult.isOk()).toBe(true);
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(true);
      }

      // 6. メンバーを更新
      const updateResult = await useCase.updateMember(member.id, {
        name: '太郎くん',
        color: '#ec4899'
      });

      expect(updateResult.isOk()).toBe(true);
      if (updateResult.isOk()) {
        expect(updateResult.value.name).toBe('太郎くん');
        expect(updateResult.value.color).toBe('#ec4899');
        expect(updateResult.value.avatar).toBe('👦'); // 変更されない
      }

      // 7. 更新が永続化されているか確認
      const getUpdatedResult = await useCase.getMemberById(member.id);
      expect(getUpdatedResult.isOk()).toBe(true);
      if (getUpdatedResult.isOk()) {
        expect(getUpdatedResult.value.name).toBe('太郎くん');
        expect(getUpdatedResult.value.color).toBe('#ec4899');
      }

      // 8. メンバーを削除
      const deleteResult = await useCase.deleteMember(member.id);
      expect(deleteResult.isOk()).toBe(true);

      // 9. 削除されたことを確認
      const existsAfterDeleteResult = await useCase.memberExists(member.id);
      expect(existsAfterDeleteResult.isOk()).toBe(true);
      if (existsAfterDeleteResult.isOk()) {
        expect(existsAfterDeleteResult.value).toBe(false);
      }

      // 10. メンバー数が0になったことを確認
      const finalCountResult = await useCase.getMemberCount();
      expect(finalCountResult.isOk()).toBe(true);
      if (finalCountResult.isOk()) {
        expect(finalCountResult.value).toBe(0);
      }
    });

    it('should handle multiple family members with different colors', async () => {
      // 複数のメンバーを作成（色は自動割り当て）
      const member1Result = await useCase.createMember('太郎');
      const member2Result = await useCase.createMember('花子');
      const member3Result = await useCase.createMember('次郎');

      expect(member1Result.isOk()).toBe(true);
      expect(member2Result.isOk()).toBe(true);
      expect(member3Result.isOk()).toBe(true);

      if (member1Result.isOk() && member2Result.isOk() && member3Result.isOk()) {
        const member1 = member1Result.value;
        const member2 = member2Result.value;
        const member3 = member3Result.value;

        // 異なる色が割り当てられていることを確認
        expect(member1.color).not.toBe(member2.color);
        expect(member2.color).not.toBe(member3.color);
        expect(member1.color).not.toBe(member3.color);

        // すべてのメンバーが取得できることを確認
        const getAllResult = await useCase.getAllMembers();
        expect(getAllResult.isOk()).toBe(true);
        if (getAllResult.isOk()) {
          expect(getAllResult.value).toHaveLength(3);
          
          const names = getAllResult.value.map(m => m.name);
          expect(names).toContain('太郎');
          expect(names).toContain('花子');
          expect(names).toContain('次郎');
        }
      }
    });

    it('should handle validation errors gracefully', async () => {
      // 無効な名前でメンバー作成を試行
      const emptyNameResult = await useCase.createMember('');
      expect(emptyNameResult.isErr()).toBe(true);
      if (emptyNameResult.isErr()) {
        expect(emptyNameResult.error.type).toBe('ValidationError');
      }

      // 無効な色でメンバー作成を試行
      const invalidColorResult = await useCase.createMember('太郎', {
        color: 'invalid-color'
      });
      expect(invalidColorResult.isErr()).toBe(true);
      if (invalidColorResult.isErr()) {
        expect(invalidColorResult.error.type).toBe('ValidationError');
      }

      // 存在しないメンバーの更新を試行
      const nonExistentUpdateResult = await useCase.updateMember('non-existent', {
        name: '更新'
      });
      expect(nonExistentUpdateResult.isErr()).toBe(true);
      if (nonExistentUpdateResult.isErr()) {
        expect(nonExistentUpdateResult.error.type).toBe('NotFound');
      }

      // 存在しないメンバーの削除を試行
      const nonExistentDeleteResult = await useCase.deleteMember('non-existent');
      expect(nonExistentDeleteResult.isErr()).toBe(true);
      if (nonExistentDeleteResult.isErr()) {
        expect(nonExistentDeleteResult.error.type).toBe('NotFound');
      }
    });
  });
});