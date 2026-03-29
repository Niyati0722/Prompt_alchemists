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
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 space-y-10">
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
    </div>
  )
}

export default App