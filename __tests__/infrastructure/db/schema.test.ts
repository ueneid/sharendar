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
      expect(testDb.tables).toHaveLength(3);
      
      // テーブルの存在確認
      const tableNames = testDb.tables.map(table => table.name);
      expect(tableNames).toContain('familyMembers');
      expect(tableNames).toContain('calendarEvents');
      expect(tableNames).toContain('tasks');
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

      // calendarEvents のインデックス確認
      const calendarEventsTable = testDb.table('calendarEvents');
      expect(calendarEventsTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'date' })
      );
      expect(calendarEventsTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'memberIds', multi: true })
      );

      // tasks のインデックス確認
      const tasksTable = testDb.table('tasks');
      expect(tasksTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'status' })
      );
      expect(tasksTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'dueDate' })
      );
      expect(tasksTable.schema.indexes).toContainEqual(
        expect.objectContaining({ name: 'memberIds', multi: true })
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
      await testDb.calendarEvents.bulkAdd([
        {
          id: 'event-1',
          title: 'イベント1',
          date: '2024-03-15',
          memberIds: ['member-1', 'member-2'],
          type: 'event' as const
        },
        {
          id: 'event-2',
          title: 'イベント2',
          date: '2024-03-16',
          memberIds: ['member-1'],
          type: 'event' as const
        },
        {
          id: 'event-3',
          title: 'イベント3',
          date: '2024-03-17',
          memberIds: ['member-3'],
          type: 'event' as const
        }
      ]);

      // member-1 に関連するイベントを検索
      const member1Events = await testDb.calendarEvents
        .where('memberIds')
        .equals('member-1')
        .toArray();

      expect(member1Events).toHaveLength(2);
      expect(member1Events.map(e => e.id)).toContain('event-1');
      expect(member1Events.map(e => e.id)).toContain('event-2');
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