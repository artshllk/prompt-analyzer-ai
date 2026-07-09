import { MarketingNav } from '@/components/marketing/MarketingNav'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="editorial grain min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav />
      <div className="pt-28 md:pt-36 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
