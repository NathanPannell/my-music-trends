export function Footer() {
  return (
    <footer className="py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-6 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span>Built with Next.js</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>Powered by Spotify</span>
        </div>
        <div className="flex items-center gap-6 opacity-50 hover:opacity-100 transition-opacity">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
