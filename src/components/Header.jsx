import { Link } from 'react-scroll'

const Header = () => {
  return (
    <nav>
      <Link to="upload" smooth={true} spy={true} activeClass="active">
        Upload
      </Link>
      <Link to="threedmodel" smooth={true} spy={true} activeClass="active">
        3D Model
      </Link>
      <Link to="materials" smooth={true} spy={true} activeClass="active">
        Materials
      </Link>
      <Link to="explanation" smooth={true} spy={true} activeClass="active">
        Explanation
      </Link>
    </nav>
  )
}

export default Header