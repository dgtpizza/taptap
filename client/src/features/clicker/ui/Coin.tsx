import type { ReactNode } from 'react'

export function Coin({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`relative h-[300px] w-full${className ? ` ${className}` : ''}`}>
      <div className="absolute left-1/2 top-[25px] h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-gold-glow blur-[30px]" />
      <div className="absolute left-1/2 top-[75px] h-[230px] w-[230px] -translate-x-1/2 rounded-full bg-[#7a4e0c80] blur-[18px]" />
      <div
        className="absolute left-1/2 top-[55px] h-[240px] w-[240px] -translate-x-1/2 rounded-full border border-[#ffe17a66]"
        style={{ background: 'radial-gradient(85% 85% at 38% 32%, #FFE17A 0%, #F5C24A 55%, #C8881C 100%)' }}
      />
      <div className="absolute left-1/2 top-[77px] h-[196px] w-[196px] -translate-x-1/2 rounded-full border-2 border-[#7a4e0c73]" />
      <div className="absolute left-1/2 top-[87px] h-[176px] w-[176px] -translate-x-1/2 rounded-full border border-[#ffe17a59]" />
      <div className="absolute left-1/2 top-[75px] h-[60px] w-[120px] -translate-x-1/2 rounded-full bg-[#ffe17a59] blur-[14px]" />

      <div className="absolute left-1/2 top-[175px] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        {children}
      </div>
    </div>
  )
}
