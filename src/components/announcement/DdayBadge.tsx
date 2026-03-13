import { Badge } from '@/components/ui/badge'

interface DdayBadgeProps {
  endDate: string | null
  status: string
}

export function DdayBadge({ endDate, status }: DdayBadgeProps) {
  if (status === 'closed') {
    return <Badge variant="secondary">마감</Badge>
  }

  if (!endDate) {
    return <Badge variant="outline">상시</Badge>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000)

  if (daysLeft < 0) {
    return <Badge variant="secondary">마감</Badge>
  }
  if (daysLeft === 0) {
    return <Badge className="bg-red-500 text-white hover:bg-red-600">D-Day</Badge>
  }
  if (daysLeft <= 7) {
    return <Badge className="bg-orange-500 text-white hover:bg-orange-600">D-{daysLeft}</Badge>
  }
  if (daysLeft <= 30) {
    return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">D-{daysLeft}</Badge>
  }

  return <Badge variant="outline">D-{daysLeft}</Badge>
}
