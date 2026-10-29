import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './ProfileEditor.css'

function ProfileEditor() {
  const { username } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    full_name: '',
    headline: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  })

  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/portfolio/${username}`)
        setProfile(data.profile)
        setPreview(
          data.profile.profile_image
            ? `http://localhost:5000${data.profile.profile_image}`
            : ''
        )
      } catch (error) {
        setMessage(error.message || 'Could not load profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [username])

  function handleChange(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Your photo must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData()

    Object.entries(profile).forEach(([key, value]) => {
      formData.append(key, value ?? '')
    })

    if (photo) {
      formData.append('profileImage', photo)
    }

    try {
      const updated = await apiRequest(
        `/student-profiles/${username}`,
        {
          method: 'PUT',
          body: formData,
        }
      )

      setProfile((current) => ({ ...current, ...updated }))
      setPhoto(null)
      setPreview(
        updated.profile_image
          ? `http://localhost:5000${updated.profile_image}`
          : ''
      )
      setMessage('Profile saved successfully!')
    } catch (error) {
      setMessage(error.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="profile-editor-status">Loading profile...</p>

  return (
    <main className="profile-editor">
      <button
        type="button"
        className="profile-back-button"
        onClick={() => navigate('/')}
      >
        ← Back to Home
      </button>

      <header className="profile-editor-header">
        <p className="profile-editor-eyebrow">YOUR DIGITAL IDENTITY</p>
        <h1>Edit your profile</h1>
        <p>Keep your introduction and professional links up to date.</p>
      </header>

      <form className="profile-editor-form" onSubmit={handleSubmit}>
        <section className="profile-photo-section">
          <div className="profile-photo">
            {preview ? (
              <img src={preview} alt="Profile preview" />
            ) : (
              <span>
                {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          <label className="profile-photo-upload">
            Upload profile photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
          </label>

          <small>JPG, PNG or WebP · Maximum 5 MB</small>
        </section>

        <div className="profile-form-grid">
          <label>
            Full name *
            <input
              name="full_name"
              value={profile.full_name || ''}
              onChange={handleChange}
              required
              maxLength={150}
              placeholder="Your full name"
            />
          </label>

          <label>
            Professional headline
            <input
              name="headline"
              value={profile.headline || ''}
              onChange={handleChange}
              maxLength={200}
              placeholder="Student Developer"
            />
          </label>

          <label className="profile-full-width">
            About me
            <textarea
              name="bio"
              value={profile.bio || ''}
              onChange={handleChange}
              rows={5}
              placeholder="Tell visitors about yourself..."
            />
          </label>

          <label>
            GitHub URL
            <input
              type="url"
              name="github_url"
              value={profile.github_url || ''}
              onChange={handleChange}
              placeholder="https://github.com/username"
            />
          </label>

          <label>
            LinkedIn URL
            <input
              type="url"
              name="linkedin_url"
              value={profile.linkedin_url || ''}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
            />
          </label>

          <label className="profile-full-width">
            Personal website
            <input
              type="url"
              name="website_url"
              value={profile.website_url || ''}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
            />
          </label>
        </div>

        {message && (
          <p className="profile-editor-message" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="profile-save-button"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </main>
  )
}

export default ProfileEditor
