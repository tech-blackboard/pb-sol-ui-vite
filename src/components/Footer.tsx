export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} My Company. All rights reserved.
      </div>
    </footer>
  )
}


