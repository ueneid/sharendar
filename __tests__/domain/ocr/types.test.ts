import { describe, it, expect } from 'vitest';
import { 
  OcrResult, 
  ParsedContent, 
  ExtractedDate, 
  ExtractedTime, 
  ExtractedItem, 
  ExtractedActivity,
  OcrProcessingStatus,
  DateType,
  TimeType,
  ItemCategory,
  ChecklistItem,
  OcrError,
  OcrKeywords,
  ConfidenceThresholds
} from '@/domain/ocr/types';
import { 
  asOcrResultId, 
  asOcrImageId, 
  asDateString, 
  asTimeString 
} from '@/domain/shared/branded-types';

describe('OCR Domain Models', () => {
  describe('OcrResult', () => {
    it('should create valid OcrResult with all required fields', () => {
      const ocrResult: OcrResult = {
        id: asOcrResultId('test-ocr-1'),
        imageId: asOcrImageId('test-image-1'),
        rawText: '遠足のお知らせ\n日時：3月15日（金）午前9時30分〜午後3時\n持ち物：水筒、帽子、タオル',
        confidence: 0.95,
        parsedContent: {
          title: '遠足のお知らせ',
          dates: [],
          times: [],
          items: [],
          locations: [],
          notes: [],
          confidence: 0.95
        },
        extractedActivities: [],
        processingStatus: 'completed',
        createdAt: asDateString('2025-07-05'),
        updatedAt: asDateString('2025-07-05')
      };

      expect(ocrResult.id).toBe('test-ocr-1');
      expect(ocrResult.confidence).toBe(0.95);
      expect(ocrResult.processingStatus).toBe('completed');
      expect(ocrResult.rawText).toContain('遠足のお知らせ');
    });

    it('should handle empty extracted activities', () => {
      const ocrResult: OcrResult = {
        id: asOcrResultId('test-ocr-2'),
        imageId: asOcrImageId('test-image-2'),
        rawText: '読み取れないテキスト',
        confidence: 0.3,
        parsedContent: {
          title: undefined,
          dates: [],
          times: [],
          items: [],
          locations: [],
          notes: [],
          confidence: 0.3
        },
        extractedActivities: [],
        processingStatus: 'needs_review',
        createdAt: asDateString('2025-07-05'),
        updatedAt: asDateString('2025-07-05')
      };

      expect(ocrResult.processingStatus).toBe('needs_review');
      expect(ocrResult.extractedActivities).toHaveLength(0);
      expect(ocrResult.parsedContent.title).toBeUndefined();
    });
  });

  describe('ParsedContent', () => {
    it('should parse school document content correctly', () => {
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
        locations: ['学校', '動物園'],
        notes: ['雨天決行', '昼食は各自持参'],
        confidence: 0.87
      };

      expect(parsedContent.title).toBe('遠足のお知らせ');
      expect(parsedContent.dates).toHaveLength(1);
      expect(parsedContent.dates[0].date).toBe('2025-03-15');
      expect(parsedContent.times).toHaveLength(2);
      expect(parsedContent.times[0].time).toBe('09:30');
      expect(parsedContent.times[1].time).toBe('15:00');
      expect(parsedContent.items[0].items).toEqual(['水筒', '帽子', 'タオル']);
      expect(parsedContent.locations).toContain('動物園');
      expect(parsedContent.notes).toContain('雨天決行');
    });

    it('should handle parent-teacher conference content', () => {
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

      expect(parsedContent.title).toBe('保護者会のご案内');
      expect(parsedContent.items[0].category).toBe('materials');
      expect(parsedContent.locations[0]).toBe('第1会議室');
    });
  });

  describe('ExtractedDate', () => {
    it('should extract various Japanese date formats', () => {
      const dateFormats: ExtractedDate[] = [
        {
          text: '3月15日（金）',
          date: asDateString('2025-03-15'),
          confidence: 0.9,
          type: 'start_date'
        },
        {
          text: '令和7年4月1日',
          date: asDateString('2025-04-01'),
          confidence: 0.88,
          type: 'start_date'
        },
        {
          text: '2025年5月10日',
          date: asDateString('2025-05-10'),
          confidence: 0.95,
          type: 'due_date'
        }
      ];

      expect(dateFormats[0].text).toBe('3月15日（金）');
      expect(dateFormats[0].date).toBe('2025-03-15');
      expect(dateFormats[1].text).toBe('令和7年4月1日');
      expect(dateFormats[1].date).toBe('2025-04-01');
      expect(dateFormats[2].type).toBe('due_date');
    });
  });

  describe('ExtractedTime', () => {
    it('should extract various Japanese time formats', () => {
      const timeFormats: ExtractedTime[] = [
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
        },
        {
          text: '13:45',
          time: asTimeString('13:45'),
          confidence: 0.95,
          type: 'start_time'
        }
      ];

      expect(timeFormats[0].text).toBe('午前9時30分');
      expect(timeFormats[0].time).toBe('09:30');
      expect(timeFormats[1].text).toBe('午後3時');
      expect(timeFormats[1].time).toBe('15:00');
      expect(timeFormats[2].time).toBe('13:45');
    });
  });

  describe('ExtractedItem', () => {
    it('should categorize items correctly', () => {
      const items: ExtractedItem[] = [
        {
          text: '水筒、帽子、タオル',
          items: ['水筒', '帽子', 'タオル'],
          confidence: 0.88,
          category: 'belongings'
        },
        {
          text: '教科書、ノート、筆記用具',
          items: ['教科書', 'ノート', '筆記用具'],
          confidence: 0.9,
          category: 'materials'
        },
        {
          text: '体操服、運動靴',
          items: ['体操服', '運動靴'],
          confidence: 0.85,
          category: 'clothing'
        },
        {
          text: 'おにぎり、お茶',
          items: ['おにぎり', 'お茶'],
          confidence: 0.82,
          category: 'food'
        }
      ];

      expect(items[0].category).toBe('belongings');
      expect(items[1].category).toBe('materials');
      expect(items[2].category).toBe('clothing');
      expect(items[3].category).toBe('food');
      expect(items[0].items).toEqual(['水筒', '帽子', 'タオル']);
    });
  });

  describe('ExtractedActivity', () => {
    it('should create activity from school trip document', () => {
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
        location: '動物園',
        checklist: [
          {
            id: 'item-1',
            title: '水筒',
            checked: false,
            category: 'belongings'
          },
          {
            id: 'item-2',
            title: '帽子',
            checked: false,
            category: 'belongings'
          }
        ],
        tags: ['学校行事', '遠足'],
        confidence: 0.85
      };

      expect(activity.title).toBe('遠足');
      expect(activity.category).toBe('event');
      expect(activity.startDate).toBe('2025-03-15');
      expect(activity.startTime).toBe('09:30');
      expect(activity.endTime).toBe('15:00');
      expect(activity.location).toBe('動物園');
      expect(activity.checklist).toHaveLength(2);
      expect(activity.checklist[0].title).toBe('水筒');
      expect(activity.tags).toContain('学校行事');
    });

    it('should create activity from parent-teacher conference document', () => {
      const activity: ExtractedActivity = {
        title: '保護者会',
        description: '第1学期の保護者会です',
        startDate: asDateString('2025-04-20'),
        startTime: asTimeString('14:00'),
        endDate: asDateString('2025-04-20'),
        endTime: asTimeString('16:00'),
        dueDate: undefined,
        isAllDay: false,
        category: 'meeting',
        priority: 'high',
        location: '第1会議室',
        checklist: [
          {
            id: 'item-1',
            title: '筆記用具',
            checked: false,
            category: 'materials'
          },
          {
            id: 'item-2',
            title: '出席確認書',
            checked: false,
            category: 'documents'
          }
        ],
        tags: ['保護者会', '会議'],
        confidence: 0.89
      };

      expect(activity.title).toBe('保護者会');
      expect(activity.category).toBe('meeting');
      expect(activity.priority).toBe('high');
      expect(activity.checklist[1].category).toBe('documents');
    });
  });

  describe('OcrProcessingStatus', () => {
    it('should validate processing status values', () => {
      const validStatuses: OcrProcessingStatus[] = [
        'pending',
        'processing',
        'completed',
        'failed',
        'needs_review'
      ];

      validStatuses.forEach(status => {
        const result: OcrProcessingStatus = status;
        expect(result).toBe(status);
      });
    });
  });

  describe('DateType and TimeType', () => {
    it('should categorize date and time types correctly', () => {
      const dateTypes: DateType[] = ['start_date', 'end_date', 'due_date', 'reference'];
      const timeTypes: TimeType[] = ['start_time', 'end_time', 'deadline', 'reference'];

      expect(dateTypes).toContain('start_date');
      expect(dateTypes).toContain('due_date');
      expect(timeTypes).toContain('start_time');
      expect(timeTypes).toContain('deadline');
    });
  });

  describe('ItemCategory', () => {
    it('should categorize items appropriately', () => {
      const categories: ItemCategory[] = [
        'belongings',
        'materials',
        'clothing',
        'food',
        'documents',
        'other'
      ];

      expect(categories).toContain('belongings');
      expect(categories).toContain('materials');
      expect(categories).toContain('documents');
    });
  });

  describe('ChecklistItem', () => {
    it('should create checklist items with proper structure', () => {
      const checklistItem: ChecklistItem = {
        id: 'item-1',
        title: '水筒',
        checked: false,
        category: 'belongings'
      };

      expect(checklistItem.id).toBe('item-1');
      expect(checklistItem.title).toBe('水筒');
      expect(checklistItem.checked).toBe(false);
      expect(checklistItem.category).toBe('belongings');
    });
  });

  describe('OcrError', () => {
    it('should create various error types', () => {
      const validationError: OcrError = {
        type: 'ValidationError',
        message: '入力データが無効です',
        field: 'rawText'
      };

      const notFoundError: OcrError = {
        type: 'NotFoundError',
        message: 'OCR結果が見つかりません',
        id: asOcrResultId('test-ocr-1')
      };

      const processingError: OcrError = {
        type: 'ProcessingError',
        message: 'OCR処理中にエラーが発生しました',
        details: { code: 'VISION_API_ERROR' }
      };

      const parseError: OcrError = {
        type: 'ParseError',
        message: 'テキストの解析に失敗しました',
        text: '解析できないテキスト'
      };

      expect(validationError.type).toBe('ValidationError');
      expect(notFoundError.type).toBe('NotFoundError');
      expect(processingError.type).toBe('ProcessingError');
      expect(parseError.type).toBe('ParseError');
    });
  });

  describe('OcrKeywords', () => {
    it('should define Japanese keywords for text parsing', () => {
      const keywords: OcrKeywords = {
        activities: ['遠足', '保護者会', '運動会', '授業参観', '修学旅行'],
        belongings: ['水筒', '帽子', 'タオル', '筆記用具', '体操服'],
        locations: ['学校', '体育館', '運動場', '図書館', '会議室'],
        timeMarkers: ['から', 'まで', '～', '開始', '終了'],
        priorities: ['重要', '至急', '必須', '任意', '推奨']
      };

      expect(keywords.activities).toContain('遠足');
      expect(keywords.activities).toContain('保護者会');
      expect(keywords.belongings).toContain('水筒');
      expect(keywords.belongings).toContain('筆記用具');
      expect(keywords.locations).toContain('学校');
      expect(keywords.timeMarkers).toContain('から');
      expect(keywords.priorities).toContain('重要');
    });
  });

  describe('ConfidenceThresholds', () => {
    it('should define confidence thresholds for processing decisions', () => {
      const thresholds: ConfidenceThresholds = {
        minAcceptable: 0.5,
        reviewRequired: 0.7,
        autoApprove: 0.9
      };

      expect(thresholds.minAcceptable).toBe(0.5);
      expect(thresholds.reviewRequired).toBe(0.7);
      expect(thresholds.autoApprove).toBe(0.9);
      expect(thresholds.minAcceptable).toBeLessThan(thresholds.reviewRequired);
      expect(thresholds.reviewRequired).toBeLessThan(thresholds.autoApprove);
    });
  });
});

