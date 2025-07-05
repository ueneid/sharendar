import { describe, it, expect } from 'vitest';
import { 
  validateProcessOcrCommand,
  validateReviewOcrCommand,
  validateOcrResult,
  validateParsedContent,
  validateExtractedDate,
  validateExtractedTime,
  validateExtractedItem,
  validateExtractedActivity
} from '@/domain/ocr/validations';
import { 
  ProcessOcrCommand,
  ReviewOcrCommand,
  OcrResult,
  ParsedContent,
  ExtractedDate,
  ExtractedTime,
  ExtractedItem,
  ExtractedActivity
} from '@/domain/ocr/types';
import { 
  asOcrResultId,
  asOcrImageId,
  asDateString,
  asTimeString 
} from '@/domain/shared/branded-types';

describe('OCR Validations', () => {
  describe('validateProcessOcrCommand', () => {
    it('should validate valid ProcessOcrCommand', () => {
      const command: ProcessOcrCommand = {
        imageId: 'test-image-1',
        rawText: '遠足のお知らせ',
        confidence: 0.85
      };

      const result = validateProcessOcrCommand(command);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(command);
      }
    });

    it('should reject empty imageId', () => {
      const command: ProcessOcrCommand = {
        imageId: '',
        rawText: '遠足のお知らせ',
        confidence: 0.85
      };

      const result = validateProcessOcrCommand(command);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('画像IDが必要です');
        expect(result.error.field).toBe('imageId');
      }
    });

    it('should reject empty rawText', () => {
      const command: ProcessOcrCommand = {
        imageId: 'test-image-1',
        rawText: '',
        confidence: 0.85
      };

      const result = validateProcessOcrCommand(command);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('テキストが必要です');
        expect(result.error.field).toBe('rawText');
      }
    });

    it('should reject invalid confidence values', () => {
      const command1: ProcessOcrCommand = {
        imageId: 'test-image-1',
        rawText: '遠足のお知らせ',
        confidence: -0.1
      };

      const command2: ProcessOcrCommand = {
        imageId: 'test-image-1',
        rawText: '遠足のお知らせ',
        confidence: 1.1
      };

      const result1 = validateProcessOcrCommand(command1);
      const result2 = validateProcessOcrCommand(command2);
      
      expect(result1.isErr()).toBe(true);
      expect(result2.isErr()).toBe(true);
      
      if (result1.isErr()) {
        expect(result1.error.message).toContain('信頼度は0から1の間で入力してください');
        expect(result1.error.field).toBe('confidence');
      }
    });
  });

  describe('validateReviewOcrCommand', () => {
    it('should validate valid ReviewOcrCommand', () => {
      const command: ReviewOcrCommand = {
        id: 'test-ocr-1',
        correctedContent: {
          title: '遠足のお知らせ',
          dates: [],
          times: [],
          items: [],
          locations: [],
          notes: [],
          confidence: 0.9
        },
        approvedActivities: ['activity-1', 'activity-2']
      };

      const result = validateReviewOcrCommand(command);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(command);
      }
    });

    it('should reject empty id', () => {
      const command: ReviewOcrCommand = {
        id: '',
        correctedContent: {
          title: '遠足のお知らせ',
          dates: [],
          times: [],
          items: [],
          locations: [],
          notes: [],
          confidence: 0.9
        },
        approvedActivities: []
      };

      const result = validateReviewOcrCommand(command);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('OCR結果IDが必要です');
        expect(result.error.field).toBe('id');
      }
    });
  });

  describe('validateExtractedDate', () => {
    it('should validate valid ExtractedDate', () => {
      const date: ExtractedDate = {
        text: '3月15日（金）',
        date: asDateString('2025-03-15'),
        confidence: 0.9,
        type: 'start_date'
      };

      const result = validateExtractedDate(date);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(date);
      }
    });

    it('should reject empty text', () => {
      const date: ExtractedDate = {
        text: '',
        date: asDateString('2025-03-15'),
        confidence: 0.9,
        type: 'start_date'
      };

      const result = validateExtractedDate(date);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('日付テキストが必要です');
        expect(result.error.field).toBe('date.text');
      }
    });

    it('should reject invalid date format', () => {
      const date: ExtractedDate = {
        text: '3月15日（金）',
        date: asDateString('2025-3-15'), // 不正な形式
        confidence: 0.9,
        type: 'start_date'
      };

      const result = validateExtractedDate(date);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('日付はYYYY-MM-DD形式で入力してください');
        expect(result.error.field).toBe('date.date');
      }
    });

    it('should reject invalid confidence', () => {
      const date: ExtractedDate = {
        text: '3月15日（金）',
        date: asDateString('2025-03-15'),
        confidence: 1.5, // 不正な値
        type: 'start_date'
      };

      const result = validateExtractedDate(date);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('信頼度は0から1の間で入力してください');
        expect(result.error.field).toBe('date.confidence');
      }
    });
  });

  describe('validateExtractedTime', () => {
    it('should validate valid ExtractedTime', () => {
      const time: ExtractedTime = {
        text: '午前9時30分',
        time: asTimeString('09:30'),
        confidence: 0.85,
        type: 'start_time'
      };

      const result = validateExtractedTime(time);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(time);
      }
    });

    it('should reject empty text', () => {
      const time: ExtractedTime = {
        text: '',
        time: asTimeString('09:30'),
        confidence: 0.85,
        type: 'start_time'
      };

      const result = validateExtractedTime(time);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('時間テキストが必要です');
        expect(result.error.field).toBe('time.text');
      }
    });

    it('should reject invalid time format', () => {
      const time: ExtractedTime = {
        text: '午前9時30分',
        time: asTimeString('9:30'), // 不正な形式
        confidence: 0.85,
        type: 'start_time'
      };

      const result = validateExtractedTime(time);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('時間はHH:MM形式で入力してください');
        expect(result.error.field).toBe('time.time');
      }
    });

    it('should validate boundary time values', () => {
      const validTimes = [
        asTimeString('00:00'),
        asTimeString('12:00'),
        asTimeString('23:59')
      ];

      validTimes.forEach(timeValue => {
        const time: ExtractedTime = {
          text: 'テスト時間',
          time: timeValue,
          confidence: 0.8,
          type: 'start_time'
        };

        const result = validateExtractedTime(time);
        expect(result.isOk()).toBe(true);
      });
    });

    it('should reject invalid time values', () => {
      const invalidTimes = [
        asTimeString('24:00'),
        asTimeString('12:60'),
        asTimeString('25:30')
      ];

      invalidTimes.forEach(timeValue => {
        const time: ExtractedTime = {
          text: 'テスト時間',
          time: timeValue,
          confidence: 0.8,
          type: 'start_time'
        };

        const result = validateExtractedTime(time);
        expect(result.isErr()).toBe(true);
      });
    });
  });

  describe('validateExtractedItem', () => {
    it('should validate valid ExtractedItem', () => {
      const item: ExtractedItem = {
        text: '水筒、帽子、タオル',
        items: ['水筒', '帽子', 'タオル'],
        confidence: 0.88,
        category: 'belongings'
      };

      const result = validateExtractedItem(item);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(item);
      }
    });

    it('should reject empty text', () => {
      const item: ExtractedItem = {
        text: '',
        items: ['水筒', '帽子', 'タオル'],
        confidence: 0.88,
        category: 'belongings'
      };

      const result = validateExtractedItem(item);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('アイテムテキストが必要です');
        expect(result.error.field).toBe('item.text');
      }
    });

    it('should reject empty items array', () => {
      const item: ExtractedItem = {
        text: '水筒、帽子、タオル',
        items: [],
        confidence: 0.88,
        category: 'belongings'
      };

      const result = validateExtractedItem(item);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('少なくとも1つのアイテムが必要です');
        expect(result.error.field).toBe('item.items');
      }
    });
  });

  describe('validateExtractedActivity', () => {
    it('should validate valid ExtractedActivity', () => {
      const activity: ExtractedActivity = {
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
        checklist: [],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(activity);
      }
    });

    it('should reject empty title', () => {
      const activity: ExtractedActivity = {
        title: '',
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
        checklist: [],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('アクティビティタイトルが必要です');
        expect(result.error.field).toBe('activity.title');
      }
    });

    it('should reject invalid date range', () => {
      const activity: ExtractedActivity = {
        title: '遠足',
        description: '動物園への遠足です',
        startDate: asDateString('2025-03-20'), // 終了日より後
        startTime: asTimeString('09:30'),
        endDate: asDateString('2025-03-15'), // 開始日より前
        endTime: asTimeString('15:00'),
        dueDate: undefined,
        isAllDay: false,
        category: 'event',
        priority: 'medium',
        location: '上野動物園',
        checklist: [],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('開始日は終了日より前でなければなりません');
        expect(result.error.field).toBe('activity.dates');
      }
    });

    it('should reject invalid time range on same day', () => {
      const activity: ExtractedActivity = {
        title: '遠足',
        description: '動物園への遠足です',
        startDate: asDateString('2025-03-15'),
        startTime: asTimeString('15:00'), // 終了時間より後
        endDate: asDateString('2025-03-15'),
        endTime: asTimeString('09:30'), // 開始時間より前
        dueDate: undefined,
        isAllDay: false,
        category: 'event',
        priority: 'medium',
        location: '上野動物園',
        checklist: [],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('開始時間は終了時間より前でなければなりません');
        expect(result.error.field).toBe('activity.times');
      }
    });

    it('should allow valid time range on same day', () => {
      const activity: ExtractedActivity = {
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
        checklist: [],
        tags: ['遠足', '学校行事'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isOk()).toBe(true);
    });

    it('should handle different dates with time overlap', () => {
      const activity: ExtractedActivity = {
        title: '宿泊研修',
        description: '2日間の宿泊研修です',
        startDate: asDateString('2025-03-15'),
        startTime: asTimeString('15:00'),
        endDate: asDateString('2025-03-16'), // 翌日
        endTime: asTimeString('09:30'),
        dueDate: undefined,
        isAllDay: false,
        category: 'event',
        priority: 'medium',
        location: '研修施設',
        checklist: [],
        tags: ['研修', '宿泊'],
        confidence: 0.85
      };

      const result = validateExtractedActivity(activity);
      
      expect(result.isOk()).toBe(true); // 異なる日付の場合は時間の逆転も許可
    });
  });

  describe('validateParsedContent', () => {
    it('should validate valid ParsedContent', () => {
      const content: ParsedContent = {
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
          }
        ],
        items: [
          {
            text: '水筒、帽子',
            items: ['水筒', '帽子'],
            confidence: 0.88,
            category: 'belongings'
          }
        ],
        locations: ['上野動物園'],
        notes: ['雨天決行'],
        confidence: 0.87
      };

      const result = validateParsedContent(content);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(content);
      }
    });

    it('should reject invalid nested data', () => {
      const content: ParsedContent = {
        title: '遠足のお知らせ',
        dates: [
          {
            text: '', // 無効な日付
            date: asDateString('2025-03-15'),
            confidence: 0.9,
            type: 'start_date'
          }
        ],
        times: [],
        items: [],
        locations: [],
        notes: [],
        confidence: 0.87
      };

      const result = validateParsedContent(content);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('日付テキストが必要です');
      }
    });
  });
});