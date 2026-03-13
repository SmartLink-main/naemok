import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/announcements?industry=음식점&region=서울&stage=소상공인&mode=top10
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const industry = searchParams.get('industry')
  const region = searchParams.get('region')
  const stage = searchParams.get('stage')
  const mode = searchParams.get('mode') // 'top10' | null

  const supabase = await createServerClient()

  // TOP 10 모드
  if (mode === 'top10') {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .eq('is_top10', true)
      .order('top10_score', { ascending: false })
      .limit(10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ announcements: data ?? [] })
  }

  // 검색 모드: 조건에 맞는 공고 조회
  const hasFilter = industry || region || stage

  if (!hasFilter) {
    // 조건 없으면 전체 활성 공고 (최신 마감 임박순)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .order('end_date', { ascending: true, nullsFirst: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ recommended: data ?? [], all: [] })
  }

  // 추천 공고: 입력한 모든 조건에 매칭
  let recommendedQuery = supabase
    .from('announcements')
    .select('*')
    .eq('status', 'active')

  if (industry) recommendedQuery = recommendedQuery.contains('industry_tags', [industry])
  if (region) {
    // 전국 포함 OR 해당 지역
    recommendedQuery = recommendedQuery.or(
      `region_tags.cs.{"전국"},region_tags.cs.{"${region}"}`
    )
  }
  if (stage) recommendedQuery = recommendedQuery.contains('stage_tags', [stage])

  const { data: recommended, error: recErr } = await recommendedQuery
    .order('end_date', { ascending: true, nullsFirst: false })
    .limit(20)

  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 })

  // 전체 공고: 하나 이상 조건 매칭 OR 전체 분류 (태그 없는 공고)
  const conditions: string[] = []
  if (industry) conditions.push(`industry_tags.cs.{"${industry}"}`)
  if (region) conditions.push(`region_tags.cs.{"전국"}`, `region_tags.cs.{"${region}"}`)
  if (stage) conditions.push(`stage_tags.cs.{"${stage}"}`)
  // 태그가 없는 공고 (전체 대상)
  conditions.push('industry_tags.eq.{}')

  const { data: all, error: allErr } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'active')
    .or(conditions.join(','))
    .order('end_date', { ascending: true, nullsFirst: false })
    .limit(50)

  if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 })

  // 추천 공고에 이미 포함된 건 전체 공고에서 제외
  const recommendedIds = new Set((recommended ?? []).map((a) => a.id))
  const filteredAll = (all ?? []).filter((a) => !recommendedIds.has(a.id))

  return NextResponse.json({
    recommended: recommended ?? [],
    all: filteredAll,
  })
}
