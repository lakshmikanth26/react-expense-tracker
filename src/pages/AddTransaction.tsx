import { useSearchParams } from 'react-router-dom'

export default function AddTransaction() {
  const [params] = useSearchParams()
  const type = params.get('type') ?? 'expense'

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight capitalize">Add {type}</h1>
      <p className="mt-2 text-muted-foreground">The fast quick-add form arrives in Phase 3.</p>
    </div>
  )
}
