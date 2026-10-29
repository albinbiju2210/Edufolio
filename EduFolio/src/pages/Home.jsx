import Navbar from '../components/Navbar'
import Overview from '../components/Overview'

function Home() {
  const portfolioUrl = `${window.location.origin}/portfolio/albin-biju`

  async function handleCopyPortfolio() {
    try {
      await navigator.clipboard.writeText(portfolioUrl)
      alert('Portfolio link copied!')
    } catch {
      window.prompt('Copy your portfolio link:', portfolioUrl)
    }
  }

  function handlePreviewPortfolio() {
    window.open(portfolioUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        <p className="eyebrow">YOUR JOURNEY, ORGANIZED</p>

        <h1>
          Every achievement.
          <br />
          <span>One portfolio.</span>
        </h1>

        <p className="description">
          Manage your projects, certifications, internships,
          and achievements in one place.
        </p>

        <div className="portfolio-actions">
          <button
            type="button"
            onClick={handlePreviewPortfolio}
            className="portfolio-button"
          >
            Preview Portfolio ↗
          </button>

          <button
            type="button"
            onClick={handleCopyPortfolio}
            className="portfolio-button portfolio-button--secondary"
          >
            Copy Portfolio Link
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/profile/edit/albin-biju'
            }}
            className="portfolio-button portfolio-button--secondary"
          >
            Edit Profile ✎
          </button>
        </div>

        <Overview />
      </main>

      <footer className="footer">
        EduFolio · Student Projects &amp; Achievement Management
      </footer>
    </div>
  )
}

export default Home
