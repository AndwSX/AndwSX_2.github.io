import { CuttingSimulator } from "@/components/cutting-simulator"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Simulador de Cortes Avanzado</h1>
      <CuttingSimulator />
    </main>
  )
}

