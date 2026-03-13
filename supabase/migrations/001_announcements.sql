-- 공고 테이블
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bizinfo_id TEXT UNIQUE NOT NULL,          -- 기업마당 고유 공고 ID (중복 방지 기준)
  title TEXT NOT NULL,                       -- 공고명
  organization TEXT,                         -- 지원기관
  amount_min INTEGER,                        -- 최소 지원금액 (만원)
  amount_max INTEGER,                        -- 최대 지원금액 (만원)
  amount_text TEXT,                          -- 원문 금액 텍스트
  start_date DATE,                           -- 신청 시작일
  end_date DATE,                             -- 신청 마감일
  status TEXT NOT NULL DEFAULT 'active'      -- active | closed
    CHECK (status IN ('active', 'closed')),
  industry_tags TEXT[] DEFAULT '{}',         -- 업종 태그 (음식점, 도소매, 제조 등)
  region_tags TEXT[] DEFAULT '{}',           -- 지역 태그 (서울, 경기, 전국 등)
  stage_tags TEXT[] DEFAULT '{}',            -- 사업단계 태그 (예비창업, 창업초기, 기창업 등)
  summary TEXT,                              -- 자격조건 요약 (3~5줄)
  original_url TEXT,                         -- 기업마당 원문 링크
  is_top10 BOOLEAN DEFAULT FALSE,
  top10_score NUMERIC DEFAULT 0,             -- TOP 10 선정 점수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마감 공고 자동 제외용 인덱스
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_end_date ON announcements(end_date);
CREATE INDEX idx_announcements_top10 ON announcements(is_top10, top10_score DESC);

-- 업종/지역/사업단계 태그 GIN 인덱스 (배열 검색 최적화)
CREATE INDEX idx_announcements_industry ON announcements USING GIN(industry_tags);
CREATE INDEX idx_announcements_region ON announcements USING GIN(region_tags);
CREATE INDEX idx_announcements_stage ON announcements USING GIN(stage_tags);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 알림 사전등록 테이블 (FT-006)
CREATE TABLE pre_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact TEXT NOT NULL,                     -- 이메일 또는 전화번호
  contact_type TEXT NOT NULL                 -- email | phone
    CHECK (contact_type IN ('email', 'phone')),
  industry_tags TEXT[] DEFAULT '{}',         -- 관심 업종 (미입력 시 전체)
  region_tags TEXT[] DEFAULT '{}',           -- 관심 지역 (미입력 시 전체)
  stage_tags TEXT[] DEFAULT '{}',            -- 관심 사업단계 (미입력 시 전체)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact)                            -- 동일 연락처 중복 방지 (upsert 기준)
);

CREATE TRIGGER pre_registrations_updated_at
  BEFORE UPDATE ON pre_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
