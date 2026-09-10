export function LoadingSpinner({ message = "Memuat data..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
      </div>
    </div>
  );
}
