import Dexie, { Table } from 'dexie';

/**
 * データベースの永続化用のDTO型
 * Domain層の型からBrand型を除去したプレーンなオブジェクト
 */
export interface FamilyMemberDTO {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface CalendarEventDTO {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  memberIds: string[];
  type: 'event' | 'task';
  memo?: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  dueDate?: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  memberIds: string[];
  checklist: ChecklistItemDTO[];
  createdAt: string; // YYYY-MM-DD
  completedAt?: string; // YYYY-MM-DD
}

export interface ChecklistItemDTO {
  id: string;
  title: string;
  checked: boolean;
}

/**
 * Sharendar Database Schema
 * IndexedDBを使用したローカルデータストレージ
 */
export class SharendarDB extends Dexie {
  // テーブル定義
  familyMembers!: Table<FamilyMemberDTO>;
  calendarEvents!: Table<CalendarEventDTO>;
  tasks!: Table<TaskDTO>;

  constructor() {
    super('SharendarDB');
    
    // バージョン1のスキーマ定義
    this.version(1).stores({
      // 家族メンバー: id でプライマリキー、name と color でセカンダリインデックス
      familyMembers: 'id, name, color',
      
      // カレンダーイベント: id でプライマリキー、date でインデックス、memberIds は複数値インデックス
      calendarEvents: 'id, date, *memberIds',
      
      // タスク: id でプライマリキー、status、dueDate でインデックス、memberIds は複数値インデックス
      tasks: 'id, status, dueDate, *memberIds'
    });
  }

  /**
   * データベースの初期化
   * アプリケーション起動時に呼び出される
   */
  async initialize(): Promise<void> {
    try {
      await this.open();
      
      // 初回起動時にサンプルデータを追加（開発用）
      if (process.env.NODE_ENV === 'development') {
        await this.addSampleDataIfEmpty();
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('データベースの初期化に失敗しました');
    }
  }

  /**
   * 開発用: サンプルデータの追加
   * テーブルが空の場合のみ実行
   */
  private async addSampleDataIfEmpty(): Promise<void> {
    const memberCount = await this.familyMembers.count();
    
    if (memberCount === 0) {
      // サンプル家族メンバー
      await this.familyMembers.bulkAdd([
        {
          id: 'member-1',
          name: '太郎',
          avatar: '👦',
          color: '#0ea5e9'
        },
        {
          id: 'member-2', 
          name: '花子',
          avatar: '👧',
          color: '#06b6d4'
        }
      ]);

      console.log('Sample family members added');
    }
  }

  /**
   * データベースの削除（開発用）
   */
  async reset(): Promise<void> {
    await this.delete();
    await this.open();
    console.log('Database reset completed');
  }
}

// シングルトンインスタンス
export const db = new SharendarDB();