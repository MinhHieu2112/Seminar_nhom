'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  id: string
  title: string
  content: string
}

interface AccordionProps {
  items: AccordionItem[]
}

export default function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null)

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg">
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-left">{item.title}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${
                openId === item.id ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          {openId === item.id && (
            <div className="px-4 py-3 border-t border-border bg-gray-50 text-text-secondary">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
