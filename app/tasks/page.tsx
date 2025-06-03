"use client";

import MobileLayout from "@/components/layout/MobileLayout";
import { CheckIcon, ClockIcon, AlertCircleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

type TaskStatus = "pending" | "completed";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string[];
  checklist?: { id: string; title: string; checked: boolean }[];
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "遠足の準備",
    description: "明日の遠足に必要な持ち物を準備する",
    dueDate: "2024-03-15",
    priority: "high",
    status: "pending",
    assignedTo: ["太郎"],
    checklist: [
      { id: "1-1", title: "お弁当", checked: true },
      { id: "1-2", title: "水筒", checked: true },
      { id: "1-3", title: "レジャーシート", checked: false },
      { id: "1-4", title: "おやつ（300円まで）", checked: false },
    ],
  },
  {
    id: "2",
    title: "体操服を洗う",
    description: "",
    dueDate: "2024-03-16",
    priority: "medium",
    status: "pending",
    assignedTo: ["ママ"],
  },
  {
    id: "3",
    title: "習字道具の確認",
    description: "墨汁の残量をチェック",
    dueDate: "2024-03-18",
    priority: "low",
    status: "completed",
    assignedTo: ["花子"],
  },
];

export default function TasksPage() {
  const [tasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return <AlertCircleIcon className="w-4 h-4" />;
      case "medium":
        return <ClockIcon className="w-4 h-4" />;
      case "low":
        return <CheckIcon className="w-4 h-4" />;
    }
  };

  return (
    <MobileLayout title="タスク">
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-4 px-4 py-2">
          <button
            onClick={() => setFilter("all")}
            className={`text-sm font-medium pb-2 border-b-2 ${
              filter === "all"
                ? "text-primary-600 border-primary-600"
                : "text-gray-500 border-transparent"
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`text-sm font-medium pb-2 border-b-2 ${
              filter === "pending"
                ? "text-primary-600 border-primary-600"
                : "text-gray-500 border-transparent"
            }`}
          >
            未完了
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`text-sm font-medium pb-2 border-b-2 ${
              filter === "completed"
                ? "text-primary-600 border-primary-600"
                : "text-gray-500 border-transparent"
            }`}
          >
            完了
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white p-4">
            <div className="flex items-start space-x-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${getPriorityColor(
                  task.priority
                )}`}
              >
                {getPriorityIcon(task.priority)}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    task.status === "completed"
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      期限: {new Date(task.dueDate).toLocaleDateString("ja-JP")}
                    </span>
                  )}
                  <div className="flex -space-x-2">
                    {task.assignedTo.map((person, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full bg-secondary-100 border-2 border-white flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-secondary-700">
                          {person[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {task.checklist && (
                  <div className="mt-3 space-y-1">
                    {task.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          className="w-4 h-4 text-primary-600 rounded"
                          readOnly
                        />
                        <span
                          className={`text-sm ${
                            item.checked
                              ? "text-gray-500 line-through"
                              : "text-gray-700"
                          }`}
                        >
                          {item.title}
                        </span>
                      </label>
                    ))}
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (task.checklist.filter((i) => i.checked).length /
                                task.checklist.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fixed bottom-20 right-4 bg-primary-500 text-white rounded-full p-3 shadow-lg">
        <PlusIcon className="w-6 h-6" />
      </button>
    </MobileLayout>
  );
}