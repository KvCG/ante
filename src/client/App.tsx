import { useFetch } from './hooks/useFetch'

function App() {
    const { data, loading, error, fetch } = useFetch<{ status: string }>()

    const checkHealth = () => {
        fetch('/api/status')
    }

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
