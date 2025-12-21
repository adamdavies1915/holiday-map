'use client'

import { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  animationDuration: number
  animationDelay: number
  size: number
  opacity: number
}

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    const flakes: Snowflake[] = []
    const snowflakeCount = 50

    for (let i = 0; i < snowflakeCount; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 12,
        animationDelay: Math.random() * 10,
        size: 0.5 + Math.random() * 1,
        opacity: 0.4 + Math.random() * 0.6,
      })
    }

    setSnowflakes(flakes)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[500] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            fontSize: `${flake.size}em`,
            opacity: flake.opacity,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}
