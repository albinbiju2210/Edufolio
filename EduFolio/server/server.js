
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('./db')
require('dotenv').config()

const app = express()

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Create the certification image upload folder
const certificationUploadDir = path.join(
  __dirname,
  'uploads',
  'certifications'
)

fs.mkdirSync(certificationUploadDir, { recursive: true })

// Configure where certification images are stored
const certificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificationUploadDir)
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const filename = `certificate-${Date.now()}${extension}`

    cb(null, filename)
  },
})

// Accept images only, with a 5 MB limit
const certificationUpload = multer({
  storage: certificationStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'))
    }
  },
})

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS connected')

    res.json({
      message: 'EduFolio database connected successfully!',
      result: rows[0],
    })
  } catch (error) {
    console.error('Database connection error:', error.message)
    res.status(500).json({
      message: 'Database connection failed',
    })
  }
})

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the EduFolio API',
  })
})

app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await db.query(
      'SELECT id, title, category, description, status, created_at FROM projects ORDER BY id DESC'
    )

    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error.message)
    res.status(500).json({
      message: 'Failed to fetch projects',
    })
  }
})

app.post('/api/projects', async (req, res) => {
  const { title, category, description, status } = req.body || {}

  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Title and category are required',
    })
  }

  const allowedStatuses = ['Planned', 'In Progress', 'Completed']
  const projectStatus = status || 'Planned'

  if (!allowedStatuses.includes(projectStatus)) {
    return res.status(400).json({
      message: 'Invalid project status',
    })
  }

  try {
    const [result] = await db.query(
      `INSERT INTO projects (title, category, description, status)
       VALUES (?, ?, ?, ?)`,
      [
        title.trim(),
        category.trim(),
        description?.trim() || null,
        projectStatus,
      ]
    )

    const [rows] = await db.query(
      `SELECT id, title, category, description, status, created_at
       FROM projects WHERE id = ?`,
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('Error creating project:', error.message)
    res.status(500).json({
      message: 'Failed to create project',
    })
  }
})

app.put('/api/projects/:id', async (req, res) => {
  const { title, category, description, status } = req.body || {}
  const id = Number(req.params.id)
  const allowedStatuses = ['Planned', 'In Progress', 'Completed']

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid project ID' })
  }

  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Title and category are required',
    })
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid project status' })
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Project not found' })
    }

    await db.query(
      `UPDATE projects
       SET title = ?, category = ?, description = ?, status = ?
       WHERE id = ?`,
      [title.trim(), category.trim(), description?.trim() || null, status, id]
    )

    const [rows] = await db.query(
      `SELECT id, title, category, description, status, created_at
       FROM projects WHERE id = ?`,
      [id]
    )

    res.json(rows[0])
  } catch (error) {
    console.error('Error updating project:', error.message)
    res.status(500).json({ message: 'Failed to update project' })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid project ID' })
  }

  try {
    const [result] = await db.query(
      'DELETE FROM projects WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting project:', error.message)
    res.status(500).json({ message: 'Failed to delete project' })
  }
})

app.get('/api/achievements', async (req, res) => {
  try {
    const [achievements] = await db.query(
      `SELECT id, title, category, organization, description,
              achievement_date, created_at
       FROM achievements
       ORDER BY id DESC`
    )

    res.json(achievements)
  } catch (error) {
    console.error('Error fetching achievements:', error.message)
    res.status(500).json({
      message: 'Failed to fetch achievements',
    })
  }
})

