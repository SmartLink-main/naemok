'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Announcement } from '@/types/announcement'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any
  }
}

interface KakaoShareButtonProps {
  announcement: Announcement
  currentUrl: string
}

export function KakaoShareButton({ announcement: a, currentUrl }: KakaoShareButtonProps) {
  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
    if (!appKey) return

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.async = true
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(appKey)
      }
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  function handleShare() {
    if (!window.Kakao?.Share) {
      // 카카오 SDK 없을 때 URL 복사로 대체
      navigator.clipboard.writeText(currentUrl).then(() => {
        alert('링크가 복사되었어요! 카카오톡에 붙여넣기 해주세요.')
      })
      return
    }

    const amount = a.amount_max
      ? `최대 ${a.amount_max.toLocaleString()}만원`
      : a.amount_text ?? '지원금 있음'

    const deadline = a.end_date
      ? `마감 ${a.end_date.replace(/-/g, '.')}`
      : '상시 모집'

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: a.title,
        description: `${amount} | ${deadline}\n${a.organization ?? ''}`,
        imageUrl: 'https://naemok.kr/og-image.png', // 배포 후 실제 이미지로 교체
        link: {
          mobileWebUrl: currentUrl,
          webUrl: currentUrl,
        },
      },
      buttons: [
        {
          title: '공고 보러가기',
          link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
        },
      ],
    })
  }

  return (
    <Button variant="outline" onClick={handleShare} className="w-full">
      카카오톡으로 공유하기
    </Button>
  )
}
