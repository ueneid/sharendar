"use client";

import MobileLayout from "@/components/layout/MobileLayout";
import { CameraIcon, UploadIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function OCRPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <MobileLayout title="プリント読み取り">
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-medium text-gray-900 mb-3">
            学校のプリントを撮影
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            プリントを撮影すると、日付や持ち物を自動で読み取ってカレンダーに登録できます
          </p>

          {!selectedImage ? (
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors">
                  <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    タップして撮影
                  </p>
                </div>
              </label>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center space-x-2 text-primary-600 cursor-pointer">
                  <UploadIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    ギャラリーから選択
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="relative w-full h-64">
                  <Image
                    src={selectedImage}
                    alt="アップロードされた画像"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-sm mt-2">解析中...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  撮り直す
                </button>
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  読み取る
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">最近の読み取り</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <FileTextIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  遠足のお知らせ
                </p>
                <p className="text-xs text-gray-500">2024/03/10 読み取り</p>
                <div className="mt-1 space-y-1">
                  <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    3/15 遠足
                  </span>
                  <span className="inline-block text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded ml-1">
                    持ち物: お弁当
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileTextIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  保護者会のご案内
                </p>
                <p className="text-xs text-gray-500">2024/03/08 読み取り</p>
                <div className="mt-1">
                  <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    3/20 保護者会
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}