app.post('/api/achievements', async (req, res) => {
  const {
    title,
    category,
    organization,
    description,
    achievement_date,
  } = req.body || {}

  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Title and category are required',
    })
  }

  try {
    const [result] = await db.query(
      `INSERT INTO achievements
       (title, category, organization, description, achievement_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category.trim(),
        organization?.trim() || null,
        description?.trim() || null,
        achievement_date || null,
      ]
    )

    const [rows] = await db.query(
      `SELECT id, title, category, organization, description,
              achievement_date, created_at
       FROM achievements
       WHERE id = ?`,
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('Error creating achievement:', error.message)
    res.status(500).json({
      message: 'Failed to create achievement',
    })
  }
})

app.put('/api/achievements/:id', async (req, res) => {
  const id = Number(req.params.id)
  const {
    title,
    category,
    organization,
    description,
    achievement_date,
  } = req.body || {}

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid achievement ID' })
  }

  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Title and category are required',
    })
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM achievements WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Achievement not found' })
    }

    await db.query(
      `UPDATE achievements
       SET title = ?, category = ?, organization = ?,
           description = ?, achievement_date = ?
       WHERE id = ?`,
      [
        title.trim(),
        category.trim(),
        organization?.trim() || null,
        description?.trim() || null,
        achievement_date || null,
        id,
      ]
    )

    const [rows] = await db.query(
      `SELECT id, title, category, organization, description,
              achievement_date, created_at
       FROM achievements WHERE id = ?`,
      [id]
    )

    res.json(rows[0])
  } catch (error) {
    console.error('Error updating achievement:', error.message)
    res.status(500).json({ message: 'Failed to update achievement' })
  }
})

app.delete('/api/achievements/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid achievement ID' })
  }

  try {
    const [result] = await db.query(
      'DELETE FROM achievements WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Achievement not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting achievement:', error.message)
    res.status(500).json({ message: 'Failed to delete achievement' })
  }
})

app.get('/api/certifications', async (req, res) => {
  try {
    const [certifications] = await db.query(
      `SELECT id, title, issuing_organization, credential_id,
              credential_url, issue_date, expiry_date,
              description, image_path, created_at
       FROM certifications
       ORDER BY id DESC`
    )

    res.json(certifications)
  } catch (error) {
    console.error('Error fetching certifications:', error.message)
    res.status(500).json({
      message: 'Failed to fetch certifications',
    })
  }
})

app.post(
  '/api/certifications',
  certificationUpload.single('certificateImage'),
  async (req, res) => {
    const {
      title,
      issuing_organization,
      credential_id,
      credential_url,
      issue_date,
      expiry_date,
      description,
    } = req.body || {}

    if (!title?.trim() || !issuing_organization?.trim()) {
      return res.status(400).json({
        message: 'Title and issuing organization are required',
      })
    }

    const imagePath = req.file
      ? `/uploads/certifications/${req.file.filename}`
      : null

    try {
      const [result] = await db.query(
        `INSERT INTO certifications
         (title, issuing_organization, credential_id, credential_url,
          issue_date, expiry_date, description, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          issuing_organization.trim(),
          credential_id?.trim() || null,
          credential_url?.trim() || null,
          issue_date || null,
          expiry_date || null,
          description?.trim() || null,
          imagePath,
        ]
      )

      const [rows] = await db.query(
        `SELECT id, title, issuing_organization, credential_id,
                credential_url, issue_date, expiry_date,
                description, image_path, created_at
         FROM certifications
         WHERE id = ?`,
        [result.insertId]
      )

      res.status(201).json(rows[0])
    } catch (error) {
      console.error('Error creating certification:', error.message)
      res.status(500).json({
        message: 'Failed to create certification',
      })
    }
  }
)

function removeCertificationImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/certifications/')) {
    return
  }

  const filename = path.basename(imagePath)
  const filePath = path.join(
    certificationUploadDir,
    filename
  )

  fs.unlink(filePath, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('Could not remove certification image:', error.message)
    }
  })
}

// UPDATE certification
app.put(
  '/api/certifications/:id',
  certificationUpload.single('certificateImage'),
  async (req, res) => {
    const id = Number(req.params.id)
    const {
      title,
      issuing_organization,
      credential_id,
      credential_url,
      issue_date,
      expiry_date,
      description,
    } = req.body || {}

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid certification ID' })
    }

    if (!title?.trim() || !issuing_organization?.trim()) {
      return res.status(400).json({
        message: 'Title and issuing organization are required',
      })
    }

    try {
      const [existingRows] = await db.query(
        'SELECT image_path FROM certifications WHERE id = ?',
        [id]
      )

      if (existingRows.length === 0) {
        return res.status(404).json({ message: 'Certification not found' })
      }

      const oldImagePath = existingRows[0].image_path
      const newImagePath = req.file
        ? `/uploads/certifications/${req.file.filename}`
        : oldImagePath

      await db.query(
        `UPDATE certifications
         SET title = ?, issuing_organization = ?, credential_id = ?,
             credential_url = ?, issue_date = ?, expiry_date = ?,
             description = ?, image_path = ?
         WHERE id = ?`,
        [
          title.trim(),
          issuing_organization.trim(),
          credential_id?.trim() || null,
          credential_url?.trim() || null,
          issue_date || null,
          expiry_date || null,
          description?.trim() || null,
          newImagePath,
          id,
        ]
      )

      const [rows] = await db.query(
        `SELECT id, title, issuing_organization, credential_id,
                credential_url, issue_date, expiry_date,
                description, image_path, created_at
         FROM certifications
         WHERE id = ?`,
        [id]
      )

      if (req.file && oldImagePath && oldImagePath !== newImagePath) {
        removeCertificationImage(oldImagePath)
      }

      res.json(rows[0])
    } catch (error) {
      console.error('Error updating certification:', error.message)
      res.status(500).json({ message: 'Failed to update certification' })
    }
  }
)

