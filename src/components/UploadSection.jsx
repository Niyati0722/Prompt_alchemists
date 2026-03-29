import { useState } from 'react'
import axios from 'axios'

const UploadSection = ({ onWallsDetected, onPlanSelected }) => {
  const [selectedPlan, setSelectedPlan] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePlanChange = (e) => {
    setSelectedPlan(e.target.value)
    onPlanSelected(e.target.value)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    setUploadedImage(file)

    // show preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selectedPlan) {
      alert('Please select a plan type')
      return
    }
    if (!uploadedImage) {
      alert('Please upload a floor plan image')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('image', uploadedImage)

    try {
      const response = await axios.post('http://localhost:5000/parse', formData)
      onWallsDetected(response.data)
    } catch (error) {
      alert('Error parsing floor plan')
    }

    setLoading(false)
  }

  return (
    <div id="upload">
      <h2>Upload Floor Plan</h2>

      {/* step 1 - select plan type */}
      <h4>Step 1 — Select Plan Type</h4>
      <select onChange={handlePlanChange} value={selectedPlan}>
        <option value="">-- Select a Plan --</option>
        <option value="planA">Plan A — 2 Bed / 1 Bath</option>
        <option value="planB">Plan B — 4 Bed / 3 Bath</option>
        <option value="planC">Plan C — 3 Bed / 2 Bath</option>
      </select>

      {/* step 2 - upload image */}
      <h4>Step 2 — Upload Floor Plan Image</h4>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* preview uploaded image */}
      {preview && (
        <div>
          <p>Preview:</p>
          <img
            src={preview}
            alt="Uploaded floor plan"
            width={400}
          />
        </div>
      )}

      {/* step 3 - generate */}
      <h4>Step 3 — Generate</h4>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Analyzing...' : 'Generate 3D Model'}
      </button>
    </div>
  )
}

export default UploadSection
