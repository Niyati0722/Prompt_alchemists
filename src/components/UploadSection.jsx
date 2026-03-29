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
    <div id="upload" className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Upload Floor Plan</h2>

      {/* step 1 - select plan type */}
      <h4 className="text-lg font-semibold text-gray-700 mb-2">Step 1 — Select Plan Type</h4>
      <select
        onChange={handlePlanChange}
        value={selectedPlan}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select a Plan --</option>
        <option value="planA">Plan A — 2 Bed / 1 Bath</option>
        <option value="planB">Plan B — 4 Bed / 3 Bath</option>
        <option value="planC">Plan C — 3 Bed / 2 Bath</option>
      </select>

      {/* step 2 - upload image */}
      <h4 className="text-lg font-semibold text-gray-700 mb-2">Step 2 — Upload Floor Plan Image</h4>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700 mb-6"
      />

      {/* preview uploaded image */}
      {preview && (
        <div className="mb-6">
          <p className="text-gray-700 font-medium mb-3">Preview:</p>
          <img
            src={preview}
            alt="Uploaded floor plan"
            width={400}
            className="rounded-xl border border-gray-300 shadow-md max-w-full h-auto"
          />
        </div>
      )}

      {/* step 3 - generate */}
      <h4 className="text-lg font-semibold text-gray-700 mb-2">Step 3 — Generate</h4>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing...' : 'Generate 3D Model'}
      </button>
    </div>
  )
}

export default UploadSection