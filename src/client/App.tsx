function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Ante</h1>
                <p>Full-stack TypeScript starter</p>
            </header>

            <main className="app-main">
                <section className="card">
                    <p>Loading…</p>
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
