import { describe, it, expect } from 'vitest';
import { 
  parseOcrText, 
  convertToActivities, 
  convertToActivityDomain 
} from '@/domain/ocr/operations';
import { 
  OcrKeywords, 
  ExtractedActivity, 
  ParsedContent 
} from '@/domain/ocr/types';
import { asDateString, asTimeString } from '@/domain/shared/branded-types';

describe('OCR Operations', () => {
  describe('parseOcrText', () => {
    it('should parse school trip document correctly', () => {
      const rawText = `
        遠足のお知らせ
        
        日時：3月15日（金）午前9時30分〜午後3時
        場所：上野動物園
        集合場所：学校正門
        
        持ち物：
        ・水筒
        ・帽子
        ・タオル
        ・昼食（各自持参）
        
        注意事項：
        ・雨天決行
        ・保護者の同伴不可
      `;

      const result = parseOcrText(rawText, 0.9);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('遠足のお知らせ');
        expect(parsedContent.dates).toHaveLength(1);
        expect(parsedContent.dates[0].date).toBe('2025-03-15');
        expect(parsedContent.times.length).toBeGreaterThanOrEqual(2);
        // 重要な時間が含まれていることを確認
        const timeValues = parsedContent.times.map(t => t.time);
        expect(timeValues).toContain('09:30');
        expect(timeValues).toContain('15:00');
        expect(parsedContent.locations).toContain('上野動物園');
        expect(parsedContent.notes).toContain('雨天決行');
        expect(parsedContent.notes).toContain('保護者の同伴不可');
      }
    });

    it('should parse parent-teacher conference document correctly', () => {
      const rawText = `
        保護者会のご案内
        
        日時：令和7年4月20日（土）午後2時より
        場所：第1会議室
        
        議題：
        1. 新学期の方針について
        2. 年間行事予定
        3. 家庭学習について
        
        持参物：
        ・筆記用具
        ・出席確認書
        ・前回の資料
        
        ※欠席の場合は事前にご連絡ください
      `;

      const result = parseOcrText(rawText, 0.85);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('保護者会のご案内');
        expect(parsedContent.dates).toHaveLength(1);
        expect(parsedContent.dates[0].date).toBe('2025-04-20');
        expect(parsedContent.times).toHaveLength(1);
        expect(parsedContent.times[0].time).toBe('14:00');
        expect(parsedContent.locations).toContain('第1会議室');
        expect(parsedContent.notes).toContain('欠席の場合は事前にご連絡ください');
      }
    });

    it('should parse homework document correctly', () => {
      const rawText = `
        宿題のお知らせ
        
        提出日：5月10日（金）まで
        科目：国語
        
        内容：
        ・漢字練習帳 p.15-20
        ・読書感想文（400字以内）
        ・音読練習（毎日）
        
        持参物：
        ・赤ペン
        ・辞書
        ・ワークブック
        
        ※必ず期限内に提出してください
      `;

      const result = parseOcrText(rawText, 0.8);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('宿題のお知らせ');
        expect(parsedContent.dates).toHaveLength(1);
        expect(parsedContent.dates[0].date).toBe('2025-05-10');
        expect(parsedContent.notes).toContain('必ず期限内に提出してください');
      }
    });

    it('should handle empty text', () => {
      const result = parseOcrText('', 0.5);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ParseError');
        expect(result.error.message).toContain('解析するテキストが空です');
      }
    });

    it('should handle various date formats', () => {
      const rawText = `
        テストイベント
        
        日時：
        - 3月15日（金）
        - 令和7年4月20日
        - 2025年5月10日
        - 6/25
      `;

      const result = parseOcrText(rawText, 0.9);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.dates).toHaveLength(4);
        expect(parsedContent.dates[0].date).toBe('2025-03-15');
        expect(parsedContent.dates[1].date).toBe('2025-04-20');
        expect(parsedContent.dates[2].date).toBe('2025-05-10');
        expect(parsedContent.dates[3].date).toBe('2025-06-25');
      }
    });

    it('should handle various time formats', () => {
      const rawText = `
        タイムテスト
        
        時間：
        - 午前9時30分
        - 午後3時
        - 13:45
        - 10時
      `;

      const result = parseOcrText(rawText, 0.9);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.times.length).toBeGreaterThanOrEqual(3);
        // 重要な時間が含まれていることを確認
        const timeValues = parsedContent.times.map(t => t.time);
        expect(timeValues).toContain('09:30');
        expect(timeValues).toContain('15:00');
        expect(timeValues).toContain('13:45');
      }
    });
  });

  describe('convertToActivities', () => {
    it('should convert school trip to activity', () => {
      const parsedContent: ParsedContent = {
        title: '遠足のお知らせ',
        dates: [
          {
            text: '3月15日（金）',
            date: asDateString('2025-03-15'),
            confidence: 0.9,
            type: 'start_date'
          }
        ],
        times: [
          {
            text: '午前9時30分',
            time: asTimeString('09:30'),
            confidence: 0.85,
            type: 'start_time'
          },
          {
            text: '午後3時',
            time: asTimeString('15:00'),
            confidence: 0.8,
            type: 'end_time'
          }
        ],
        items: [
          {
            text: '水筒、帽子、タオル',
            items: ['水筒', '帽子', 'タオル'],
            confidence: 0.88,
            category: 'belongings'
          }
        ],
        locations: ['上野動物園', '学校正門'],
        notes: ['雨天決行', '保護者の同伴不可'],
        confidence: 0.87
      };

      const result = convertToActivities(parsedContent);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activities = result.value;
        expect(activities).toHaveLength(1);
        const activity = activities[0];
        expect(activity.title).toBe('遠足のお知らせ');
        expect(activity.category).toBe('event');
        expect(activity.startDate).toBe('2025-03-15');
        expect(activity.startTime).toBe('09:30');
        expect(activity.endTime).toBe('15:00');
        expect(activity.location).toBe('上野動物園');
        expect(activity.checklist).toHaveLength(3);
        expect(activity.checklist[0].title).toBe('水筒');
        expect(activity.checklist[1].title).toBe('帽子');
        expect(activity.checklist[2].title).toBe('タオル');
        expect(activity.tags).toContain('イベント');
        expect(activity.tags).toContain('学校行事');
      }
    });

    it('should convert parent-teacher conference to activity', () => {
      const parsedContent: ParsedContent = {
        title: '保護者会のご案内',
        dates: [
          {
            text: '4月20日（土）',
            date: asDateString('2025-04-20'),
            confidence: 0.92,
            type: 'start_date'
          }
        ],
        times: [
          {
            text: '午後2時',
            time: asTimeString('14:00'),
            confidence: 0.9,
            type: 'start_time'
          }
        ],
        items: [
          {
            text: '筆記用具、資料',
            items: ['筆記用具', '資料'],
            confidence: 0.85,
            category: 'materials'
          }
        ],
        locations: ['第1会議室'],
        notes: ['出席確認書を持参してください'],
        confidence: 0.89
      };

      const result = convertToActivities(parsedContent);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activities = result.value;
        expect(activities).toHaveLength(1);
        const activity = activities[0];
        expect(activity.title).toBe('保護者会のご案内');
        expect(activity.category).toBe('meeting');
        expect(activity.priority).toBe('medium');
        expect(activity.location).toBe('第1会議室');
        expect(activity.checklist).toHaveLength(2);
        expect(activity.tags).toContain('会議');
        expect(activity.tags).toContain('保護者');
      }
    });

    it('should convert homework to task activity', () => {
      const parsedContent: ParsedContent = {
        title: '宿題のお知らせ',
        dates: [
          {
            text: '5月10日（金）',
            date: asDateString('2025-05-10'),
            confidence: 0.9,
            type: 'due_date'
          }
        ],
        times: [],
        items: [
          {
            text: '漢字練習帳、読書感想文',
            items: ['漢字練習帳', '読書感想文'],
            confidence: 0.85,
            category: 'materials'
          }
        ],
        locations: [],
        notes: ['必ず期限内に提出してください'],
        confidence: 0.82
      };

      const result = convertToActivities(parsedContent);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activities = result.value;
        expect(activities).toHaveLength(2); // メインアクティビティ + 宿題アクティビティ
        
        const mainActivity = activities[0];
        expect(mainActivity.title).toBe('宿題のお知らせ');
        
        const homeworkActivity = activities[1];
        expect(homeworkActivity.title).toBe('宿題');
        expect(homeworkActivity.category).toBe('task');
        expect(homeworkActivity.priority).toBe('high');
        expect(homeworkActivity.dueDate).toBe('2025-05-10');
        expect(homeworkActivity.isAllDay).toBe(true);
        expect(homeworkActivity.tags).toContain('宿題');
        expect(homeworkActivity.tags).toContain('学習');
      }
    });

    it('should handle content without title', () => {
      const parsedContent: ParsedContent = {
        title: undefined,
        dates: [],
        times: [],
        items: [],
        locations: [],
        notes: [],
        confidence: 0.5
      };

      const result = convertToActivities(parsedContent);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ConversionError');
        expect(result.error.message).toContain('タイトルが見つからない');
      }
    });
  });

  describe('convertToActivityDomain', () => {
    it('should convert ExtractedActivity to Activity domain model', () => {
      const extractedActivity: ExtractedActivity = {
        title: '遠足',
        description: '動物園への遠足です',
        startDate: asDateString('2025-03-15'),
        startTime: asTimeString('09:30'),
        endDate: asDateString('2025-03-15'),
        endTime: asTimeString('15:00'),
        dueDate: undefined,
        isAllDay: false,
        category: 'event',
        priority: 'medium',
        location: '上野動物園',
        checklist: [
          {
            id: 'item-1',
            title: '水筒',
            checked: false,
            category: 'belongings'
          }
        ],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = convertToActivityDomain(extractedActivity, 'ocr-test-1');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activity = result.value;
        expect(activity.title).toBe('遠足');
        expect(activity.description).toBe('動物園への遠足です');
        expect(activity.startDate).toBe('2025-03-15');
        expect(activity.startTime).toBe('09:30');
        expect(activity.endDate).toBe('2025-03-15');
        expect(activity.endTime).toBe('15:00');
        expect(activity.category).toBe('event');
        expect(activity.status).toBe('pending');
        expect(activity.priority).toBe('medium');
        expect(activity.location).toBe('上野動物園');
        expect(activity.checklist).toHaveLength(1);
        expect(activity.checklist[0].title).toBe('水筒');
        expect(activity.tags).toContain('遠足');
        expect(activity.tags).toContain('学校行事');
        expect(activity.tags).toContain('OCR生成');
      }
    });

    it('should convert homework task correctly', () => {
      const extractedActivity: ExtractedActivity = {
        title: '国語の宿題',
        description: '漢字練習帳と読書感想文',
        startDate: undefined,
        startTime: undefined,
        endDate: undefined,
        endTime: undefined,
        dueDate: asDateString('2025-05-10'),
        isAllDay: true,
        category: 'task',
        priority: 'high',
        location: undefined,
        checklist: [
          {
            id: 'item-1',
            title: '漢字練習帳',
            checked: false,
            category: 'materials'
          },
          {
            id: 'item-2',
            title: '読書感想文',
            checked: false,
            category: 'materials'
          }
        ],
        tags: ['宿題', '国語'],
        confidence: 0.8
      };

      const result = convertToActivityDomain(extractedActivity, 'ocr-test-2');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activity = result.value;
        expect(activity.title).toBe('国語の宿題');
        expect(activity.dueDate).toBe('2025-05-10');
        expect(activity.isAllDay).toBe(true);
        expect(activity.category).toBe('task');
        expect(activity.priority).toBe('high');
        expect(activity.checklist).toHaveLength(2);
        expect(activity.checklist[0].title).toBe('漢字練習帳');
        expect(activity.checklist[1].title).toBe('読書感想文');
        expect(activity.tags).toContain('宿題');
        expect(activity.tags).toContain('国語');
        expect(activity.tags).toContain('OCR生成');
      }
    });

    it('should handle invalid extracted activity', () => {
      const extractedActivity: ExtractedActivity = {
        title: '', // 空のタイトル
        description: undefined,
        startDate: undefined,
        startTime: undefined,
        endDate: undefined,
        endTime: undefined,
        dueDate: undefined,
        isAllDay: false,
        category: 'event',
        priority: 'medium',
        location: undefined,
        checklist: [],
        tags: [],
        confidence: 0.5
      };

      const result = convertToActivityDomain(extractedActivity, 'ocr-test-3');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('アクティビティタイトルが必要です');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex school document with multiple activities', () => {
      const rawText = `
        学校だより
        
        ◆遠足のお知らせ
        日時：3月15日（金）午前9時30分〜午後3時
        場所：上野動物園
        持ち物：水筒、帽子、タオル
        
        ◆保護者会のご案内
        日時：4月20日（土）午後2時より
        場所：第1会議室
        持参物：筆記用具、資料
        
        ◆宿題について
        提出日：5月10日（金）まで
        内容：漢字練習帳、読書感想文
      `;

      const result = parseOcrText(rawText, 0.8);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('学校だより');
        expect(parsedContent.dates.length).toBeGreaterThan(0);
        expect(parsedContent.times.length).toBeGreaterThan(0);
        expect(parsedContent.items.length).toBeGreaterThan(0);
        expect(parsedContent.locations.length).toBeGreaterThan(0);
      }
    });

    it('should handle low confidence text', () => {
      const rawText = `
        読み取り困難なテキスト
        日時：不明
        場所：？？？
      `;

      const result = parseOcrText(rawText, 0.3);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('読み取り困難なテキスト');
        expect(parsedContent.confidence).toBe(0.3);
      }
    });

    it('should handle text with unusual formatting', () => {
      const rawText = `
        特　別　な　形　式
        
        日時：　２０２５年３月１５日（金）　午前９時３０分
        場所：　上野動物園
        
        持ち物：
        　・水筒
        　・帽子
        　・タオル
      `;

      const result = parseOcrText(rawText, 0.7);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsedContent = result.value;
        expect(parsedContent.title).toBe('特　別　な　形　式');
        // 全角数字や特殊な形式でも解析できることを確認
        expect(parsedContent.dates.length).toBeGreaterThan(0);
        expect(parsedContent.times.length).toBeGreaterThan(0);
      }
    });
  });
});