import { ethers } from 'ethers'

// ─────────────────────────────────────────────────────────────────────────────
// After deploying ReportStorage.sol via Remix IDE, paste the deployed address
// and ABI below.
// ─────────────────────────────────────────────────────────────────────────────

// TODO: replace with your deployed contract address (Sepolia or local network)
const CONTRACT_ADDRESS = 'YOUR_REAL_DEPLOYED_ADDRESS'
// Minimal ABI — only the functions we call from the frontend
const CONTRACT_ABI = [
  'function storeReport(string memory data) public',
  'function getMyReportCount() public view returns (uint256)',
  'event ReportStored(address indexed user, uint256 index, uint256 timestamp)',
]

/**
 * connectWallet
 * Prompts MetaMask to connect and returns the signer.
 * Throws a human-readable error if MetaMask is not installed.
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install it from metamask.io to use blockchain features.')
  }
  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  return { provider, signer }
}

/**
 * saveReportToBlockchain
 * Collects all analysis data, converts it to JSON, and stores it on-chain.
 *
 * @param {object} payload  - { walls, selectedPlan, materials, explanation }
 * @returns {object}        - { txHash, receipt }
 */
export const saveReportToBlockchain = async (payload) => {
  const { signer } = await connectWallet()

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

  // Build a clean, serialisable snapshot
  const reportData = JSON.stringify({
    timestamp: new Date().toISOString(),
    walls: payload.walls,
    selectedPlan: payload.selectedPlan,
    materialRecommendations: payload.materials,
    aiExplanation: payload.explanation,
  })

  const tx = await contract.storeReport(reportData)
  const receipt = await tx.wait()

  return { txHash: tx.hash, receipt }
}
