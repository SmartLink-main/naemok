import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const INDUSTRIES = ['음식점', '도소매', '제조', '서비스', 'IT', '건설', '미용', '교육', '의료', '농업', '기타']
const REGIONS = ['전국', '서울', '경기', '인천', '부산', '경남', '경북', '대구', '대전', '충남', '충북', '광주', '전남', '전북', '울산', '강원', '세종', '제주']
const STAGES = ['예비창업', '창업초기', '기창업', '소상공인', '중소기업']

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY 미설정' }, { status: 500 })
  }

  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const prompt = `사용자가 정부 지원금을 찾고 있습니다. 아래 입력을 분석해 업종, 지역, 사업단계를 추출해주세요.

입력: "${query}"

가능한 값:
- industry (업종): ${INDUSTRIES.join(', ')} 중 하나만 (없으면 null)
- region (지역): ${REGIONS.join(', ')} 중 하나만 (없으면 null)
- stage (사업단계): ${STAGES.join(', ')} 중 하나만 (없으면 null)

반드시 아래 JSON만 반환하세요. 설명 없이:
{"industry": "...", "region": "...", "stage": "..."}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const text = response.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON 파싱 실패')

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      industry: INDUSTRIES.includes(result.industry) ? result.industry : null,
      region: REGIONS.includes(result.region) ? result.region : null,
      stage: STAGES.includes(result.stage) ? result.stage : null,
    })
  } catch {
    return NextResponse.json({ error: 'AI 분석 실패. 직접 조건을 선택해주세요.' }, { status: 500 })
  }
}
