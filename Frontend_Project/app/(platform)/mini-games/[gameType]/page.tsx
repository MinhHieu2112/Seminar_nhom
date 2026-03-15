'use client'

import { useParams, useRouter } from 'next/navigation'
import { MinigameModule, type MinigameType } from '@/components/minigames'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameType = (params.gameType as MinigameType) || 'debug'

  const handleExit = () => {
    router.push('/mini-games')
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        onClick={handleExit}
        className="w-fit"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Games
      </Button>
      <MinigameModule gameType={gameType} onExit={handleExit} />
    </div>
  )
}
