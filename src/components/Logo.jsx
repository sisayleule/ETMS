// Reusable Logo component for Ambo University branding across the application
// Accepts size prop to control dimensions and maintains aspect ratio
import React from 'react'

export default function Logo({ size = 'md', className = '' }) {
  // Define size variants for different use cases
  const sizeClasses = {
    xs: 'h-6 w-auto',      // Favicon, small icons
    sm: 'h-8 w-auto',      // Sidebar collapsed
    md: 'h-12 w-auto',     // Sidebar header, navbar
    lg: 'h-16 w-auto',     // Page headers
    xl: 'h-24 w-auto',     // Hero sections
    '2xl': 'h-32 w-auto',  // Welcome/splash screens
  }

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]} ${className}`}>
      {/* University Shield Logo */}
      <svg 
        viewBox="0 0 120 140" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Background */}
        <path
          d="M60 10 L10 30 L10 70 Q10 110 60 130 Q110 110 110 70 L110 30 Z"
          fill="#D4AF37"
          stroke="#1E293B"
          strokeWidth="2"
        />
        
        {/* Inner Shield */}
        <path
          d="M60 20 L20 35 L20 70 Q20 100 60 115 Q100 100 100 70 L100 35 Z"
          fill="#F5F0E8"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        
        {/* Letter 'A' with navy background */}
        <rect x="35" y="45" width="50" height="50" rx="5" fill="#1E293B" />
        
        {/* Gold 'A' Letter */}
        <text
          x="60"
          y="82"
          fontSize="48"
          fontWeight="bold"
          fontFamily="serif"
          fill="#D4AF37"
          textAnchor="middle"
        >
          A
        </text>
        
        {/* Torch Symbol */}
        <circle cx="60" cy="35" r="8" fill="#D4AF37" stroke="#1E293B" strokeWidth="1.5" />
        <path
          d="M58 35 L58 42 L62 42 L62 35"
          fill="#FF6B35"
          stroke="#1E293B"
          strokeWidth="1"
        />
        <path
          d="M56 32 Q60 28 64 32"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Open Book at bottom */}
        <path
          d="M45 105 L45 115 Q60 118 75 115 L75 105 Q60 108 45 105"
          fill="white"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        <line x1="60" y1="105" x2="60" y2="115" stroke="#1E293B" strokeWidth="1" />
        
        {/* Laurel Wreaths - Left */}
        <path
          d="M30 55 Q25 60 30 65 Q28 70 30 75"
          fill="none"
          stroke="#4F7942"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Laurel Wreaths - Right */}
        <path
          d="M90 55 Q95 60 90 65 Q92 70 90 75"
          fill="none"
          stroke="#4F7942"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Est. Date Banner */}
        <rect x="45" y="120" width="30" height="8" fill="#1E293B" rx="1" />
        <text
          x="60"
          y="126"
          fontSize="6"
          fontWeight="bold"
          fontFamily="sans-serif"
          fill="#D4AF37"
          textAnchor="middle"
        >
          EST. 1947
        </text>
      </svg>
      
      {/* Text Logo - Only show on md and larger sizes */}
      {(size === 'md' || size === 'lg' || size === 'xl' || size === '2xl') && (
        <div className="flex flex-col">
          <span className="font-serif text-[#1E293B] font-bold tracking-wide leading-none" style={{ fontSize: size === 'xl' || size === '2xl' ? '1.5rem' : '1rem' }}>
            AMBO
          </span>
          <span className="font-sans text-[#D4AF37] text-xs uppercase tracking-widest leading-none" style={{ fontSize: size === 'xl' || size === '2xl' ? '0.75rem' : '0.625rem' }}>
            University
          </span>
        </div>
      )}
    </div>
  )
}

// Specialized logo variant for dark backgrounds (sidebars)
export function LogoDark({ size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'h-6 w-auto',
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
    '2xl': 'h-32 w-auto',
  }

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]} ${className}`}>
      {/* Same SVG but with adjusted colors for dark backgrounds */}
      <svg 
        viewBox="0 0 120 140" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M60 10 L10 30 L10 70 Q10 110 60 130 Q110 110 110 70 L110 30 Z"
          fill="#D4AF37"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M60 20 L20 35 L20 70 Q20 100 60 115 Q100 100 100 70 L100 35 Z"
          fill="#F5F0E8"
          stroke="white"
          strokeWidth="1.5"
        />
        <rect x="35" y="45" width="50" height="50" rx="5" fill="#5875C9" />
        <text
          x="60"
          y="82"
          fontSize="48"
          fontWeight="bold"
          fontFamily="serif"
          fill="#D4AF37"
          textAnchor="middle"
        >
          A
        </text>
        <circle cx="60" cy="35" r="8" fill="#D4AF37" stroke="white" strokeWidth="1.5" />
        <path d="M58 35 L58 42 L62 42 L62 35" fill="#FF6B35" stroke="white" strokeWidth="1" />
        <path d="M56 32 Q60 28 64 32" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 105 L45 115 Q60 118 75 115 L75 105 Q60 108 45 105" fill="white" stroke="white" strokeWidth="1.5" />
        <line x1="60" y1="105" x2="60" y2="115" stroke="#1E293B" strokeWidth="1" />
        <path d="M30 55 Q25 60 30 65 Q28 70 30 75" fill="none" stroke="#4F7942" strokeWidth="2" strokeLinecap="round" />
        <path d="M90 55 Q95 60 90 65 Q92 70 90 75" fill="none" stroke="#4F7942" strokeWidth="2" strokeLinecap="round" />
        <rect x="45" y="120" width="30" height="8" fill="white" rx="1" />
        <text x="60" y="126" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#1E293B" textAnchor="middle">
          EST. 1947
        </text>
      </svg>
      
      {(size === 'md' || size === 'lg' || size === 'xl' || size === '2xl') && (
        <div className="flex flex-col">
          <span className="font-serif text-white font-bold tracking-wide leading-none" style={{ fontSize: size === 'xl' || size === '2xl' ? '1.5rem' : '1rem' }}>
            Ambo University
          </span>
          <span className="font-sans text-white text-xs uppercase tracking-widest leading-none" style={{ fontSize: size === 'xl' || size === '2xl' ? '0.75rem' : '0.625rem' }}>
            Woliso Campus
          </span>
        </div>
      )}
    </div>
  )
}
