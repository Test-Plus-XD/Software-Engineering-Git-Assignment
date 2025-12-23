'use client'

/**
 * WaveBackground Component
 * Provides animated wave backgrounds using react-wavify
 * Respects prefers-reduced-motion accessibility preferences
 * Requirements: 5.1, 5.5
 */

import { useEffect, useState } from 'react'
import Wave from 'react-wavify'

const WaveBackground = ({ className = '', ...props }) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        // Check for prefers-reduced-motion preference
        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

        if (mediaQuery) {
            setPrefersReducedMotion(mediaQuery.matches)

            // Listen for changes in motion preference
            const handleChange = (e) => setPrefersReducedMotion(e.matches)
            mediaQuery.addEventListener('change', handleChange)

            return () => mediaQuery.removeEventListener('change', handleChange)
        } else {
            // If matchMedia is not available, default to no reduced motion (active animations)
            setPrefersReducedMotion(false)
        }
    }, [])

    // Wave configuration for layered effect
    const waveConfigs = [
        {
            fill: 'rgba(59, 130, 246, 0.1)', // blue-500 with low opacity
            paused: prefersReducedMotion,
            options: {
                height: 20,
                amplitude: 40,
                speed: 0.15,
                points: 3
            },
            style: {
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '200px',
                zIndex: -3,
                pointerEvents: 'none'
            }
        },
        {
            fill: 'rgba(147, 197, 253, 0.08)', // blue-300 with lower opacity
            paused: prefersReducedMotion,
            options: {
                height: 15,
                amplitude: 30,
                speed: 0.2,
                points: 4
            },
            style: {
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '150px',
                zIndex: -2,
                pointerEvents: 'none'
            }
        },
        {
            fill: 'rgba(219, 234, 254, 0.05)', // blue-100 with very low opacity
            paused: prefersReducedMotion,
            options: {
                height: 10,
                amplitude: 20,
                speed: 0.25,
                points: 5
            },
            style: {
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100px',
                zIndex: -1,
                pointerEvents: 'none'
            }
        }
    ]

    return (
        <div
            data-testid="wave-background-container"
            className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
            {...props}
        >
            {waveConfigs.map((config, index) => (
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