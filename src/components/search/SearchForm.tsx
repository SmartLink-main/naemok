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

const ALL_VALUE = '__all__'

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [industry, setIndustry] = useState<string>(searchParams.get('industry') ?? '')
  const [region, setRegion] = useState<string>(searchParams.get('region') ?? '')
  const [stage, setStage] = useState<string>(searchParams.get('stage') ?? '')

  function handleSearch() {
    const params = new URLSearchParams()
    if (industry && industry !== ALL_VALUE) params.set('industry', industry)
    if (region && region !== ALL_VALUE) params.set('region', region)
    if (stage && stage !== ALL_VALUE) params.set('stage', stage)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">내 조건 입력하면 맞는 지원금 바로 보여드려요</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select value={industry || ALL_VALUE} onValueChange={(v) => setIndustry(v === ALL_VALUE ? '' : v ?? '')}>
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

        <Select value={region || ALL_VALUE} onValueChange={(v) => setRegion(v === ALL_VALUE ? '' : v ?? '')}>
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

        <Select value={stage || ALL_VALUE} onValueChange={(v) => setStage(v === ALL_VALUE ? '' : v ?? '')}>
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
      <Button onClick={handleSearch} className="w-full">
        내 지원금 찾기
      </Button>
    </div>
  )
}
