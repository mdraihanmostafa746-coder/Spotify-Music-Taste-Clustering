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