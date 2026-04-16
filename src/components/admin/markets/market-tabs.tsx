'use client';

import { Market, MARKETS } from './types';
import { cn } from '@/lib/utils';

interface MarketTabsProps {
  selected: Market;
  onChange: (market: Market) => void;
}

export function MarketTabs({ selected, onChange }: MarketTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MARKETS.map((market) => (
        <button
          key={market.id}
          onClick={() => onChange(market.id)}
          className={cn(
            'px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
            'border border-border hover:border-[#003087]/30',
            selected === market.id
              ? 'bg-[#003087] text-white border-[#003087] shadow-sm'
              : 'bg-white text-muted-foreground hover:bg-[#F5F7FA]'
          )}
        >
          <span className="mr-2">{market.flag}</span>
          {market.name}
        </button>
      ))}
    </div>
  );
}
