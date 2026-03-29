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
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selectedPlan) return alert('Please select a plan type')
    if (!uploadedImage) return alert('Please upload a floor plan image')

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');
        #upload { font-family: 'Lato', sans-serif; }
        .upload-select option { background-color: #2c3531; color: #d1e8e2; }
      `}</style>

      <div
        id="upload"
        className=" mt-24 mb-10 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#2c3531' }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#116466]">
          <h2 className="text-2xl font-bold tracking-wide text-[#ffcb9a]">
            Upload Floor Plan
          </h2>
          <p className="text-sm text-[#d1e8e2] mt-1 font-normal">
            Follow the steps below to generate your 3D model
          </p>
        </div>

        <div className="px-8 py-8 flex flex-col gap-8">

          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c3531] bg-[#d9b08c]">
                1
              </span>
              <h4 className="text-base font-semibold tracking-wide text-[#d1e8e2] uppercase">
                Select Plan Type
              </h4>
            </div>
            <select
              onChange={handlePlanChange}
              value={selectedPlan}
              className="upload-select w-full rounded-lg px-4 py-3 text-sm font-medium text-[#d1e8e2] border border-[#116466] bg-[#116466]/20 focus:outline-none focus:ring-2 focus:ring-[#d9b08c] transition cursor-pointer"
            >
              <option value="">— Select a Plan —</option>
              <option value="planA">Plan A — 2 Bed / 1 Bath</option>
              <option value="planB">Plan B — 4 Bed / 3 Bath</option>
              <option value="planC">Plan C — 3 Bed / 2 Bath</option>
            </select>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c3531] bg-[#d9b08c]">
                2
              </span>
              <h4 className="text-base font-semibold tracking-wide text-[#d1e8e2] uppercase">
                Upload Floor Plan Image
              </h4>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-[#d1e8e2]
                file:mr-4 file:py-2 file:px-5
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#116466] file:text-[#d1e8e2]
                file:cursor-pointer
                hover:file:bg-[#116466]/80
                file:transition file:duration-200"
            />

            {preview && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#d9b08c] mb-3">
                  Preview
                </p>
                <img
                  src={preview}
                  alt="Uploaded floor plan"
                  className="rounded-xl border border-[#116466] shadow-lg max-w-full h-auto"
                  style={{ maxWidth: 400 }}
                />
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c3531] bg-[#d9b08c]">
                3
              </span>
              <h4 className="text-base font-semibold tracking-wide text-[#d1e8e2] uppercase">
                Generate
              </h4>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition duration-200
                bg-[#116466] text-[#d1e8e2]
                hover:bg-[#d9b08c] hover:text-[#2c3531]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Generate 3D Model'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default UploadSection