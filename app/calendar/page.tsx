"use client";

import MobileLayout from "@/components/layout/MobileLayout";
import Calendar, { CalendarEvent } from "@/components/Calendar";
import ShareModal from "@/components/ShareModal";
import { PlusIcon, Share2 } from "lucide-react";
import { useState } from "react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "遠足",
      date: new Date(2024, 2, 15),
      type: "event",
    },
    {
      id: "2",
      title: "持ち物: 弁当",
      date: new Date(2024, 2, 15),
      type: "task",
    },
    {
      id: "3",
      title: "保護者会",
      date: new Date(2024, 2, 20),
      type: "event",
    },
    {
      id: "4",
      title: "体操服準備",
      date: new Date(2024, 2, 22),
      type: "task",
    },
  ];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <MobileLayout
      actions={
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Share2 className="w-5 h-5" />
        </button>
      }
    >
      <Calendar
        events={mockEvents}
        onDateClick={handleDateClick}
        selectedDate={selectedDate}
      />
      
      <button className="fixed bottom-20 right-4 bg-primary-500 text-white rounded-full p-3 shadow-lg">
        <PlusIcon className="w-6 h-6" />
      </button>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl="https://sharendar.app/family/abc123/calendar"
        title="家族カレンダー"
      />
    </MobileLayout>
  );
}