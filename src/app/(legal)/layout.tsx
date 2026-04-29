import { PublicNav } from '@/components/ui/PublicNav'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <PublicNav />
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
