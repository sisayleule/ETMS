// This is the configuration file for Tailwind CSS to define paths, colors, and fonts for the application
export default { // Exporting the configuration object for Tailwind CSS
  content: [ // The content array defines the files Tailwind should scan for utility classes
    "./index.html", // Scan the main HTML file at the root level for classes
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all JS, TS, JSX, and TSX files in the src directory recursively
  ], // Close the content array
  theme: { // Extend the default theme options with custom styles
    extend: { // Extend rather than replace default Tailwind colors and fonts
      colors: { // Custom colors matching the ETMS dashboard theme design with #8CA5FF primary blue
        // DASHBOARD THEME COLORS (Light Blue Theme)
        'bg-primary': '#F5F8FF', // Light blue background for dashboard pages
        'bg-secondary': '#FFFFFF', // Pure white for cards and containers
        'bg-deep': '#1E293B', // Deep navy for login/register sidebars only
        'dashboard-bg': '#EAF0FF', // Soft blue dashboard background
        'dashboard-gradient-start': '#F5F8FF', // Gradient start color
        'dashboard-gradient-end': '#DCE6FF', // Gradient end color
        'sidebar-blue': '#7090E5', // Sidebar gradient blue
        'primary-blue': '#8CA5FF', // Main dashboard theme color
        
        // TEXT COLORS FOR DASHBOARD
        'text-primary': '#1E3A5F', // Dark blue for headings
        'text-secondary': '#4A5F7F', // Medium blue for body text
        'text-muted': '#6B7F9F', // Light blue for muted text
        'text-light': '#7A8FAF', // Very light blue for placeholders
        
        // BORDER COLORS
        'border-blue': '#C5D5FF', // Light blue borders
        'border-blue-light': '#E5EDFF', // Very light blue borders
        
        // LEGACY COLORS (for login/register pages only)
        'warm-beige': '#F5F0E8', // Elegant warm beige used for light theme components
        'deep-beige': '#E8DDD0', // Rich dark beige for alternative elements in light mode
        'charcoal': '#2C2C2C', // Deep charcoal color used for high contrast text on light mode
        'charcoal-light': '#4A4A4A', // Soft gray-charcoal for general reading and body text
        'gold': '#D4AF37', // Gold accent color representing premium university identity
        'gold-light': '#F0D060', // Brighter gold tone for user hover states and links
        'indigo-main': '#4F46E5', // Main indigo color representing primary dashboard actions
        'cyan-main': '#06B6D4', // Vibrant cyan accent color for highlights and status indicators
      }, // Close colors extension object
      fontFamily: { // Custom font family pairings for readable typography
        'serif': ['Cormorant Garamond', 'Georgia', 'serif'], // Elegant serif font for main headers and display titles
        'sans': ['Montserrat', 'Inter', 'sans-serif'], // Professional sans-serif font for general UI and body copy
      }, // Close fontFamily extension object
    }, // Close extend object
  }, // Close theme object
  plugins: [], // List of Tailwind CSS plugin extensions, kept empty by default
} // Close configuration export object
