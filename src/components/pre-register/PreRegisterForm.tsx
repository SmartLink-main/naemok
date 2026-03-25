'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any
  }
}

interface PreRegisterFormProps {
  industryTags?: string[]
  regionTags?: string[]
  stageTags?: string[]
}

export function PreRegisterForm({
  industryTags = [],
  regionTags = [],
  stageTags = [],
}: PreRegisterFormProps) {
  void industryTags
  void regionTags
  void stageTags

  const [sdkReady, setSdkReady] = useState(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.Kakao?.isInitialized())
  })

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
    if (!appKey) return

    if (window.Kakao?.isInitialized()) return

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.async = true
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(appKey)
      }
      setSdkReady(true)
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  function handleAddChannel() {
    const channelId = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID
    if (!channelId) return

    if (window.Kakao?.Channel) {
      window.Kakao.Channel.addChannel({ channelPublicId: channelId })
    } else {
      // SDK 미로드 시 채널 페이지로 직접 이동
      window.open(`https://pf.kakao.com/${channelId}/friend`, '_blank')
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-4 h-4 text-yellow-600" />
        <p className="font-semibold text-sm text-yellow-800">새 공고 카카오톡으로 받기</p>
      </div>
      <p className="text-xs text-yellow-700 mb-3">
        채널 추가하면 내 조건에 맞는 새 공고를 카카오톡으로 바로 알려드려요.
      </p>
      <Button
        onClick={handleAddChannel}
        disabled={!sdkReady}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold border-0"
      >
        카카오톡 채널 추가하기
      </Button>
    </div>
  )
}
