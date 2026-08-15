import { useEffect, useRef, useState } from 'react'
import { useFetch } from './hooks/useFetch'

interface Car {
    id: number
    name: string
    color: string
    position: number
    speed: number
    lap: number
}

function App() {
    const { data, loading, error, fetch } = useFetch<{ status: string }>()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>()
    const [cars, setCars] = useState<Car[]>([
        { id: 1, name: 'Red', color: '#ff4757', position: 0, speed: 1.5, lap: 0 },
        { id: 2, name: 'Blue', color: '#3742fa', position: 25, speed: 1.5, lap: 0 },
        { id: 3, name: 'Green', color: '#2ed573', position: 50, speed: 1.5, lap: 0 },
        { id: 4, name: 'Yellow', color: '#ffa502', position: 75, speed: 1.5, lap: 0 },
    ])
    const [isRacing, setIsRacing] = useState(false)

    const checkHealth = () => {
        fetch('/api/status')
    }

    const startRace = () => {
        setIsRacing(true)
        setCars(cars.map(car => ({ ...car, speed: 1.5 })))
    }

    const stopRace = () => {
        setIsRacing(false)
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
    }

    const updateCars = () => {
        setCars(prevCars => {
            return prevCars.map(car => {
                // Random speed changes
                const speedChange = (Math.random() - 0.5) * 2
                const newSpeed = Math.max(0.5, Math.min(3, car.speed + speedChange))
                const newPosition = (car.position + newSpeed) % 100
                const newLap = car.lap + (car.position + newSpeed >= 100 ? 1 : 0)

                return {
                    ...car,
                    position: newPosition,
                    speed: newSpeed,
                    lap: newLap
                }
            })
        })
    }

    const drawTrack = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const trackWidth = 60
        const centerX = width / 2
        const centerY = height / 2
        const radiusX = width / 2 - 40
        const radiusY = height / 2 - 80

        // Draw track
        ctx.strokeStyle = '#444'
        ctx.lineWidth = trackWidth
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Draw track lines
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([20, 20])
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw start/finish line
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(centerX + radiusX, centerY)
        ctx.lineTo(centerX + radiusX - 10, centerY - trackWidth / 2)
        ctx.lineTo(centerX + radiusX - 10, centerY + trackWidth / 2)
        ctx.stroke()
    }

    const drawCars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const centerX = width / 2
        const centerY = height / 2
        const radiusX = width / 2 - 40
        const radiusY = height / 2 - 80

        cars.forEach(car => {
            const angle = (car.position / 100) * Math.PI * 2
            const x = centerX + Math.cos(angle) * radiusX
            const y = centerY + Math.sin(angle) * radiusY

            // Draw car
            ctx.fillStyle = car.color
            ctx.beginPath()
            ctx.arc(x, y, 12, 0, Math.PI * 2)
            ctx.fill()

            // Draw car number
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 12px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(car.id.toString(), x, y)
        })
    }

    const drawStats = (ctx: CanvasRenderingContext2D, width: number) => {
        ctx.fillStyle = '#fff'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'left'

        let yPos = 30
        cars.forEach(car => {
            ctx.fillStyle = car.color
            ctx.fillText(`${car.name}: Lap ${car.lap}`, 20, yPos)
            ctx.fillStyle = '#fff'
            ctx.fillText(`Speed: ${car.speed.toFixed(1)}`, 200, yPos)
            yPos += 25
        })
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        const animate = () => {
            if (!isRacing) {
                // Still draw when paused
                ctx.clearRect(0, 0, width, height)
                drawTrack(ctx, width, height)
                drawCars(ctx, width, height)
                drawStats(ctx, width)
                return
            }

            updateCars()

            ctx.clearRect(0, 0, width, height)
            drawTrack(ctx, width, height)
            drawCars(ctx, width, height)
            drawStats(ctx, width)

            animationRef.current = requestAnimationFrame(animate)
        }

        // Initial draw
        ctx.clearRect(0, 0, width, height)
        drawTrack(ctx, width, height)
        drawCars(ctx, width, height)
        drawStats(ctx, width)

        // Start animation loop
        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [cars, isRacing])

    return (
        <div className="app">
            <header className="app-header">
                <h1>Baseline Project</h1>
                <p>Full-stack TypeScript starter</p>
            </header>

            <main className="app-main">
                <section className="card">
                    <h2>API Health Check</h2>
                    <button onClick={checkHealth} disabled={loading}>
                        {loading ? 'Checking...' : 'Check API Status'}
                    </button>
                    
                    {error && (
                        <p className="error">{error}</p>
                    )}
                    
                    {data && (
                        <pre className="response">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    )}
                </section>

                <section className="card">
                    <h2>Race Track</h2>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={startRace} disabled={isRacing}>
                            Start Race
                        </button>
                        <button onClick={stopRace} disabled={!isRacing}>
                            Stop Race
                        </button>
                    </div>
                    <canvas ref={canvasRef} width={600} height={400} />
                </section>

                <section className="card">
                    <h2>Getting Started</h2>
                    <ul>
                        <li>Edit <code>src/client/App.tsx</code> to modify this page</li>
                        <li>Add routes in <code>src/server/routes/</code></li>
                        <li>Define types in <code>src/shared/types.ts</code></li>
                    </ul>
                </section>
            </main>
        </div>
    )
}

export default App
