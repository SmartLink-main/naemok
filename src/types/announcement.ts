export type AnnouncementStatus = 'active' | 'closed'

export interface Announcement {
  id: string
  bizinfo_id: string
  title: string
  organization: string | null
  amount_min: number | null
  amount_max: number | null
  amount_text: string | null
  start_date: string | null
  end_date: string | null
  status: AnnouncementStatus
  industry_tags: string[]
  region_tags: string[]
  stage_tags: string[]
  summary: string | null
  original_url: string | null
  is_top10: boolean
  top10_score: number
  created_at: string
  updated_at: string
}

export interface SearchParams {
  industry?: string
  region?: string
  stage?: string
}

export interface SearchResult {
  recommended: Announcement[]   // 모든 조건 매칭
  all: Announcement[]           // 부분 매칭 + 전체 태그
}
