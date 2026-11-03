import {
  Music2,
  AudioWaveform,
  BarChart3,
  Headphones
} from 'lucide-react'

import { useEffect, useState } from 'react'
import api from './services/api'

function App() {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchVibe, setSearchVibe] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    api.get('/analytics')
      .then((response) => {
        setAnalytics(response.data)
      })
      .catch((err) => {
        console.error('Analytics API Error:', err)
        setError('Unable to load analytics data.')
      })
  }, [])

  const fetchPlaylist = async (vibe) => {
    setSelectedVibe(vibe)
    setLoadingPlaylist(true)
    setPlaylist([])
    setError('')

    try {
      const response = await api.get(
        `/playlists/${encodeURIComponent(vibe)}`
      )

      console.log('Playlist API Response:', response.data)

      const tracks = Array.isArray(response.data)
        ? response.data
        : response.data.tracks || []

      setPlaylist(tracks)

    } catch (err) {
      console.error('Playlist API Error:', err)
      setError('Unable to load playlist.')
    } finally {
      setLoadingPlaylist(false)
    }
  }


const searchTracks = async () => {
  if (!searchQuery.trim()) {
    setSearchError('Please enter a track or artist name.')
    return
  }

  setSearchLoading(true)
  setSearchError('')
  setHasSearched(true)
  setSearchResults([])

  try {
    const response = await api.get('/tracks/search', {
      params: {
        q: searchQuery.trim(),
        vibe: searchVibe || undefined,
        limit: 50
      }
    })

    setSearchResults(response.data)
  } catch (err) {
    console.error('Search API Error:', err)
    setSearchError('Unable to search tracks. Please try again.')
  } finally {
    setSearchLoading(false)
  }
}


  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-white/10">

        <div className="flex items-center gap-2">
          <Music2 className="text-green-400" size={30} />

          <h1 className="text-2xl font-bold tracking-wide">
            VIBEIFY
          </h1>
        </div>

        <div className="flex gap-8 text-gray-400">
          <a href="#" className="hover:text-green-400 transition">Home</a>
          <a href="#" className="hover:text-green-400 transition">Explore</a>
          <a href="#" className="hover:text-green-400 transition">Analytics</a>
          <a href="#" className="hover:text-green-400 transition">About</a>
        </div>

      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-8 py-24">

        <div className="max-w-3xl">

          <p className="text-green-400 font-semibold tracking-widest mb-5">
            AI POWERED MUSIC DISCOVERY
          </p>

          <h2 className="text-6xl font-bold leading-tight">
            Discover Your
            <span className="text-green-400"> Music Vibe.</span>
          </h2>

          <p className="text-gray-400 text-lg mt-6 leading-8">
            Explore music through machine learning.
            Discover different music personalities and
            find tracks that match your vibe.
          </p>

          <button className="mt-10 bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-full transition">
            Explore Music Vibes →
          </button>

        </div>


