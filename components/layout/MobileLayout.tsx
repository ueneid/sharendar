interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export default function MobileLayout({ children, title, actions }: MobileLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {(title || actions) && (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{title || "Sharendar"}</h1>
          {actions && <div className="flex items-center">{actions}</div>}
        </header>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}