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
      <Header />

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
    </>
  )
}

export default App