{/* Track Search Section */}
<section className="mt-28">

  <div className="mb-8">
    <p className="text-green-400 font-semibold tracking-widest mb-3">
      MUSIC LIBRARY
    </p>

    <h2 className="text-4xl font-bold">
      Find Your Sound.
    </h2>

    <p className="text-gray-400 mt-3">
      Search tracks and artists from our music collection.
    </p>
  </div>

  {/* Search Input */}
  <div className="flex flex-col md:flex-row gap-4">

    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') searchTracks()
      }}
      placeholder="Search songs or artists..."
      className="flex-1 bg-[#141b16] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-green-400"
    />

    <button
      onClick={searchTracks}
      disabled={searchLoading}
      className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-8 py-4 rounded-xl transition"
    >
      {searchLoading ? 'Searching...' : 'Search'}
    </button>

  </div>

  {/* Vibe Filter */}
  <div className="flex flex-wrap gap-3 mt-5">

    <button
      onClick={() => setSearchVibe('')}
      className={`px-4 py-2 rounded-full border text-sm transition ${
        searchVibe === ''
          ? 'bg-green-500 text-black border-green-500'
          : 'border-white/10 text-gray-400 hover:border-green-400'
      }`}
    >
      All Vibes
    </button>

    {analytics?.vibe_distribution.map((vibe) => (
      <button
        key={vibe.vibe}
        onClick={() => setSearchVibe(vibe.vibe)}
        className={`px-4 py-2 rounded-full border text-sm transition ${
          searchVibe === vibe.vibe
            ? 'bg-green-500 text-black border-green-500'
            : 'border-white/10 text-gray-400 hover:border-green-400'
        }`}
      >
        {vibe.vibe}
      </button>
    ))}

  </div>

  {/* Search Results */}
  <div className="mt-10">

    {searchError && (
      <p className="text-red-400">{searchError}</p>
    )}

    {searchLoading && (
      <p className="text-gray-400">Searching tracks...</p>
    )}

    {!searchLoading && hasSearched && !searchError && (
      <div>

        <h3 className="text-2xl font-bold mb-6">
          Search Results ({searchResults.length})
        </h3>

        {searchResults.length === 0 ? (
          <p className="text-gray-400">
            No tracks found. Try another search.
          </p>
        ) : (
          <div className="space-y-3">

            {searchResults.map((track, index) => (
              <div
                key={`${track.Track_Name}-${track.Artist}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141b16] border border-white/10 rounded-xl p-5 hover:border-green-400/40 transition"
              >

                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-bold">
                    {index + 1}
                  </span>

                  <div>
                    <h4 className="font-semibold">
                      {track.Track_Name}
                    </h4>

                    <p className="text-gray-400 text-sm mt-1">
                      {track.Artist}
                    </p>
                  </div>
                </div>

                <span className="text-green-400 text-sm">
                  {track.Vibe_Cluster_Label}
                </span>

              </div>
            ))}

          </div>
        )}

      </div>
    )}

  </div>

</section>


        {/* Explore Music Vibes */}
        <section className="mt-32">

          <div className="mb-10">
            <p className="text-green-400 font-semibold tracking-widest mb-3">
              EXPLORE YOUR SOUND
            </p>

            <h2 className="text-4xl font-bold">
              Discover Music Vibes
            </h2>

            <p className="text-gray-400 mt-3">
              Explore different music personalities discovered by our
              machine learning model.
            </p>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {analytics.vibe_distribution.map((vibe, index) => (
                <div
                  key={vibe.vibe}
                  className="bg-[#141b16] border border-white/10 rounded-2xl p-7 hover:border-green-400/50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <AudioWaveform className="text-green-400" size={30} />

                      <span className="text-green-400 text-sm font-semibold">
                        VIBE 0{index + 1}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold">
                      {vibe.vibe}
                    </h3>

                    <p className="text-gray-400 mt-4">
                      {vibe.track_count.toLocaleString()} Tracks
                    </p>

                    <div className="w-full bg-white/10 rounded-full h-2 mt-5">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${vibe.percentage}%` }}
                      />
                    </div>

                    <p className="text-gray-400 text-sm mt-3">
                      {vibe.percentage}% of total tracks
                    </p>
                  </div>

                  <button
                    onClick={() => fetchPlaylist(vibe.vibe)}
                    className="mt-6 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition"
                  >
                    View Playlist →
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* Playlist Section */}
        {selectedVibe && (
          <section className="mt-16">

            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-green-400 font-semibold tracking-widest">
                  YOUR SELECTED VIBE
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  {selectedVibe}
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelectedVibe(null)
                  setPlaylist([])
                }}
                className="text-gray-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            {loadingPlaylist && (
              <p className="text-gray-400">Loading playlist...</p>
            )}

            {!loadingPlaylist && playlist.length === 0 && (
              <p className="text-gray-400">No tracks found.</p>
            )}

            <div className="space-y-3">
              {Array.isArray(playlist) && playlist.map((track, index) => (
                <div
                  key={`${track.Track_Name}-${track.Artist}-${index}`}
                  className="flex items-center gap-4 bg-[#141b16] border border-white/10 rounded-xl p-4"
                >
                  <span className="text-green-400 font-bold">
                    {index + 1}
                  </span>

                  <div>
                    <h3 className="font-semibold">
                      {track.Track_Name}
                    </h3>

                    <p className="text-gray-400 text-sm">
                      {track.Artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">

          <StatCard
            icon={<Headphones size={28} />}
            number={
              analytics
                ? analytics.total_tracks.toLocaleString()
                : 'Loading...'
            }
            label="Tracks Analyzed"
          />

          <StatCard
            icon={<AudioWaveform size={28} />}
            number={
              analytics
                ? analytics.total_vibes
                : 'Loading...'
            }
            label="Music Vibes"
          />

          <StatCard
            icon={<BarChart3 size={28} />}
            number="K-Means"
            label="ML Algorithm"
          />

        </div>

        {/* API Error */}
        {error && (
          <p className="text-red-400 mt-6">{error}</p>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 text-center text-gray-500">
        <p>
          © 2026 VIBEIFY. Powered by Machine Learning.
        </p>
      </footer>

    </div>
  )
}

function StatCard({ icon, number, label }) {
  return (
    <div className="bg-[#141b16] border border-white/10 rounded-2xl p-8 hover:border-green-400/40 transition">

      <div className="text-green-400 mb-5">
        {icon}
      </div>

      <h3 className="text-3xl font-bold">
        {number}
      </h3>

      <p className="text-gray-400 mt-2">
        {label}
      </p>

    </div>
  )
}

export default App