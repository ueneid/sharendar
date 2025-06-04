import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  type CreateFamilyMemberCommand,
  type UpdateFamilyMemberCommand
} from '@/application/family/commands';
import { FamilyMemberRepository } from '@/infrastructure/db/repository';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import { db } from '@/infrastructure/db/schema';
import { asMemberId } from '@/domain/shared/branded-types';

describe('Family Commands', () => {
  let repository: IFamilyMemberRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    repository = new FamilyMemberRepository();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('createFamilyMember', () => {
    it('should create a family member with valid data', async () => {
      const command: CreateFamilyMemberCommand = {
        name: '太郎',
        color: '#0ea5e9',
        avatar: '👦'
      };

      const result = await createFamilyMember(command, repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const member = result.value;
        expect(member.name).toBe('太郎');
        expect(member.color).toBe('#0ea5e9');
        expect(member.avatar).toBe('👦');
        expect(member.id).toBeDefined();
      }
    });

    it('should auto-assign color when not provided', async () => {
      const command: CreateFamilyMemberCommand = {
        name: '花子'
      };

      const result = await createFamilyMember(command, repository);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const member = result.value;
        expect(member.name).toBe('花子');
        expect(member.color).toBeDefined();
        expect(member.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should assign different colors for multiple members', async () => {
      const command1: CreateFamilyMemberCommand = { name: '太郎' };
      const command2: CreateFamilyMemberCommand = { name: '花子' };

      const result1 = await createFamilyMember(command1, repository);
      const result2 = await createFamilyMember(command2, repository);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.color).not.toBe(result2.value.color);
      }
    });

    it('should return validation error for empty name', async () => {
      const command: CreateFamilyMemberCommand = {
        name: ''
      };

      const result = await createFamilyMember(command, repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('名前を入力してください');
      }
    });

    it('should return validation error for too long name', async () => {
      const command: CreateFamilyMemberCommand = {
        name: 'a'.repeat(21) // 21文字
      };

      const result = await createFamilyMember(command, repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('20文字以内');
      }
    });

    it('should return validation error for invalid color', async () => {
      const command: CreateFamilyMemberCommand = {
        name: '太郎',
        color: 'invalid-color'
      };

      const result = await createFamilyMember(command, repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('カラーコードの形式');
      }
    });
  });

  describe('updateFamilyMember', () => {
    it('should update family member name', async () => {
      // 先にメンバーを作成
      const createCommand: CreateFamilyMemberCommand = {
        name: '太郎',
        color: '#0ea5e9'
      };
      const createResult = await createFamilyMember(createCommand, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;
        
        const updateCommand: UpdateFamilyMemberCommand = {
          id: member.id,
          name: '太郎くん'
        };

        const updateResult = await updateFamilyMember(updateCommand, repository);

        expect(updateResult.isOk()).toBe(true);
        if (updateResult.isOk()) {
          expect(updateResult.value.name).toBe('太郎くん');
          expect(updateResult.value.color).toBe('#0ea5e9'); // 他の属性は変更されない
        }
      }
    });

    it('should update family member color', async () => {
      // 先にメンバーを作成
      const createCommand: CreateFamilyMemberCommand = {
        name: '花子',
        color: '#0ea5e9'
      };
      const createResult = await createFamilyMember(createCommand, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;
        
        const updateCommand: UpdateFamilyMemberCommand = {
          id: member.id,
          color: '#ec4899'
        };

        const updateResult = await updateFamilyMember(updateCommand, repository);

        expect(updateResult.isOk()).toBe(true);
        if (updateResult.isOk()) {
          expect(updateResult.value.color).toBe('#ec4899');
          expect(updateResult.value.name).toBe('花子'); // 他の属性は変更されない
        }
      }
    });

    it('should return error for non-existent member', async () => {
      const updateCommand: UpdateFamilyMemberCommand = {
        id: 'non-existent-id',
        name: '存在しない'
      };

      const result = await updateFamilyMember(updateCommand, repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFound');
      }
    });

    it('should return validation error for invalid update data', async () => {
      // 先にメンバーを作成
      const createCommand: CreateFamilyMemberCommand = {
        name: '太郎'
      };
      const createResult = await createFamilyMember(createCommand, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;
        
        const updateCommand: UpdateFamilyMemberCommand = {
          id: member.id,
          name: '' // 空の名前
        };

        const updateResult = await updateFamilyMember(updateCommand, repository);

        expect(updateResult.isErr()).toBe(true);
        if (updateResult.isErr()) {
          expect(updateResult.error.type).toBe('ValidationError');
        }
      }
    });
  });

  describe('deleteFamilyMember', () => {
    it('should delete existing family member', async () => {
      // 先にメンバーを作成
      const createCommand: CreateFamilyMemberCommand = {
        name: '太郎'
      };
      const createResult = await createFamilyMember(createCommand, repository);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const member = createResult.value;
        
        const deleteResult = await deleteFamilyMember(member.id, repository);

        expect(deleteResult.isOk()).toBe(true);

        // 削除確認
        const findResult = await repository.findById(asMemberId(member.id));
        expect(findResult.isOk()).toBe(true);
        if (findResult.isOk()) {
          expect(findResult.value).toBeNull();
        }
      }
    });

    it('should return error for non-existent member', async () => {
      const result = await deleteFamilyMember('non-existent-id', repository);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFound');
      }
    });
  });
});