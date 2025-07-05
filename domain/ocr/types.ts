import { 
  OcrResultId, 
  OcrImageId, 
  ActivityId, 
  DateString, 
  TimeString 
} from '@/domain/shared/branded-types';
import { ActivityCategory, ActivityPriority } from '@/domain/activity/types';

/**
 * OCRドメインモデル
 * 日本語テキスト解析とActivity生成を担当
 */

// === Core Entity ===

export type OcrResult = Readonly<{
  id: OcrResultId;
  imageId: OcrImageId;
  rawText: string;
  confidence: number; // 0-1の信頼度スコア
  parsedContent: ParsedContent;
  extractedActivities: ReadonlyArray<ExtractedActivity>;
  processingStatus: OcrProcessingStatus;
  createdAt: DateString;
  updatedAt: DateString;
}>;

// === Parsing Models ===

export type ParsedContent = Readonly<{
  title?: string;
  dates: ReadonlyArray<ExtractedDate>;
  times: ReadonlyArray<ExtractedTime>;
  items: ReadonlyArray<ExtractedItem>;
  locations: ReadonlyArray<string>;
  notes: ReadonlyArray<string>;
  confidence: number;
}>;

export type ExtractedDate = Readonly<{
  text: string; // 元のテキスト（例：「3月15日（金）」）
  date: DateString; // 正規化された日付（例：「2025-03-15」）
  confidence: number;
  type: DateType;
}>;

export type ExtractedTime = Readonly<{
  text: string; // 元のテキスト（例：「午前9時30分」）
  time: TimeString; // 正規化された時間（例：「09:30」）
  confidence: number;
  type: TimeType;
}>;

export type ExtractedItem = Readonly<{
  text: string; // 元のテキスト（例：「水筒、帽子、タオル」）
  items: ReadonlyArray<string>; // 分解されたアイテム（例：["水筒", "帽子", "タオル"]）
  confidence: number;
  category: ItemCategory;
}>;

export type ExtractedActivity = Readonly<{
  title: string;
  description?: string;
  startDate?: DateString;
  startTime?: TimeString;
  endDate?: DateString;
  endTime?: TimeString;
  dueDate?: DateString;
  isAllDay: boolean;
  category: ActivityCategory;
  priority: ActivityPriority;
  location?: string;
  checklist: ReadonlyArray<ChecklistItem>;
  tags: ReadonlyArray<string>;
  confidence: number;
}>;

// === Supporting Types ===

export type OcrProcessingStatus = 
  | 'pending'      // 処理待ち
  | 'processing'   // 処理中
  | 'completed'    // 処理完了
  | 'failed'       // 処理失敗
  | 'needs_review'; // 要レビュー（信頼度低い）

export type DateType = 
  | 'start_date'   // 開始日
  | 'end_date'     // 終了日
  | 'due_date'     // 期限日
  | 'reference';   // 参照日（文脈で判断）

export type TimeType = 
  | 'start_time'   // 開始時間
  | 'end_time'     // 終了時間
  | 'deadline'     // 締切時間
  | 'reference';   // 参照時間

export type ItemCategory = 
  | 'belongings'   // 持ち物
  | 'materials'    // 教材・資料
  | 'clothing'     // 服装
  | 'food'         // 食べ物
  | 'documents'    // 書類
  | 'other';       // その他

export type ChecklistItem = Readonly<{
  id: string;
  title: string;
  checked: boolean;
  category: ItemCategory;
}>;

// === Command Types ===

export type ProcessOcrCommand = Readonly<{
  imageId: string;
  rawText: string;
  confidence: number;
}>;

export type ReviewOcrCommand = Readonly<{
  id: string;
  correctedContent: ParsedContent;
  approvedActivities: ReadonlyArray<string>; // ExtractedActivity IDs
}>;

// === Query Types ===

export type OcrQuery = Readonly<{
  imageIds?: ReadonlyArray<string>;
  status?: OcrProcessingStatus;
  confidenceThreshold?: number;
  dateRange?: {
    start: DateString;
    end: DateString;
  };
}>;

// === Error Types ===

export type OcrError = 
  | { type: 'ValidationError'; message: string; field?: string }
  | { type: 'NotFoundError'; message: string; id: OcrResultId }
  | { type: 'ProcessingError'; message: string; details?: any }
  | { type: 'ParseError'; message: string; text: string }
  | { type: 'ConversionError'; message: string; reason: string }
  | { type: 'DatabaseError'; message: string };

// === Parser Configuration ===

export type OcrParserConfig = Readonly<{
  dateFormats: ReadonlyArray<string>; // 日付形式パターン
  timeFormats: ReadonlyArray<string>; // 時間形式パターン
  keywords: OcrKeywords;
  confidenceThresholds: ConfidenceThresholds;
}>;

export type OcrKeywords = Readonly<{
  activities: ReadonlyArray<string>; // 活動キーワード（遠足、保護者会など）
  belongings: ReadonlyArray<string>; // 持ち物キーワード
  locations: ReadonlyArray<string>; // 場所キーワード
  timeMarkers: ReadonlyArray<string>; // 時間マーカー（から、まで等）
  priorities: ReadonlyArray<string>; // 優先度キーワード
}>;

export type ConfidenceThresholds = Readonly<{
  minAcceptable: number; // 最低受容レベル
  reviewRequired: number; // レビュー必要レベル
  autoApprove: number; // 自動承認レベル
}>;

// === Vision API Integration Types ===

export type VisionApiResponse = Readonly<{
  textAnnotations: ReadonlyArray<TextAnnotation>;
  fullTextAnnotation?: FullTextAnnotation;
}>;

export type TextAnnotation = Readonly<{
  description: string;
  boundingPoly: BoundingPoly;
  locale?: string;
}>;

export type FullTextAnnotation = Readonly<{
  text: string;
  pages: ReadonlyArray<Page>;
}>;

export type BoundingPoly = Readonly<{
  vertices: ReadonlyArray<Vertex>;
}>;

export type Vertex = Readonly<{
  x: number;
  y: number;
}>;

export type Page = Readonly<{
  blocks: ReadonlyArray<Block>;
  confidence: number;
}>;

export type Block = Readonly<{
  paragraphs: ReadonlyArray<Paragraph>;
  boundingBox: BoundingPoly;
  confidence: number;
}>;

export type Paragraph = Readonly<{
  words: ReadonlyArray<Word>;
  boundingBox: BoundingPoly;
  confidence: number;
}>;

export type Word = Readonly<{
  symbols: ReadonlyArray<Symbol>;
  boundingBox: BoundingPoly;
  confidence: number;
}>;

export type Symbol = Readonly<{
  text: string;
  boundingBox: BoundingPoly;
  confidence: number;
}>;