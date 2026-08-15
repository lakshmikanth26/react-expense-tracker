import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => navigate('/add?type=expense')}>
        <Minus className="size-4 text-expense" />
        Expense
      </Button>
      <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => navigate('/add?type=income')}>
        <Plus className="size-4 text-income" />
        Income
      </Button>
      <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => navigate('/add?type=transfer')}>
        <ArrowLeftRight className="size-4" />
        Transfer
      </Button>
    </div>
  )
}
