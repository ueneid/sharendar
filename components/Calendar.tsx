"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { ja } from "date-fns/locale";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "event" | "task";
  color?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

export default function Calendar({ events = [], onDateClick, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button onClick={handlePrevMonth} className="p-2">
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, "yyyy年 M月", { locale: ja })}
        </h2>
        <button onClick={handleNextMonth} className="p-2">
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs py-2 ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-700"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square border-r border-b border-gray-100" />
        ))}

        {days.map((day) => {
          const dayOfWeek = getDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={day.toISOString()}
              className={`aspect-square border-r border-b border-gray-100 p-1 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? "bg-gray-50" : ""
              } ${isSelected ? "ring-2 ring-primary-500" : ""}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className="h-full flex flex-col">
                <span
                  className={`text-xs ${
                    isTodayDate
                      ? "bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      : dayOfWeek === 0
                      ? "text-red-500"
                      : dayOfWeek === 6
                      ? "text-blue-500"
                      : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="flex-1 mt-1 overflow-hidden">
                  <div className="text-xs space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`${
                          event.type === "event"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        } rounded px-1 py-0.5 truncate text-[10px]`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-500 text-center">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}