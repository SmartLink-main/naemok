import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/pre-register
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { contact, industryTags, regionTags, stageTags } = body

  if (!contact || typeof contact !== 'string' || contact.trim().length === 0) {
    return NextResponse.json({ error: '연락처를 입력해주세요.' }, { status: 400 })
  }

  const trimmed = contact.trim()
  const contactType = trimmed.includes('@') ? 'email' : 'phone'

  // 전화번호 형식 검증
  if (contactType === 'phone') {
    const phoneRegex = /^01[016789]\d{7,8}$/
    const cleaned = trimmed.replace(/[-\s]/g, '')
    if (!phoneRegex.test(cleaned)) {
      return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 })
    }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('pre_registrations')
    .upsert(
      {
        contact: trimmed,
        contact_type: contactType,
        industry_tags: industryTags ?? [],
        region_tags: regionTags ?? [],
        stage_tags: stageTags ?? [],
      },
      { onConflict: 'contact' }
    )

  if (error) {
    console.error('사전등록 오류:', error)
    return NextResponse.json({ error: '등록 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
