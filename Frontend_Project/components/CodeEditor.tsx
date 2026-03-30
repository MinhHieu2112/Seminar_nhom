'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CodeEditorProps {
  initialCode: string
  language: string
  onChange: (code: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function CodeEditor({
  initialCode,
  language,
  onChange,
  onSubmit,
  isSubmitting,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-slate-400 text-sm font-medium">{language}</span>
      </div>

      <textarea
        value={code}
        onChange={handleChange}
        className="flex-1 bg-slate-950 text-white font-mono text-sm p-4 resize-none focus:outline-none border-none"
        placeholder="// Write your solution here..."
        spellCheck="false"
      />

      <div className="bg-slate-800 px-4 py-3 border-t border-slate-700 flex gap-2">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
