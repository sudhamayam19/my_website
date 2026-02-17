import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Sudha Devarakonda
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="#home" className="text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 rounded-md font-medium">Home</Link>
                <Link href="#timeline" className="text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 rounded-md font-medium">Journey</Link>
                <Link href="#podcasts" className="text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 rounded-md font-medium">Podcasts</Link>
                <Link href="#blog" className="text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 rounded-md font-medium">Blog</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-semibold shadow-lg">
              RJ • Translator • Voice Artist
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
              నమస్కారం, నేను సుధ
            </h2>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Namaskaram, I'm Sudha
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Welcome to my creative journey! For nearly two decades, I've been breathing life into words through radio, voice-overs, and translations.
            </p>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-purple-600 font-semibold">
              మా ప్రయాణంలో స్వాగతం! రెండు దశాబ్దాలుగా నేను రేడియో, వాయిస్-ఓవర్లు మరియు అనువాదాల ద్వారా పదాలకు జీవం పోశాను.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <a href="#timeline" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                Explore My Journey
              </a>
              <a href="#blog" className="px-8 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all">
                Read My Blog
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Career Timeline Section */}
      <section id="timeline" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              My Journey
            </h2>
            <p className="text-xl text-gray-600">A timeline of my career in media and arts</p>
          </div>

          <div className="space-y-12">
            {/* Timeline Item */}
            <div className="relative pl-8 border-l-4 border-purple-400">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full"></div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <span className="text-sm font-semibold text-purple-600">2005</span>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">Radio Journey Begins</h3>
                <p className="mt-2 text-gray-600">Started my career as an RJ, bringing music and stories to listeners across the airwaves.</p>
              </div>
            </div>

            <div className="relative pl-8 border-l-4 border-pink-400">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-pink-600 to-orange-500 rounded-full"></div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <span className="text-sm font-semibold text-pink-600">2008</span>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">Voice Artist</h3>
                <p className="mt-2 text-gray-600">Expanded into professional voice-overs, commercials, and narration work.</p>
              </div>
            </div>

            <div className="relative pl-8 border-l-4 border-orange-400">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full"></div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <span className="text-sm font-semibold text-orange-600">2012</span>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">Translation Expert</h3>
                <p className="mt-2 text-gray-600">Became a professional translator, bridging languages and cultures through words.</p>
              </div>
            </div>

            <div className="relative pl-8 border-l-4 border-purple-400">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full"></div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <span className="text-sm font-semibold text-purple-600">2020</span>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">Podcast Launch</h3>
                <p className="mt-2 text-gray-600">Launched my own podcast, sharing stories and conversations with a global audience.</p>
              </div>
            </div>

            <div className="relative pl-8 border-l-4 border-pink-400">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full"></div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <span className="text-sm font-semibold text-pink-600">Present</span>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">Continuing the Journey</h3>
                <p className="mt-2 text-gray-600">Creating content, voicing stories, and connecting with audiences across multiple platforms.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast & Media Section */}
      <section id="podcasts" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Listen & Watch
            </h2>
            <p className="text-xl text-gray-600">My podcasts, videos, and social content</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Spotify */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Spotify Podcast</h3>
                <p className="text-gray-600 mb-4">Listen to my latest episodes and exclusive content on Spotify.</p>
                <a href="#" className="inline-block px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full font-semibold hover:shadow-lg transition-all">
                  Listen Now
                </a>
              </div>
            </div>

            {/* YouTube */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">YouTube Channel</h3>
                <p className="text-gray-600 mb-4">Watch my videos, behind-the-scenes content, and more on YouTube.</p>
                <a href="#" className="inline-block px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-full font-semibold hover:shadow-lg transition-all">
                  Watch Now
                </a>
              </div>
            </div>

            {/* Instagram */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Instagram</h3>
                <p className="text-gray-600 mb-4">Follow my daily updates, stories, and behind-the-scenes moments.</p>
                <a href="#" className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-all">
                  Follow Me
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              My Blog
            </h2>
            <p className="text-xl text-gray-600">Thoughts, stories, and experiences</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Blog Post 1 */}
            <Link href="/blog/1" className="block">
              <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                <div className="p-6">
                  <span className="text-sm text-purple-600 font-semibold">Voice Acting</span>
                  <h3 className="text-xl font-bold mt-2 mb-3">The Art of Voice: Finding Your Unique Sound</h3>
                  <p className="text-gray-600 mb-4">Discovering my voice and how I developed my unique style over the years...</p>
                  <span className="text-purple-600 font-semibold hover:text-pink-600 transition-colors">Read More →</span>
                </div>
              </article>
            </Link>

            {/* Blog Post 2 */}
            <Link href="/blog/2" className="block">
              <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full">
                <div className="h-48 bg-gradient-to-br from-pink-400 to-orange-400"></div>
                <div className="p-6">
                  <span className="text-sm text-pink-600 font-semibold">Radio Memories</span>
                  <h3 className="text-xl font-bold mt-2 mb-3">Behind the Mic: 20 Years of Radio Stories</h3>
                  <p className="text-gray-600 mb-4">From my first day at the radio station to memorable listener interactions...</p>
                  <span className="text-purple-600 font-semibold hover:text-pink-600 transition-colors">Read More →</span>
                </div>
              </article>
            </Link>

            {/* Blog Post 3 */}
            <Link href="/blog/3" className="block">
              <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full">
                <div className="h-48 bg-gradient-to-br from-orange-400 to-yellow-400"></div>
                <div className="p-6">
                  <span className="text-sm text-orange-600 font-semibold">Translation</span>
                  <h3 className="text-xl font-bold mt-2 mb-3">Bridging Cultures Through Translation</h3>
                  <p className="text-gray-600 mb-4">How translation opens doors to understanding between different cultures...</p>
                  <span className="text-purple-600 font-semibold hover:text-pink-600 transition-colors">Read More →</span>
                </div>
              </article>
            </Link>
          </div>

          <div className="text-center mt-12">
            <a href="/blog" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              View All Posts
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Sudha Devarakonda</h3>
              <p className="text-gray-400">RJ • Translator • Voice Artist</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="#home" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="#timeline" className="text-gray-400 hover:text-white transition-colors">Journey</Link></li>
                <li><Link href="#podcasts" className="text-gray-400 hover:text-white transition-colors">Podcasts</Link></li>
                <li><Link href="#blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <span className="sr-only">Spotify</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 mb-2">&copy; 2025 Sudha Devarakonda. All rights reserved.</p>
            <p className="text-purple-400 text-lg">ధన్యవాదాలు • మళ్లీ కలుద్దాం!</p>
            <p className="text-gray-500 text-sm">Thank you • See you again!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
