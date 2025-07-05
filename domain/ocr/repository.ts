import { Result } from 'neverthrow';
import { 
  OcrResult, 
  OcrQuery, 
  ProcessOcrCommand, 
  ReviewOcrCommand, 
  OcrError 
} from './types';
import { OcrResultId } from '@/domain/shared/branded-types';

/**
 * OCR結果のリポジトリインターフェース
 * Clean Architectureに従い、インフラストラクチャ層で実装される
 */
export interface OcrRepository {
  /**
   * OCR結果を保存
   */
  save(ocrResult: OcrResult): Promise<Result<OcrResult, OcrError>>;

  /**
   * OCR結果を取得
   */
  findById(id: OcrResultId): Promise<Result<OcrResult, OcrError>>;

  /**
   * OCR結果を検索
   */
  findMany(query: OcrQuery): Promise<Result<ReadonlyArray<OcrResult>, OcrError>>;

  /**
   * OCR結果を更新
   */
  update(id: OcrResultId, updates: Partial<OcrResult>): Promise<Result<OcrResult, OcrError>>;

  /**
   * OCR結果を削除
   */
  delete(id: OcrResultId): Promise<Result<void, OcrError>>;

  /**
   * 処理待ちのOCR結果を取得
   */
  findPendingResults(): Promise<Result<ReadonlyArray<OcrResult>, OcrError>>;

  /**
   * レビューが必要なOCR結果を取得
   */
  findResultsNeedingReview(): Promise<Result<ReadonlyArray<OcrResult>, OcrError>>;

  /**
   * 指定した信頼度以下のOCR結果を取得
   */
  findLowConfidenceResults(threshold: number): Promise<Result<ReadonlyArray<OcrResult>, OcrError>>;

  /**
   * 指定した期間のOCR結果を取得
   */
  findByDateRange(startDate: string, endDate: string): Promise<Result<ReadonlyArray<OcrResult>, OcrError>>;

  /**
   * OCR結果の統計情報を取得
   */
  getStatistics(): Promise<Result<OcrStatistics, OcrError>>;
}

/**
 * OCR統計情報
 */
export type OcrStatistics = Readonly<{
  totalResults: number;
  pendingResults: number;
  completedResults: number;
  failedResults: number;
  reviewRequiredResults: number;
  averageConfidence: number;
  processingSuccessRate: number;
  topCategories: ReadonlyArray<{
    category: string;
    count: number;
  }>;
  monthlyProcessingCount: ReadonlyArray<{
    month: string;
    count: number;
  }>;
}>;

/**
 * Vision APIサービスのインターフェース
 * 外部APIとの通信を担当
 */
export interface VisionApiService {
  /**
   * 画像からテキストを抽出
   */
  extractText(imageUrl: string): Promise<Result<VisionApiResult, OcrError>>;

  /**
   * 画像からテキストを抽出（Base64データ）
   */
  extractTextFromBase64(base64Data: string): Promise<Result<VisionApiResult, OcrError>>;

  /**
   * バッチ処理でテキストを抽出
   */
  extractTextBatch(imageUrls: string[]): Promise<Result<ReadonlyArray<VisionApiResult>, OcrError>>;
}

/**
 * Vision API結果
 */
export type VisionApiResult = Readonly<{
  text: string;
  confidence: number;
  detectedLanguage?: string;
  boundingBoxes: ReadonlyArray<{
    text: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}>;

/**
 * 画像ストレージサービスのインターフェース
 * 画像の保存・取得を担当
 */
export interface ImageStorageService {
  /**
   * 画像を保存
   */
  saveImage(imageData: Buffer, filename: string): Promise<Result<string, OcrError>>;

  /**
   * 画像を取得
   */
  getImage(imageId: string): Promise<Result<Buffer, OcrError>>;

  /**
   * 画像のURLを取得
   */
  getImageUrl(imageId: string): Promise<Result<string, OcrError>>;

  /**
   * 画像を削除
   */
  deleteImage(imageId: string): Promise<Result<void, OcrError>>;

  /**
   * 画像のメタデータを取得
   */
  getImageMetadata(imageId: string): Promise<Result<ImageMetadata, OcrError>>;
}

/**
 * 画像メタデータ
 */
export type ImageMetadata = Readonly<{
  filename: string;
  size: number;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}>;