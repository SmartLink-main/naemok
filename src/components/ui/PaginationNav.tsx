import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationNavProps {
  currentPage: number
  totalPages: number
  paramName: string
  searchParams: Record<string, string | undefined>
}

export function PaginationNav({ currentPage, totalPages, paramName, searchParams }: PaginationNavProps) {
  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v)
    }
    params.set(paramName, String(page))
    return `/search?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
            이전
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={buildUrl(currentPage + 1)}>
          <Button variant="outline" size="sm">
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          다음
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
