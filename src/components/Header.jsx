import { Link } from 'react-scroll'

const Header = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');
        .pa-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background-color: #ffcb9a;
          transition: width 0.25s ease;
          border-radius: 2px;
        }
        .pa-link:hover::after, .pa-link.active::after { width: 60%; }
      `}</style>

      <nav
        className="fixed top-0 left-0 w-full z-50 border-b-[3px] border-[#116466]"
        style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-16">

          <h3 className="text-xl font-bold tracking-wide text-[#ffcb9a]">
            Prompt <span className="text-[#d9b08c] font-semibold">Alchemists</span>
          </h3>

          <div className="flex items-center gap-1">
            {[
              { to: 'upload',      label: 'Upload'      },
              { to: 'threedmodel', label: '3D Model'    },
              { to: 'materials',   label: 'Materials'   },
              { to: 'explanation', label: 'Explanation' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                smooth
                spy
                activeClass="active !text-[#ffcb9a] !bg-[#116466]"
                className="pa-link relative cursor-pointer px-4 py-1.5 text-sm font-semibold tracking-wider uppercase text-[#d1e8e2] rounded hover:text-[#ffcb9a] hover:bg-[#116466]/30 transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>

        </div>
      </nav>
    </>
  )
}

export default Header