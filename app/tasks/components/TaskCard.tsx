'use client';

import React from 'react';
import { Clock, Users, FileText, Edit2, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Task } from '@/domain/tasks/types';
import { useFamilyMembers } from '@/lib/store';
import { useTaskStore } from '@/lib/store/tasks-store';
import { format, isPast } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  showDate?: boolean;
}

export const TaskCard = ({ task, compact = false, showDate = false }: TaskCardProps) => {
  const { openTaskForm, deleteTask, completeTask, reopenTask, selectTask, getTaskProgress } = useTaskStore();
  const familyMembers = useFamilyMembers();

  const assignedMembers = task.memberIds
    .map(id => familyMembers.find(member => member.id === id))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  const progress = getTaskProgress(task.id);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status === 'pending';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openTaskForm(task);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${task.title}」を削除しますか？`)) {
      await deleteTask(task.id);
    }
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed') {
      await reopenTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleClick = () => {
    selectTask(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50';
      case 'medium': return 'border-l-yellow-400 bg-yellow-50';
      case 'low': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusStyle = task.status === 'completed' 
    ? 'opacity-60 bg-gray-100 border-l-gray-300' 
    : getPriorityColor(task.priority);

  if (compact) {
    return (
      <div
        className={`p-3 rounded cursor-pointer hover:shadow-md transition-shadow border-l-4 ${statusStyle}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={handleToggleComplete}
              className="mr-3 flex-shrink-0"
              aria-label={task.status === 'completed' ? '未完了に戻す' : '完了にする'}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </p>
              
              <div className="flex items-center space-x-2 mt-1">
                {task.dueDate && (
                  <div className={`flex items-center text-xs ${
                    isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(task.dueDate), 'M/d', { locale: ja })}
                  </div>
                )}
                
                {progress.total > 0 && (
                  <div className="text-xs text-gray-500">
                    {progress.completed}/{progress.total}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {assignedMembers.length > 0 && (
            <div className="flex -space-x-1 ml-2">
              {assignedMembers.slice(0, 2).map((member) => (
                <div
                  key={member.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ring-2 ring-white"
                  style={{ backgroundColor: member.color }}
                  title={member.name}
                >
                  {member.avatar || member.name.charAt(0)}
                </div>
              ))}
              {assignedMembers.length > 2 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] ring-2 ring-white">
                  +{assignedMembers.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${statusStyle}`}
      onClick={handleClick}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={handleToggleComplete}
            className="mt-0.5 flex-shrink-0"
            aria-label={task.status === 'completed' ? '未完了に戻す' : '完了にする'}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400" />
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`font-medium ${
              task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>
            
            {showDate && task.createdAt && (
              <p className="text-sm text-gray-600 mt-1">
                作成日: {format(new Date(task.createdAt), 'M月d日', { locale: ja })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
            aria-label="編集"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-2">
        {/* 期限 */}
        {task.dueDate && (
          <div className={`flex items-center text-sm ${
            isOverdue ? 'text-red-600' : 'text-gray-600'
          }`}>
            {isOverdue && <AlertCircle className="w-4 h-4 mr-2" />}
            <Clock className="w-4 h-4 mr-2" />
            <span>
              期限: {format(new Date(task.dueDate), 'M月d日(E)', { locale: ja })}
              {isOverdue && ' (期限切れ)'}
            </span>
          </div>
        )}

        {/* 担当者 */}
        {assignedMembers.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex items-center space-x-2">
              {assignedMembers.map((member) => (
                <div key={member.id} className="flex items-center">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mr-1"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar || member.name.charAt(0)}
                  </div>
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* プログレス */}
        {progress.total > 0 && (
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <span>進捗: {progress.completed}/{progress.total} 完了</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* メモ */}
        {task.memo && (
          <div className="flex items-start text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2 mt-0.5" />
            <p className="break-words">{task.memo}</p>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          getPriorityBadge(task.priority)
        }`}>
          {task.priority === 'high' && '高優先度'}
          {task.priority === 'medium' && '中優先度'}
          {task.priority === 'low' && '低優先度'}
        </span>
        
        {task.status === 'completed' && task.completedAt && (
          <span className="text-xs text-gray-500">
            完了: {format(new Date(task.completedAt), 'M/d', { locale: ja })}
          </span>
        )}
      </div>
    </div>
  );
};