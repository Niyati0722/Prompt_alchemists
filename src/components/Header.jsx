import { Link } from 'react-scroll'

const Header = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <h3 className="text-2xl font-bold text-gray-800">Prompt Alchemists</h3>
      </div>
      <Link to="upload" smooth={true} spy={true} activeClass="active" className="cursor-pointer px-4 py-2 text-gray-700 hover:text-blue-600 transition">
        Upload
      </Link>
      <Link to="threedmodel" smooth={true} spy={true} activeClass="active" className="cursor-pointer px-4 py-2 text-gray-700 hover:text-blue-600 transition">
        3D Model
      </Link>
      <Link to="materials" smooth={true} spy={true} activeClass="active" className="cursor-pointer px-4 py-2 text-gray-700 hover:text-blue-600 transition">
        Materials
      </Link>
      <Link to="explanation" smooth={true} spy={true} activeClass="active" className="cursor-pointer px-4 py-2 text-gray-700 hover:text-blue-600 transition">
        Explanation
      </Link>
    </nav>
  )
}

export default Header