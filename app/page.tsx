export default function Home() {
  return (
    <main className="container">
      <div className="hero">
        <h1>SISGEDI 2.0</h1>
        <p className="subtitle">Sistema de Gestión de Documentación Integral</p>

        <div className="status-card">
          <h2>🚧 Proyecto en Desarrollo</h2>
          <p>La aplicación web está actualmente en construcción.</p>

          <div className="status-grid">
            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <div>
                <h3>Base de Datos</h3>
                <p>Esquema completo + datos de prueba</p>
              </div>
            </div>

            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <div>
                <h3>Backend (Supabase)</h3>
                <p>PostgreSQL + Storage + Auth</p>
              </div>
            </div>

            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <div>
                <h3>Configuración</h3>
                <p>Variables de entorno + OCR</p>
              </div>
            </div>

            <div className="status-item in-progress">
              <span className="status-icon">🔨</span>
              <div>
                <h3>Frontend (Next.js)</h3>
                <p>En construcción...</p>
              </div>
            </div>

            <div className="status-item pending">
              <span className="status-icon">⏳</span>
              <div>
                <h3>API Routes</h3>
                <p>Pendiente</p>
              </div>
            </div>

            <div className="status-item pending">
              <span className="status-icon">⏳</span>
              <div>
                <h3>Módulos UI</h3>
                <p>Pendiente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h2>📊 Datos Disponibles</h2>
          <ul>
            <li>20 Unidades Administrativas (jerarquía completa)</li>
            <li>50 Usuarios con roles asignados</li>
            <li>100 Documentos Entrantes</li>
            <li>150 Turnados entre UAs</li>
            <li>50 Documentos Salientes</li>
            <li>200 Items de Inventario</li>
          </ul>
        </div>

        <div className="info-section">
          <h2>🛠️ Stack Tecnológico</h2>
          <ul>
            <li><strong>Frontend:</strong> Next.js 14 + React 18 + TypeScript</li>
            <li><strong>Backend:</strong> Supabase (PostgreSQL + Storage + Auth)</li>
            <li><strong>OCR:</strong> Google Cloud Vision API</li>
            <li><strong>Testing:</strong> Vitest + Testing Library</li>
            <li><strong>Deployment:</strong> Vercel</li>
          </ul>
        </div>

        <footer className="footer">
          <p>SISGEDI 2.0 &copy; 2025 - Versión en Desarrollo</p>
        </footer>
      </div>
    </main>
  )
}
