import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SharendarDB } from '@/infrastructure/db/schema';

describe('SharendarDB Schema Tests', () => {
  let testDb: SharendarDB;

  beforeEach(async () => {
    testDb = new SharendarDB();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  describe('Database Initialization', () => {
    it('should initialize database with correct schema', async () => {
      await testDb.initialize();
      
      expect(testDb.isOpen()).toBe(true);
      expect(testDb.tables).toHaveLength(2);
      
      // テーブルの存在確認
      const tableNames = testDb.tables.map(table => table.name);
      expect(tableNames).toContain('familyMembers');
      expect(tableNames).toContain('activities');
    });

    it('should have correct indexes on tables', async () => {
      await testDb.initialize();
      
      // familyMembers のインデックス確認
      const familyMembersTable = testDb.table('familyMembers');
      expect(familyMembersTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'name' })
      );
      expect(familyMembersTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'color' })
      );

      // activities のインデックス確認
      const activitiesTable = testDb.table('activities');
      expect(activitiesTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'category' })
      );
      expect(activitiesTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'status' })
      );
      expect(activitiesTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'priority' })
      );
      expect(activitiesTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'memberIds', multi: true })
      );
      expect(activitiesTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'tags', multi: true })
      );
    });
  });

  describe('Sample Data in Development', () => {
    it('should add sample data in development mode', async () => {
      // Vitestの環境変数モック機能を使用
      vi.stubEnv('NODE_ENV', 'development');

      try {
        await testDb.initialize();
        
        // サンプルデータが追加されているかチェック
        const memberCount = await testDb.familyMembers.count();
        expect(memberCount).toBeGreaterThan(0);
        
        // サンプルデータの内容確認
        const members = await testDb.familyMembers.toArray();
        expect(members[0]).toMatchObject({
          id: 'member-1',
          name: '太郎',
          avatar: '👦',
          color: '#0ea5e9'
        });
      } finally {
        // 環境変数を元に戻す
        vi.unstubAllEnvs();
      }
    });

    it('should not add sample data in production mode', async () => {
      // Vitestの環境変数モック機能を使用
      vi.stubEnv('NODE_ENV', 'production');

      try {
        await testDb.initialize();
        
        // サンプルデータが追加されていないかチェック
        const memberCount = await testDb.familyMembers.count();
        expect(memberCount).toBe(0);
      } finally {
        // 環境変数を元に戻す
        vi.unstubAllEnvs();
      }
    });
  });

  describe('Database Operations', () => {
    it('should handle basic CRUD operations on familyMembers', async () => {
      await testDb.initialize();

      // Create
      const memberData = {
        id: 'test-member-1',
        name: 'テストユーザー',
        avatar: '😊',
        color: '#ff0000'
      };

      await testDb.familyMembers.add(memberData);

      // Read
      const member = await testDb.familyMembers.get('test-member-1');
      expect(member).toMatchObject(memberData);

      // Update
      await testDb.familyMembers.update('test-member-1', { name: '更新されたユーザー' });
      const updatedMember = await testDb.familyMembers.get('test-member-1');
      expect(updatedMember?.name).toBe('更新されたユーザー');

      // Delete
      await testDb.familyMembers.delete('test-member-1');
      const deletedMember = await testDb.familyMembers.get('test-member-1');
      expect(deletedMember).toBeUndefined();
    });

    it('should handle multi-value index queries on memberIds', async () => {
      await testDb.initialize();

      // テストデータ作成
      await testDb.activities.bulkAdd([
        {
          id: 'activity-1',
          title: 'アクティビティ1',
          startDate: '2024-03-15',
          memberIds: ['member-1', 'member-2'],
          category: 'event' as const,
          status: 'pending' as const,
          priority: 'medium' as const,
          isAllDay: true,
          checklist: [],
          createdAt: '2024-03-15',
          updatedAt: '2024-03-15',
          tags: []
        },
        {
          id: 'activity-2',
          title: 'アクティビティ2',
          startDate: '2024-03-16',
          memberIds: ['member-1'],
          category: 'task' as const,
          status: 'pending' as const,
          priority: 'high' as const,
          isAllDay: false,
          checklist: [],
          createdAt: '2024-03-16',
          updatedAt: '2024-03-16',
          tags: []
        },
        {
          id: 'activity-3',
          title: 'アクティビティ3',
          startDate: '2024-03-17',
          memberIds: ['member-3'],
          category: 'meeting' as const,
          status: 'pending' as const,
          priority: 'low' as const,
          isAllDay: true,
          checklist: [],
          createdAt: '2024-03-17',
          updatedAt: '2024-03-17',
          tags: []
        }
      ]);

      // member-1 に関連するアクティビティを検索
      const member1Activities = await testDb.activities
        .where('memberIds')
        .equals('member-1')
        .toArray();

      expect(member1Activities).toHaveLength(2);
      expect(member1Activities.map(a => a.id)).toContain('activity-1');
      expect(member1Activities.map(a => a.id)).toContain('activity-2');
    });
  });

  describe('Error Handling', () => {
    it('should handle database initialization errors gracefully', async () => {
      // スパイを使ってDB openメソッドでエラーを発生させる
      const badDb = new SharendarDB();
      const openSpy = vi.spyOn(badDb, 'open').mockRejectedValue(new Error('DB open failed'));

      await expect(badDb.initialize()).rejects.toThrow('データベースの初期化に失敗しました');
      
      openSpy.mockRestore();
    });
  });

  describe('Database Reset', () => {
    it('should reset database successfully', async () => {
      await testDb.initialize();
      
      // データを追加
      await testDb.familyMembers.add({
        id: 'test-member',
        name: 'テスト',
        color: '#0ea5e9'
      });

      // リセット前のデータ確認
      const beforeCount = await testDb.familyMembers.count();
      expect(beforeCount).toBeGreaterThan(0);

      // リセット実行
      await testDb.reset();

      // リセット後のデータ確認
      const afterCount = await testDb.familyMembers.count();
      expect(afterCount).toBe(0);
    });
  });
});