// DELETE certification
app.delete('/api/certifications/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid certification ID' })
  }

  try {
    const [rows] = await db.query(
      'SELECT image_path FROM certifications WHERE id = ?',
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification not found' })
    }

    await db.query(
      'DELETE FROM certifications WHERE id = ?',
      [id]
    )

    removeCertificationImage(rows[0].image_path)

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting certification:', error.message)
    res.status(500).json({ message: 'Failed to delete certification' })
  }
})

app.get('/api/portfolio/:username', async (req, res) => {
  const { username } = req.params

  try {
    const [profiles] = await db.query(
      `SELECT username, full_name, headline, bio,
              profile_image, github_url, linkedin_url,
              website_url, email
       FROM student_profiles
       WHERE username = ? AND is_public = TRUE`,
      [username]
    )

    if (profiles.length === 0) {
      return res.status(404).json({
        message: 'Public portfolio not found',
      })
    }

    const profile = profiles[0]

    const [projects] = await db.query(
      `SELECT id, title, category, description, status, created_at
       FROM projects
       ORDER BY id DESC`
    )

    const [achievements] = await db.query(
      `SELECT id, title, category, organization,
              description, achievement_date
       FROM achievements
       ORDER BY id DESC`
    )

    const [certifications] = await db.query(
      `SELECT id, title, issuing_organization,
              credential_id, credential_url, issue_date,
              expiry_date, description, image_path
       FROM certifications
       ORDER BY id DESC`
    )

    res.json({
      profile,
      projects,
      achievements,
      certifications,
    })
  } catch (error) {
    console.error('Error loading public portfolio:', error.message)

    res.status(500).json({
      message: 'Failed to load public portfolio',
    })
  }
})

app.put(
  '/api/student-profiles/:username',
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const profileDir = path.join(__dirname, 'uploads', 'profiles')
        fs.mkdirSync(profileDir, { recursive: true })
        cb(null, profileDir)
      },
      filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase()
        cb(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`)
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (allowed.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Only JPG, PNG, and WebP images are allowed'))
      }
    },
  }).single('profileImage'),
  async (req, res) => {
    const { username } = req.params
    const {
      full_name,
      headline,
      bio,
      github_url,
      linkedin_url,
      website_url,
    } = req.body || {}

    if (!full_name?.trim()) {
      return res.status(400).json({ message: 'Full name is required' })
    }

    try {
      const [profiles] = await db.query(
        `SELECT id, profile_image
         FROM student_profiles
         WHERE username = ?`,
        [username]
      )

      if (profiles.length === 0) {
        return res.status(404).json({ message: 'Student profile not found' })
      }

      const oldImage = profiles[0].profile_image
      const profileImage = req.file
        ? `/uploads/profiles/${req.file.filename}`
        : oldImage

      await db.query(
        `UPDATE student_profiles
         SET full_name = ?, headline = ?, bio = ?,
             github_url = ?, linkedin_url = ?, website_url = ?,
             profile_image = ?
         WHERE username = ?`,
        [
          full_name.trim(),
          headline?.trim() || null,
          bio?.trim() || null,
          github_url?.trim() || null,
          linkedin_url?.trim() || null,
          website_url?.trim() || null,
          profileImage,
          username,
        ]
      )

      if (
        req.file &&
        oldImage &&
        oldImage.startsWith('/uploads/profiles/')
      ) {
        const oldFile = path.join(
          __dirname,
          'uploads',
          'profiles',
          path.basename(oldImage)
        )
        fs.unlink(oldFile, (error) => {
          if (error && error.code !== 'ENOENT') {
            console.error('Could not remove old profile image:', error.message)
          }
        })
      }

      const [updated] = await db.query(
        `SELECT username, full_name, headline, bio, profile_image,
                github_url, linkedin_url, website_url, is_public
         FROM student_profiles
         WHERE username = ?`,
        [username]
      )

      res.json(updated[0])
    } catch (error) {
      console.error('Error updating student profile:', error.message)
      res.status(500).json({ message: 'Failed to update student profile' })
    }
  }
)

app.listen(PORT, () => {
  console.log(`EduFolio API running at http://localhost:${PORT}`)
})
