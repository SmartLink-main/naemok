'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PreRegisterFormProps {
  industryTags?: string[]
  regionTags?: string[]
  stageTags?: string[]
}

export function PreRegisterForm({ industryTags = [], regionTags = [], stageTags = [] }: PreRegisterFormProps) {
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/pre-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, industryTags, regionTags, stageTags }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? '오류가 발생했습니다.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="font-medium text-blue-800">등록 완료!</p>
        <p className="text-sm text-blue-600 mt-1">새 공고 알림이 출시되면 가장 먼저 알려드릴게요.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      <p className="font-medium text-sm mb-1">새 공고 알림 받기</p>
      <p className="text-xs text-muted-foreground mb-3">
        알림 서비스 출시 시 연락드립니다. 이메일 또는 전화번호 중 하나만 입력해주세요.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="이메일 또는 전화번호"
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          disabled={status === 'loading'}
        />
        <Button type="submit" disabled={status === 'loading' || !contact.trim()} size="sm">
          {status === 'loading' ? '...' : '등록'}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
      )}
    </div>
  )
}
