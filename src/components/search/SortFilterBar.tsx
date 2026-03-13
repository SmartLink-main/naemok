'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'deadline', label: '마감 임박순' },
  { value: 'latest', label: '최신 등록순' },
  { value: 'amount', label: '금액 높은순' },
] as const

const DEADLINE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '7', label: 'D-7 이내' },
  { value: '30', label: 'D-30 이내' },
  { value: 'closed', label: '마감 포함' },
] as const

export function SortFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort') ?? 'deadline'
  const currentDeadline = searchParams.get('deadline') ?? 'all'

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    params.delete('page')
    params.delete('rpage')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">정렬</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('sort', opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              currentSort === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-muted-foreground border-gray-200 hover:border-blue-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">마감</span>
        {DEADLINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('deadline', opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              currentDeadline === opt.value
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-muted-foreground border-gray-200 hover:border-orange-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
