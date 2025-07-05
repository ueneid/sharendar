import { Result, ok, err } from 'neverthrow';
import { 
  OcrResult, 
  ParsedContent, 
  ExtractedDate, 
  ExtractedTime, 
  ExtractedItem, 
  ExtractedActivity,
  ProcessOcrCommand,
  ReviewOcrCommand,
  OcrError
} from './types';
import { 
  asOcrResultId, 
  asOcrImageId, 
  asDateString, 
  asTimeString 
} from '@/domain/shared/branded-types';

/**
 * OCRドメインのバリデーション関数
 */

export const validateProcessOcrCommand = (
  command: ProcessOcrCommand
): Result<ProcessOcrCommand, OcrError> => {
  if (!command.imageId.trim()) {
    return err({
      type: 'ValidationError',
      message: '画像IDが必要です',
      field: 'imageId'
    });
  }

  if (!command.rawText.trim()) {
    return err({
      type: 'ValidationError',
      message: 'テキストが必要です',
      field: 'rawText'
    });
  }

  if (command.confidence < 0 || command.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'confidence'
    });
  }

  return ok(command);
};

export const validateReviewOcrCommand = (
  command: ReviewOcrCommand
): Result<ReviewOcrCommand, OcrError> => {
  if (!command.id.trim()) {
    return err({
      type: 'ValidationError',
      message: 'OCR結果IDが必要です',
      field: 'id'
    });
  }

  return ok(command);
};

export const validateOcrResult = (
  result: OcrResult
): Result<OcrResult, OcrError> => {
  if (result.confidence < 0 || result.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'confidence'
    });
  }

  if (!result.rawText.trim()) {
    return err({
      type: 'ValidationError',
      message: 'テキストが必要です',
      field: 'rawText'
    });
  }

  return ok(result);
};

export const validateParsedContent = (
  content: ParsedContent
): Result<ParsedContent, OcrError> => {
  if (content.confidence < 0 || content.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'confidence'
    });
  }

  // 日付の検証
  for (const date of content.dates) {
    const dateValidation = validateExtractedDate(date);
    if (dateValidation.isErr()) {
      return err(dateValidation.error);
    }
  }

  // 時間の検証
  for (const time of content.times) {
    const timeValidation = validateExtractedTime(time);
    if (timeValidation.isErr()) {
      return err(timeValidation.error);
    }
  }

  // アイテムの検証
  for (const item of content.items) {
    const itemValidation = validateExtractedItem(item);
    if (itemValidation.isErr()) {
      return err(itemValidation.error);
    }
  }

  return ok(content);
};

export const validateExtractedDate = (
  date: ExtractedDate
): Result<ExtractedDate, OcrError> => {
  if (!date.text.trim()) {
    return err({
      type: 'ValidationError',
      message: '日付テキストが必要です',
      field: 'date.text'
    });
  }

  if (date.confidence < 0 || date.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'date.confidence'
    });
  }

  // 日付形式の検証（YYYY-MM-DD）
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date.date)) {
    return err({
      type: 'ValidationError',
      message: '日付はYYYY-MM-DD形式で入力してください',
      field: 'date.date'
    });
  }

  return ok(date);
};

export const validateExtractedTime = (
  time: ExtractedTime
): Result<ExtractedTime, OcrError> => {
  if (!time.text.trim()) {
    return err({
      type: 'ValidationError',
      message: '時間テキストが必要です',
      field: 'time.text'
    });
  }

  if (time.confidence < 0 || time.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'time.confidence'
    });
  }

  // 時間形式の検証（HH:MM）
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timePattern.test(time.time)) {
    return err({
      type: 'ValidationError',
      message: '時間はHH:MM形式で入力してください',
      field: 'time.time'
    });
  }

  return ok(time);
};

export const validateExtractedItem = (
  item: ExtractedItem
): Result<ExtractedItem, OcrError> => {
  if (!item.text.trim()) {
    return err({
      type: 'ValidationError',
      message: 'アイテムテキストが必要です',
      field: 'item.text'
    });
  }

  if (item.confidence < 0 || item.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'item.confidence'
    });
  }

  if (item.items.length === 0) {
    return err({
      type: 'ValidationError',
      message: '少なくとも1つのアイテムが必要です',
      field: 'item.items'
    });
  }

  return ok(item);
};

export const validateExtractedActivity = (
  activity: ExtractedActivity
): Result<ExtractedActivity, OcrError> => {
  if (!activity.title.trim()) {
    return err({
      type: 'ValidationError',
      message: 'アクティビティタイトルが必要です',
      field: 'activity.title'
    });
  }

  if (activity.confidence < 0 || activity.confidence > 1) {
    return err({
      type: 'ValidationError',
      message: '信頼度は0から1の間で入力してください',
      field: 'activity.confidence'
    });
  }

  // 日付の論理的検証
  if (activity.startDate && activity.endDate) {
    const startDate = new Date(activity.startDate);
    const endDate = new Date(activity.endDate);
    
    if (startDate > endDate) {
      return err({
        type: 'ValidationError',
        message: '開始日は終了日より前でなければなりません',
        field: 'activity.dates'
      });
    }
  }

  // 時間の論理的検証（同じ日の場合）
  if (activity.startTime && activity.endTime && 
      activity.startDate === activity.endDate) {
    const startTime = activity.startTime.split(':').map(Number);
    const endTime = activity.endTime.split(':').map(Number);
    
    if (startTime[0] > endTime[0] || 
        (startTime[0] === endTime[0] && startTime[1] >= endTime[1])) {
      return err({
        type: 'ValidationError',
        message: '開始時間は終了時間より前でなければなりません',
        field: 'activity.times'
      });
    }
  }

  return ok(activity);
};