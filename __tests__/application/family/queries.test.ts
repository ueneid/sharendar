import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getAllFamilyMembers,
  getFamilyMemberById,
  getFamilyMemberCount,
  familyMemberExists
} from '@/application/family/queries';
import { createFamilyMember } from '@/application/family/commands';
import { FamilyMemberRepository } from '@/infrastructure/db/repository';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import { db } from '@/infrastructure/db/schema';

describe('Family Queries', () => {
  let repository: IFamilyMemberRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    repository = new FamilyMemberRepository();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('getAllFamilyMembers', () => {
    it('should return empty array when no members exist', async () => {
      const result = await getAllFamilyMembers(repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should return all family members', async () => {
      // テストデータを作成
      await createFamilyMember({ name: '太郎' }, repository);
      await createFamilyMember({ name: '花子' }, repository);

      const result = await getAllFamilyMembers(repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        const names = result.value.map(m => m.name);
        expect(names).toContain('太郎');
        expect(names).toContain('花子');
      }
    });
  });

  describe('getFamilyMemberById', () => {
    it('should return family member when exists', async () => {
      // テストデータを作成
      const createResult = await createFamilyMember({ 
        name: '太郎', 
        color: '#0ea5e9' 
      }, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;

        const result = await getFamilyMemberById(member.id, repository);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.id).toBe(member.id);
          expect(result.value.name).toBe('太郎');
          expect(result.value.color).toBe('#0ea5e9');
        }
      }
    });

    it('should return NotFound error when member does not exist', async () => {
      const result = await getFamilyMemberById('non-existent-id', repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFound');
        expect(result.error.message).toContain('見つかりません');
      }
    });
  });

  describe('getFamilyMemberCount', () => {
    it('should return 0 when no members exist', async () => {
      const result = await getFamilyMemberCount(repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(0);
      }
    });

    it('should return correct count when members exist', async () => {
      // テストデータを作成
      await createFamilyMember({ name: '太郎' }, repository);
      await createFamilyMember({ name: '花子' }, repository);
      await createFamilyMember({ name: '次郎' }, repository);

      const result = await getFamilyMemberCount(repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(3);
      }
    });
  });

  describe('familyMemberExists', () => {
    it('should return true when member exists', async () => {
      // テストデータを作成
      const createResult = await createFamilyMember({ name: '太郎' }, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;

        const result = await familyMemberExists(member.id, repository);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(true);
        }
      }
    });

    it('should return false when member does not exist', async () => {
      const result = await familyMemberExists('non-existent-id', repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });
});