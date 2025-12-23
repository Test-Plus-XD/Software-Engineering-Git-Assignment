'use client'

/**
 * WaveBackground Component
 * Provides animated wave backgrounds using react-wavify
 * Respects prefers-reduced-motion accessibility preferences
 * Requirements: 5.1, 5.5
 */

import { useEffect, useState } from 'react'
import Wave from 'react-wavify'

interface WaveBackgroundProps {
    className?: string
    [key: string]: any
}

const WaveBackground = ({ className = '', ...props }: WaveBackgroundProps) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        // Set client-side flag to prevent hydration mismatch
        setIsClient(true)

        // Check for prefers-reduced-motion preference
        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

        if (mediaQuery) {
            setPrefersReducedMotion(mediaQuery.matches)

            // Listen for changes in motion preference
            const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
            mediaQuery.addEventListener('change', handleChange)

            return () => mediaQuery.removeEventListener('change', handleChange)
        } else {
            // If matchMedia is not available, default to no reduced motion (active animations)
            setPrefersReducedMotion(false)
        }
    }, [])

    // Wave configuration for layered effect - higher waves reaching center with more visible layers
    const waveConfigs = [
        {
            fill: 'rgba(59, 130, 246, 0.2)', // blue-500 with higher opacity for visibility
            paused: prefersReducedMotion,
            options: {
                height: 40,
                amplitude: 60,
                speed: 0.15,
                points: 3
            },
            style: {
                position: 'fixed' as const,
                bottom: 0,
                left: 0,
                width: '100%',
                height: '50vh', // Reach halfway up the screen
                zIndex: -3,
                pointerEvents: 'none' as const
            }
        },
        {
            fill: 'rgba(147, 197, 253, 0.15)', // blue-300 with higher opacity
            paused: prefersReducedMotion,
            options: {
                height: 30,
                amplitude: 45,
                speed: 0.2,
                points: 4
            },
            style: {
                position: 'fixed' as const,
                bottom: 0,
                left: 0,
                width: '100%',
                height: '40vh', // Reach 40% up the screen
                zIndex: -2,
                pointerEvents: 'none' as const
            }
        },
        {
            fill: 'rgba(219, 234, 254, 0.12)', // blue-100 with much higher opacity
            paused: prefersReducedMotion,
            options: {
                height: 20,
                amplitude: 35,
                speed: 0.25,
                points: 5
            },
            style: {
                position: 'fixed' as const,
                bottom: 0,
                left: 0,
                width: '100%',
                height: '30vh', // Reach 30% up the screen
                zIndex: -1,
                pointerEvents: 'none' as const
            }
        }
    ]

    return (
        <div
            data-testid="wave-background-container"
            className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
            {...props}
        >
            {isClient && waveConfigs.map((config, index) => (
                <Wave
                    key={index}
                    fill={config.fill}
                    paused={config.paused}
                    options={config.options}
                    style={config.style}
                />
            ))}
        </div>
    )
}

export default WaveBackground