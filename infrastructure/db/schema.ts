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

// 統一Activityドメイン用DTO
export interface DBActivity {
  id: string;
  title: string;
  description?: string;
  
  // 時間・日付
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endDate?: string; // YYYY-MM-DD
  endTime?: string; // HH:MM
  dueDate?: string; // YYYY-MM-DD
  isAllDay: boolean;
  
  // 分類・状態
  category: 'event' | 'task' | 'appointment' | 'deadline' | 'meeting' | 'milestone' | 'reminder';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'high' | 'medium' | 'low';
  
  // 人・場所
  memberIds: string[];
  location?: string;
  
  // タスク機能
  checklist: ChecklistItemDTO[];
  completedAt?: string; // YYYY-MM-DD
  
  // メタデータ
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
  tags: string[];
  
  // 将来拡張
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    count?: number;
  };
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
  activities!: Table<DBActivity>; // 統一Activityテーブル

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
    
    // バージョン2: 統一Activityテーブル追加
    this.version(2).stores({
      familyMembers: 'id, name, color',
      calendarEvents: 'id, date, *memberIds',
      tasks: 'id, status, dueDate, *memberIds',
      // 統一Activity: 複数フィールドでインデックス作成
      activities: 'id, category, status, priority, startDate, dueDate, updatedAt, createdAt, *memberIds, *tags'
    }).upgrade(tx => {
      // バージョン2へのアップグレード時にサンプルデータを追加
      console.log('Upgrading to version 2: Adding Activity schema');
    });
    
    // バージョン3: 統一Activity移行（開発用）
    this.version(3).stores({
      familyMembers: 'id, name, color',
      // 旧テーブルを削除して統一Activityのみに
      activities: 'id, category, status, priority, startDate, dueDate, updatedAt, createdAt, *memberIds, *tags'
    }).upgrade(tx => {
      console.log('Upgrading to version 3: Unified Activity domain');
      // 必要に応じて旧データの移行処理
    });
  }

  /**
   * データベースの初期化
   * アプリケーション起動時に呼び出される
   */
  async initialize(): Promise<void> {
    try {
      await this.open();
      
      // 開発時: 統一Activityドメインへの移行のためDBを一度リセット
      if (process.env.NODE_ENV === 'development') {
        const activityCount = await this.activities.count();
        if (activityCount === 0) {
          console.log('Initializing Activity domain schema...');
          // サンプルデータを追加
          await this.addSampleDataIfEmpty();
        }
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

  /**
   * 統一Activityドメインのため、既存のDBをリセット（開発用）
   */
  async resetForActivityDomain(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Resetting database for unified Activity domain...');
      await this.delete();
      await this.open();
      await this.addSampleDataIfEmpty();
      console.log('Database reset and reinitialized for Activity domain');
    }
  }
}

// シングルトンインスタンス
export const db = new SharendarDB();