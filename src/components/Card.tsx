export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}
