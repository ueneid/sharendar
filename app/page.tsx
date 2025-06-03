"use client";

import MobileLayout from "@/components/layout/MobileLayout";
import { Calendar, CheckSquare, Upload, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sharendar</h1>
          <p className="text-gray-600">
            家族の予定とタスクを簡単に共有
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/calendar" className="card p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow">
            <Calendar className="w-12 h-12 text-primary-500" />
            <span className="font-medium text-gray-900">カレンダー</span>
            <span className="text-xs text-gray-500 text-center">家族の予定を管理</span>
          </Link>

          <Link href="/tasks" className="card p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow">
            <CheckSquare className="w-12 h-12 text-secondary-500" />
            <span className="font-medium text-gray-900">タスク</span>
            <span className="text-xs text-gray-500 text-center">やることリスト</span>
          </Link>

          <Link href="/ocr" className="card p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow">
            <Upload className="w-12 h-12 text-green-500" />
            <span className="font-medium text-gray-900">OCR読取</span>
            <span className="text-xs text-gray-500 text-center">プリントを撮影</span>
          </Link>

          <div className="card p-6 flex flex-col items-center space-y-3 opacity-50">
            <Users className="w-12 h-12 text-orange-500" />
            <span className="font-medium text-gray-900">家族設定</span>
            <span className="text-xs text-gray-500 text-center">準備中</span>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-3">今日の予定</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">遠足（太郎）</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">体操服準備（花子）</span>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}