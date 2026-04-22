import { clsx } from 'clsx'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl border border-slate-100 shadow-sm p-6', className)}>
      {children}
    </div>
  )
}