describe('OCR Real-world Scenarios', () => {
  describe('School Trip Document Processing', () => {
    it('should process complete school trip document', () => {
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
        ・緊急時連絡先：03-1234-5678
      `;

      const expectedParsedContent: ParsedContent = {
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
            text: '水筒、帽子、タオル、昼食',
            items: ['水筒', '帽子', 'タオル', '昼食'],
            confidence: 0.88,
            category: 'belongings'
          }
        ],
        locations: ['上野動物園', '学校正門'],
        notes: ['雨天決行', '保護者の同伴不可', '緊急時連絡先：03-1234-5678'],
        confidence: 0.85
      };

      expect(expectedParsedContent.title).toBe('遠足のお知らせ');
      expect(expectedParsedContent.dates[0].date).toBe('2025-03-15');
      expect(expectedParsedContent.times[0].time).toBe('09:30');
      expect(expectedParsedContent.times[1].time).toBe('15:00');
      expect(expectedParsedContent.items[0].items).toContain('水筒');
      expect(expectedParsedContent.locations).toContain('上野動物園');
      expect(expectedParsedContent.notes).toContain('雨天決行');
    });
  });

  describe('Parent-Teacher Conference Document Processing', () => {
    it('should process parent-teacher conference document', () => {
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

      const expectedActivity: ExtractedActivity = {
        title: '保護者会',
        description: '第1学期の保護者会です',
        startDate: asDateString('2025-04-20'),
        startTime: asTimeString('14:00'),
        endDate: asDateString('2025-04-20'),
        endTime: asTimeString('16:00'),
        dueDate: undefined,
        isAllDay: false,
        category: 'meeting',
        priority: 'high',
        location: '第1会議室',
        checklist: [
          {
            id: 'item-1',
            title: '筆記用具',
            checked: false,
            category: 'materials'
          },
          {
            id: 'item-2',
            title: '出席確認書',
            checked: false,
            category: 'documents'
          },
          {
            id: 'item-3',
            title: '前回の資料',
            checked: false,
            category: 'documents'
          }
        ],
        tags: ['保護者会', '会議'],
        confidence: 0.89
      };

      expect(expectedActivity.title).toBe('保護者会');
      expect(expectedActivity.category).toBe('meeting');
      expect(expectedActivity.priority).toBe('high');
      expect(expectedActivity.checklist).toHaveLength(3);
      expect(expectedActivity.checklist[0].category).toBe('materials');
      expect(expectedActivity.checklist[1].category).toBe('documents');
    });
  });

  describe('Homework Assignment Document Processing', () => {
    it('should process homework assignment document', () => {
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

      const expectedActivity: ExtractedActivity = {
        title: '国語の宿題',
        description: '漢字練習帳、読書感想文、音読練習',
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
            title: '漢字練習帳 p.15-20',
            checked: false,
            category: 'materials'
          },
          {
            id: 'item-2',
            title: '読書感想文（400字以内）',
            checked: false,
            category: 'materials'
          },
          {
            id: 'item-3',
            title: '音読練習（毎日）',
            checked: false,
            category: 'materials'
          }
        ],
        tags: ['宿題', '国語'],
        confidence: 0.82
      };

      expect(expectedActivity.title).toBe('国語の宿題');
      expect(expectedActivity.category).toBe('task');
      expect(expectedActivity.dueDate).toBe('2025-05-10');
      expect(expectedActivity.isAllDay).toBe(true);
      expect(expectedActivity.checklist).toHaveLength(3);
      expect(expectedActivity.tags).toContain('宿題');
      expect(expectedActivity.tags).toContain('国語');
    });
  });
});