import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './Portfolio.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

function Portfolio() {
  const { username } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      setLoading(true)
      setError('')

      try {
        const data = await apiRequest(`/portfolio/${username}`)
        if (!cancelled) setPortfolio(data)
      } catch {
        if (!cancelled) {
          setError('This portfolio could not be found or is not public.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPortfolio()

    return () => {
      cancelled = true
    }
  }, [username])

  if (loading) {
    return <main className="public-portfolio"><p>Loading portfolio...</p></main>
  }

  if (error || !portfolio) {
    return (
      <main className="public-portfolio">
        <h1>Portfolio unavailable</h1>
        <p>{error || 'Please try again later.'}</p>
      </main>
    )
  }

  const { profile, projects, achievements, certifications } = portfolio

  return (
    <main className="public-portfolio">
      <div className="portfolio-pdf-actions">
        <button
          type="button"
          onClick={() => window.print()}
          className="portfolio-pdf-button"
        >
          ↓ Download / Print as PDF
        </button>
      </div>

      <nav className="portfolio-nav">
        <a href="#home" className="portfolio-brand">EduFolio</a>
        <div>
          <a href="#projects">Projects</a>
          <a href="#achievements">Achievements</a>
          <a href="#certifications">Certifications</a>
        </div>
      </nav>

      <section className="portfolio-hero" id="home">
        {profile.profile_image ? (
          <img
            className="portfolio-avatar"
            src={`${API_ORIGIN}${profile.profile_image}`}
            alt={profile.full_name}
          />
        ) : (
          <div className="portfolio-avatar portfolio-avatar-placeholder">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        <p className="portfolio-eyebrow">STUDENT PORTFOLIO</p>
        <h1>{profile.full_name}</h1>
        <h2>{profile.headline || 'Student & Aspiring Professional'}</h2>
        {profile.bio && <p className="portfolio-bio">{profile.bio}</p>}

        <div className="portfolio-socials">
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer">
              GitHub
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
          {profile.website_url && (
            <a href={profile.website_url} target="_blank" rel="noreferrer">
              Website
            </a>
          )}
        </div>
      </section>

      <section className="portfolio-section" id="projects">
        <p className="portfolio-eyebrow">WHAT I'VE BUILT</p>
        <h2>Projects</h2>
        {projects.length === 0 ? (
          <p>No projects to display yet.</p>
        ) : (
          <div className="portfolio-grid">
            {projects.map((project) => (
              <article className="portfolio-card" key={project.id}>
                <span className="portfolio-tag">{project.category}</span>
                <h3>{project.title}</h3>
                {project.description && <p>{project.description}</p>}
                <small>{project.status}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="portfolio-section" id="achievements">
        <p className="portfolio-eyebrow">MILESTONES</p>
        <h2>Achievements</h2>
        {achievements.length === 0 ? (
          <p>No achievements to display yet.</p>
        ) : (
          <div className="portfolio-grid">
            {achievements.map((item) => (
              <article className="portfolio-card" key={item.id}>
                <span className="portfolio-tag">{item.category}</span>
                <h3>{item.title}</h3>
                {item.organization && <p>{item.organization}</p>}
                {item.description && <p>{item.description}</p>}
                {item.achievement_date && (
                  <small>{String(item.achievement_date).slice(0, 10)}</small>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="portfolio-section" id="certifications">
        <p className="portfolio-eyebrow">LEARNING & GROWTH</p>
        <h2>Certifications</h2>
        {certifications.length === 0 ? (
          <p>No certifications to display yet.</p>
        ) : (
          <div className="portfolio-grid">
            {certifications.map((item) => (
              <article className="portfolio-card" key={item.id}>
                {item.image_path && (
                  <a
                    href={`${API_ORIGIN}${item.image_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      className="portfolio-certificate"
                      src={`${API_ORIGIN}${item.image_path}`}
                      alt={`Certificate: ${item.title}`}
                      loading="lazy"
                    />
                  </a>
                )}
                <h3>{item.title}</h3>
                <p>{item.issuing_organization}</p>
                {item.issue_date && (
                  <small>Issued: {String(item.issue_date).slice(0, 10)}</small>
                )}
                {item.credential_url && (
                  <a href={item.credential_url} target="_blank" rel="noreferrer">
                    Verify credential
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="portfolio-footer">
        <p>Designed with EduFolio</p>
      </footer>
    </main>
  )
}

export default Portfolio
