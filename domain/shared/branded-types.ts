/**
 * Brand型の定義
 * 実行時はただの文字列だが、コンパイル時に型安全性を提供
 */

// Brand Types
export type MemberId = string & { readonly brand: unique symbol };
export type EventId = string & { readonly brand: unique symbol };
export type TaskId = string & { readonly brand: unique symbol };
export type ActivityId = string & { readonly brand: unique symbol }; // 統一ドメイン
export type DateString = string & { readonly brand: unique symbol }; // YYYY-MM-DD
export type TimeString = string & { readonly brand: unique symbol }; // HH:MM

// Value Objects
export type MemberName = string & { readonly brand: unique symbol };
export type EventTitle = string & { readonly brand: unique symbol };
export type TaskTitle = string & { readonly brand: unique symbol };
export type ActivityTitle = string & { readonly brand: unique symbol }; // 統一ドメイン
export type Color = string & { readonly brand: unique symbol };

// Type assertions (unsafe - use smart constructors instead)
export const asMemberId = (value: string): MemberId => value as MemberId;
export const asEventId = (value: string): EventId => value as EventId;
export const asTaskId = (value: string): TaskId => value as TaskId;
export const asDateString = (value: string): DateString => value as DateString;
export const asTimeString = (value: string): TimeString => value as TimeString;
export const asMemberName = (value: string): MemberName => value as MemberName;
export const asEventTitle = (value: string): EventTitle => value as EventTitle;
export const asTaskTitle = (value: string): TaskTitle => value as TaskTitle;
export const asActivityId = (value: string): ActivityId => value as ActivityId;
export const asActivityTitle = (value: string): ActivityTitle => value as ActivityTitle;
export const asColor = (value: string): Color => value as Color;