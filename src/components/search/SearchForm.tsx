'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { INDUSTRIES, REGIONS, STAGES } from '@/constants/filters'
import { Sparkles, SlidersHorizontal, Loader2 } from 'lucide-react'

const ALL_VALUE = '__all__'

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<'filter' | 'ai'>('filter')
  const [industry, setIndustry] = useState<string>(searchParams.get('industry') ?? '')
  const [region, setRegion] = useState<string>(searchParams.get('region') ?? '')
  const [stage, setStage] = useState<string>(searchParams.get('stage') ?? '')
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  function handleFilterSearch() {
    const params = new URLSearchParams()
    if (industry && industry !== ALL_VALUE) params.set('industry', industry)
    if (region && region !== ALL_VALUE) params.set('region', region)
    if (stage && stage !== ALL_VALUE) params.set('stage', stage)
    router.push(`/search?${params.toString()}`)
  }

  async function handleAiSearch() {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiError('')

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error ?? 'AI 분석 실패')
        setAiLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (data.industry) params.set('industry', data.industry)
      if (data.region) params.set('region', data.region)
      if (data.stage) params.set('stage', data.stage)
      router.push(`/search?${params.toString()}`)
    } catch {
      setAiError('네트워크 오류가 발생했습니다.')
      setAiLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
      {/* 모드 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setMode('filter')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-all ${
            mode === 'filter' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          조건 선택
        </button>
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-all ${
            mode === 'ai' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI 추천
        </button>
      </div>

      {mode === 'filter' ? (
        <>
          <p className="text-sm font-medium text-muted-foreground">내 조건 입력하면 맞는 지원금 바로 보여드려요</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={industry || ALL_VALUE} onValueChange={(v) => setIndustry(v === ALL_VALUE ? '' : (v ?? ''))}>
              <SelectTrigger>
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>전체 업종</SelectItem>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={region || ALL_VALUE} onValueChange={(v) => setRegion(v === ALL_VALUE ? '' : (v ?? ''))}>
              <SelectTrigger>
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>전체 지역</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stage || ALL_VALUE} onValueChange={(v) => setStage(v === ALL_VALUE ? '' : (v ?? ''))}>
              <SelectTrigger>
                <SelectValue placeholder="사업 단계" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>전체 단계</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleFilterSearch} className="w-full">
            내 지원금 찾기
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground">어떤 사업을 하고 있는지 자유롭게 입력하세요</p>
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAiSearch()
              }
            }}
            placeholder="예: 서울에서 카페 운영한 지 2년 됐어요"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={aiLoading}
          />
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          <Button onClick={handleAiSearch} className="w-full gap-2" disabled={aiLoading || !aiQuery.trim()}>
            {aiLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />AI 분석 중...</>
            ) : (
              <><Sparkles className="w-4 h-4" />AI로 지원금 찾기</>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
