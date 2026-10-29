
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import './Overview.css'

function Overview() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [showAllCertifications, setShowAllCertifications] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    status: 'Planned',
  })

  const [achievements, setAchievements] = useState([])
  const [achievementLoading, setAchievementLoading] = useState(true)
  const [achievementError, setAchievementError] = useState('')
  const [achievementMessage, setAchievementMessage] = useState('')
  const [achievementSaving, setAchievementSaving] = useState(false)
  const [editingAchievementId, setEditingAchievementId] = useState(null)

  const [achievementForm, setAchievementForm] = useState({
    title: '',
    category: 'Award',
    organization: '',
    description: '',
    achievement_date: '',
  })

  const [certifications, setCertifications] = useState([])
  const [certificationLoading, setCertificationLoading] = useState(true)
  const [certificationError, setCertificationError] = useState('')
  const [certificationMessage, setCertificationMessage] = useState('')
  const [certificationSaving, setCertificationSaving] = useState(false)
  const [editingCertificationId, setEditingCertificationId] = useState(null)
  const [editingCertificationImagePath, setEditingCertificationImagePath] = useState('')
  const [certificateImage, setCertificateImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [certificationForm, setCertificationForm] = useState({
    title: '',
    issuing_organization: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiry_date: '',
    description: '',
  })

  async function fetchProjects() {
    try {
      const data = await apiRequest('/projects')
      setProjects(data)
      setError('')
    } catch {
      setError('Unable to load projects. Check the backend.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAchievements() {
    try {
      const data = await apiRequest('/achievements')
      setAchievements(data)
      setAchievementError('')
    } catch {
      setAchievementError('Unable to load achievements.')
    } finally {
      setAchievementLoading(false)
    }
  }

  async function fetchCertifications() {
    try {
      const data = await apiRequest('/certifications')
      setCertifications(data)
      setCertificationError('')
    } catch {
      setCertificationError('Unable to load certifications.')
    } finally {
      setCertificationLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchAchievements()
    fetchCertifications()
  }, [])

  useEffect(() => {
    if (!certificateImage) {
      setImagePreview('')
      return
    }

    const previewUrl = URL.createObjectURL(certificateImage)
    setImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [certificateImage])

  function handleCertificationChange(event) {
    setCertificationForm({
      ...certificationForm,
      [event.target.name]: event.target.value,
    })
  }

  function handleCertificateImageChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setCertificateImage(null)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setCertificationError('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      setCertificateImage(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setCertificationError('The image must be 5 MB or smaller.')
      event.target.value = ''
      setCertificateImage(null)
      return
    }

    setCertificationError('')
    setCertificateImage(file)
  }

  async function handleCertificationSubmit(event) {
    event.preventDefault()
    setCertificationSaving(true)
    setCertificationError('')
    setCertificationMessage('')

    try {
      const payload = new FormData()

      Object.entries(certificationForm).forEach(([key, value]) => {
        payload.append(key, value)
      })

      if (certificateImage) {
        payload.append('certificateImage', certificateImage)
      }

      const endpoint = editingCertificationId
        ? `/certifications/${editingCertificationId}`
        : '/certifications'

      await apiRequest(endpoint, {
        method: editingCertificationId ? 'PUT' : 'POST',
        body: payload,
      })

      const wasEditing = editingCertificationId !== null

      resetCertificationForm()
      setCertificationMessage(
        wasEditing
          ? 'Certification updated successfully!'
          : 'Certification added successfully!'
      )
      await fetchCertifications()
    } catch (error) {
      setCertificationError(
        error.message || 'Unable to save certification. Please try again.'
      )
    } finally {
      setCertificationSaving(false)
    }
  }

  function resetCertificationForm() {
    setEditingCertificationId(null)
    setEditingCertificationImagePath('')
    setCertificateImage(null)
    setCertificationForm({
      title: '',
      issuing_organization: '',
      credential_id: '',
      credential_url: '',
      issue_date: '',
      expiry_date: '',
      description: '',
    })
  }

  function handleEditCertification(certification) {
    setEditingCertificationId(certification.id)
    setEditingCertificationImagePath(certification.image_path || '')
    setCertificateImage(null)
    setCertificationForm({
      title: certification.title || '',
      issuing_organization: certification.issuing_organization || '',
      credential_id: certification.credential_id || '',
      credential_url: certification.credential_url || '',
      issue_date: certification.issue_date
        ? String(certification.issue_date).slice(0, 10)
        : '',
      expiry_date: certification.expiry_date
        ? String(certification.expiry_date).slice(0, 10)
        : '',
      description: certification.description || '',
    })
    setCertificationMessage('')
    setCertificationError('')
  }

  async function handleDeleteCertification(certification) {
    const confirmed = window.confirm(
      `Delete "${certification.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    setCertificationError('')
    setCertificationMessage('')

    try {
      await apiRequest(`/certifications/${certification.id}`, {
        method: 'DELETE',
      })

      if (editingCertificationId === certification.id) {
        resetCertificationForm()
      }

      setCertificationMessage('Certification deleted successfully!')
      await fetchCertifications()
    } catch (error) {
      setCertificationError(
        error.message || 'Unable to delete certification.'
      )
    }
  }

  function handleAchievementChange(event) {
    setAchievementForm({
      ...achievementForm,
      [event.target.name]: event.target.value,
    })
  }

  async function handleAchievementSubmit(event) {
    event.preventDefault()
    setAchievementSaving(true)
    setAchievementError('')
    setAchievementMessage('')

    try {
      const endpoint = editingAchievementId
        ? `/achievements/${editingAchievementId}`
        : '/achievements'

      await apiRequest(endpoint, {
        method: editingAchievementId ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...achievementForm,
          achievement_date: achievementForm.achievement_date || null,
        }),
      })

      setAchievementForm({
        title: '',
        category: 'Award',
        organization: '',
        description: '',
        achievement_date: '',
      })

      setEditingAchievementId(null)
      setAchievementMessage(
        editingAchievementId
          ? 'Achievement updated successfully!'
          : 'Achievement added successfully!'
      )

      await fetchAchievements()
    } catch {
      setAchievementError('Unable to save achievement. Please try again.')
    } finally {
      setAchievementSaving(false)
    }
  }

  function handleEditAchievement(achievement) {
    setEditingAchievementId(achievement.id)

    setAchievementForm({
      title: achievement.title,
      category: achievement.category,
      organization: achievement.organization || '',
      description: achievement.description || '',
      achievement_date: achievement.achievement_date
        ? String(achievement.achievement_date).slice(0, 10)
        : '',
    })

    setAchievementMessage('')
    setAchievementError('')
  }

  async function handleDeleteAchievement(achievement) {
    const confirmed = window.confirm(
      `Delete "${achievement.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    setAchievementError('')
    setAchievementMessage('')

    try {
      await apiRequest(`/achievements/${achievement.id}`, {
        method: 'DELETE',
      })

      if (editingAchievementId === achievement.id) {
        setEditingAchievementId(null)
        setAchievementForm({
          title: '',
          category: 'Award',
          organization: '',
          description: '',
          achievement_date: '',
        })
      }

      setAchievementMessage('Achievement deleted successfully!')
      await fetchAchievements()
    } catch {
      setAchievementError('Unable to delete achievement.')
    }
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const endpoint = editingId
        ? `/projects/${editingId}`
        : '/projects'

      await apiRequest(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })

      setForm({
        title: '',
        category: '',
        description: '',
        status: 'Planned',
      })

      setEditingId(null)
      setMessage(
        editingId
          ? 'Project updated successfully!'
          : 'Project added successfully!'
      )

      await fetchProjects()
    } catch {
      setError('Unable to save project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, title) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await apiRequest(`/projects/${id}`, {
        method: 'DELETE',
      })

      setMessage('Project deleted successfully!')
      await fetchProjects()
    } catch {
      setError('Unable to delete project.')
    }
  }

  function handleEdit(project) {
    setEditingId(project.id)
    setForm({
      title: project.title,
      category: project.category,
      description: project.description || '',
      status: project.status,
    })
    setMessage('')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({
      title: '',
      category: '',
      description: '',
      status: 'Planned',
    })
    setMessage('')
    setError('')
  }

  // Sort newest records first, using ID as a fallback.
  const sortNewestFirst = (items) =>
    [...items].sort((a, b) => {
      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0
      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0

      if (dateA !== dateB) return dateB - dateA
      return Number(b.id) - Number(a.id)
    })

  const recentProjects = sortNewestFirst(projects)
  const recentAchievements = sortNewestFirst(achievements)
  const recentCertifications = sortNewestFirst(certifications)

  const visibleProjects = showAllProjects
    ? recentProjects
    : recentProjects.slice(0, 2)

  const visibleAchievements = showAllAchievements
    ? recentAchievements
    : recentAchievements.slice(0, 2)

  const visibleCertifications = showAllCertifications
    ? recentCertifications
    : recentCertifications.slice(0, 2)

  const stats = [
    { label: 'Projects', count: loading ? '...' : projects.length },
    {
      label: 'Achievements',
      count: achievementLoading ? '...' : achievements.length,
    },
    {
      label: 'Certifications',
      count: certificationLoading ? '...' : certifications.length,
    },
  ]

  return (
    <section className="preview">
      <div className="preview-heading">
        <div>
          <p className="preview-label">YOUR WORKSPACE</p>
          <h2>Student overview</h2>
        </div>
        <span className="status">
          {loading ? 'Loading projects' : 'Workspace active'}
        </span>
      </div>

      <div className="stats">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>
              {item.label === 'Projects' && loading ? '...' : item.count}
            </strong>
          </article>
        ))}
      </div>

      <div className="project-form-section">
        <h3>Add a project</h3>

        <form
          onSubmit={handleSubmit}
          className="project-form project-form--projects"
        >
          <div className="project-form-column">
            <label>
              Project title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Student Portfolio Website"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                rows="3"
              />
            </label>
          </div>

          <div className="project-form-column">
            <label>
              Category *
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Web Development"
                required
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Add Project'}
            </button>

            {editingId && (
              <button type="button" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}

        <div className="project-list">
          <div className="overview-list-heading">
            <h3>Your projects</h3>

            {projects.length > 2 && (
              <button
                type="button"
                className="overview-view-all"
                onClick={() => setShowAllProjects((value) => !value)}
              >
                {showAllProjects ? 'Show latest 2' : 'View all projects'}
              </button>
            )}
          </div>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="empty-message">
              Your portfolio starts here. Add your first project.
            </p>
          ) : (
            visibleProjects.map((project) => (
              <article className="project-item" key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <p>{project.category}</p>
                  {project.description && <p>{project.description}</p>}
                </div>

                <div className="project-actions">
                  <span>{project.status}</span>

                  <button
                    type="button"
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(project.id, project.title)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="project-form-section">
        <h3>Add an achievement</h3>

        <form className="project-form" onSubmit={handleAchievementSubmit}>
          <label>
            Achievement title *
            <input
              name="title"
              value={achievementForm.title}
              onChange={handleAchievementChange}
              placeholder="e.g. First Place in Hackathon"
              required
            />
          </label>

          <label>
            Category *
            <select
              name="category"
              value={achievementForm.category}
              onChange={handleAchievementChange}
              required
            >
              <option value="Award">Award</option>
              <option value="Competition">Competition</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Academic">Academic</option>
              <option value="Workshop">Workshop</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Organization
            <input
              name="organization"
              value={achievementForm.organization}
              onChange={handleAchievementChange}
              placeholder="e.g. College or event organizer"
            />
          </label>

          <label>
            Achievement date
            <input
              type="date"
              name="achievement_date"
              value={achievementForm.achievement_date}
              onChange={handleAchievementChange}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={achievementForm.description}
              onChange={handleAchievementChange}
              placeholder="Describe your achievement"
              rows="3"
            />
          </label>

          <button type="submit" disabled={achievementSaving}>
            {achievementSaving
              ? 'Saving...'
              : editingAchievementId
                ? 'Save Changes'
                : 'Add Achievement'}
          </button>

          {editingAchievementId && (
            <button
              type="button"
              onClick={() => {
                setEditingAchievementId(null)
                setAchievementForm({
                  title: '',
                  category: 'Award',
                  organization: '',
                  description: '',
                  achievement_date: '',
                })
                setAchievementMessage('')
                setAchievementError('')
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        {achievementMessage && (
          <p role="status">{achievementMessage}</p>
        )}

        {achievementError && (
          <p role="alert">{achievementError}</p>
        )}

        <div className="project-list">
          <div className="overview-list-heading">
            <h3>Your achievements</h3>

            {achievements.length > 2 && (
              <button
                type="button"
                className="overview-view-all"
                onClick={() => setShowAllAchievements((value) => !value)}
              >
                {showAllAchievements
                  ? 'Show latest 2'
                  : 'View all achievements'}
              </button>
            )}
          </div>

          {achievementLoading ? (
            <p>Loading achievements...</p>
          ) : achievements.length === 0 ? (
            <p className="empty-message">
              No achievements yet. Add your first accomplishment above.
            </p>
          ) : (
            visibleAchievements.map((achievement) => (
              <article className="project-item" key={achievement.id}>
                <div>
                  <strong>{achievement.title}</strong>
                  <p>{achievement.category}</p>

                  {achievement.organization && <p>{achievement.organization}</p>}

                  {achievement.description && <p>{achievement.description}</p>}

                  {achievement.achievement_date && (
                    <p>
                      Date: {String(achievement.achievement_date).slice(0, 10)}
                    </p>
                  )}
                </div>

                <div className="project-actions">
                  <button
                    type="button"
                    onClick={() => handleEditAchievement(achievement)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDeleteAchievement(achievement)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="project-form-section">
        <h3>{editingCertificationId ? 'Edit certification' : 'Add a certification'}</h3>

        <form
          className="project-form"
          onSubmit={handleCertificationSubmit}
        >
          <label>
            Certification title *
            <input
              name="title"
              value={certificationForm.title}
              onChange={handleCertificationChange}
              placeholder="e.g. React Developer Certification"
              required
            />
          </label>

          <label>
            Issuing organization *
            <input
              name="issuing_organization"
              value={certificationForm.issuing_organization}
              onChange={handleCertificationChange}
              placeholder="e.g. Coursera"
              required
            />
          </label>

          <label>
            Credential ID
            <input
              name="credential_id"
              value={certificationForm.credential_id}
              onChange={handleCertificationChange}
              placeholder="Certificate ID"
            />
          </label>

          <label>
            Credential URL
            <input
              type="url"
              name="credential_url"
              value={certificationForm.credential_url}
              onChange={handleCertificationChange}
              placeholder="https://..."
            />
          </label>

          <label>
            Issue date
            <input
              type="date"
              name="issue_date"
              value={certificationForm.issue_date}
              onChange={handleCertificationChange}
            />
          </label>

          <label>
            Expiry date
            <input
              type="date"
              name="expiry_date"
              value={certificationForm.expiry_date}
              onChange={handleCertificationChange}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={certificationForm.description}
              onChange={handleCertificationChange}
              placeholder="What did you learn?"
              rows="3"
            />
          </label>

          <label>
            Certificate image (optional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCertificateImageChange}
            />
            <small>JPG, PNG, or WebP. Maximum size: 5 MB.</small>
          </label>

          {(imagePreview || (!certificateImage && editingCertificationImagePath)) && (
            <div className="certificate-image-preview">
              <p>{imagePreview ? 'Selected image preview' : 'Current certificate image'}</p>
              <img
                src={
                  imagePreview ||
                  `http://localhost:5000${editingCertificationImagePath}`
                }
                alt="Certificate preview"
              />
              {certificateImage && (
                <button type="button" onClick={() => setCertificateImage(null)}>
                  Remove selected image
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={certificationSaving}>
            {certificationSaving
              ? 'Saving...'
              : editingCertificationId
                ? 'Save Changes'
                : 'Add Certification'}
          </button>

          {editingCertificationId && (
            <button
              type="button"
              onClick={() => {
                resetCertificationForm()
                setCertificationMessage('')
                setCertificationError('')
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        {certificationMessage && (
          <p role="status">{certificationMessage}</p>
        )}

        {certificationError && (
          <p role="alert">{certificationError}</p>
        )}

        <div className="project-list">
          <div className="overview-list-heading">
            <h3>Your certifications</h3>

            {certifications.length > 2 && (
              <button
                type="button"
                className="overview-view-all"
                onClick={() => setShowAllCertifications((value) => !value)}
              >
                {showAllCertifications
                  ? 'Show latest 2'
                  : 'View all certifications'}
              </button>
            )}
          </div>

          {certificationLoading ? (
            <p>Loading certifications...</p>
          ) : certifications.length === 0 ? (
            <p className="empty-message">
              No certifications yet. Add your first certification above.
            </p>
          ) : (
            visibleCertifications.map((certification) => (
              <article className="project-item" key={certification.id}>
                <div>
                  <strong>{certification.title}</strong>
                  <p>{certification.issuing_organization}</p>

                  {certification.image_path && (
                    <img
                      className="certificate-image"
                      src={`http://localhost:5000${certification.image_path}`}
                      alt={`Certificate for ${certification.title}`}
                      loading="lazy"
                    />
                  )}

                  {certification.credential_id && (
                    <p>Credential ID: {certification.credential_id}</p>
                  )}

                  {certification.issue_date && (
                    <p>
                      Issued: {String(certification.issue_date).slice(0, 10)}
                    </p>
                  )}

                  {certification.expiry_date && (
                    <p>
                      Expires: {String(certification.expiry_date).slice(0, 10)}
                    </p>
                  )}

                  {certification.description && (
                    <p>{certification.description}</p>
                  )}

                  {certification.credential_url && (
                    <a
                      href={certification.credential_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View credential
                    </a>
                  )}
                </div>

                <div className="project-actions">
                  <button
                    type="button"
                    onClick={() => handleEditCertification(certification)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDeleteCertification(certification)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Overview