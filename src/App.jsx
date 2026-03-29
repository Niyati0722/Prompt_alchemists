import { useState } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ThreeDViewer from './components/ThreeDViewer'
import MaterialTable from './components/MaterialTable'
import Explanation from './components/Explanation'

const App = () => {
  const [walls, setWalls] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');
        * { font-family: 'Lato', sans-serif; }
        html, body { margin: 0; padding: 0; scroll-behavior: smooth; }
      `}</style>

      <div className="min-h-screen w-full" style={{ backgroundColor: '#2c3531' }}>
        <Header />

        <main className="pt-24 pb-16 space-y-6">
          <UploadSection
            onWallsDetected={setWalls}
            onPlanSelected={setSelectedPlan}
          />

          <ThreeDViewer walls={walls} />

          <MaterialTable
            walls={walls}
            plan={selectedPlan}
          />

          <Explanation
            walls={walls}
            plan={selectedPlan}
          />
        </main>

        <footer className="border-t border-[#116466] py-6 text-center" style={{ backgroundColor: '#2c3531' }}>
          <p className="text-xs uppercase tracking-widest text-[#d1e8e2] opacity-40">
            Prompt Alchemists · 2025
          </p>
        </footer>
      </div>
    </>
  )
}

export default App