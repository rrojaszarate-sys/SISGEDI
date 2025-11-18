import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl font-bold">SISGEDI 2.0</h1>
          <p className="text-xl text-muted-foreground">
            Sistema de Gestión Documental y Expedientes Digitales Inteligente
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-input bg-background px-6 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">🤖 IA Avanzada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                OCR 98%+, NLP, ML predictivo
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">🔒 Compliance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                ISO 15489, NIST, WCAG 2.2, GDPR
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">🚀 Blockchain</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Notarización inmutable y verificable
              </p>
            </div>
          </div>

          <footer className="mt-12 text-sm text-muted-foreground">
            <p>© 2025 SISGEDI 2.0 - Todos los derechos reservados</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
