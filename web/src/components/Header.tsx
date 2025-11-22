import Link from 'next/link';

export function Header() {
  return (
    <header className="w-full py-20 flex flex-col items-center justify-center text-center space-y-6">
      <Link href="/" className="group relative inline-block">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
        
        <h1 className="relative text-6xl md:text-8xl font-black tracking-tighter">
          <span className="text-indigo-400">
            PLAYLIST
          </span>
          <br />
          <span className="text-white group-hover:text-zinc-400 transition-colors duration-300">
            WRAPPED
          </span>
        </h1>
      </Link>
      
      <p className="text-zinc-400 text-lg md:text-xl font-medium tracking-wide uppercase">
        Your Year in Music
      </p>
    </header>
  );
}
