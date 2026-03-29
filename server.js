import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()
app.use(cors())

const upload = multer({ dest: 'uploads/' })

app.post('/parse', upload.single('image'), (req, res) => {
  const imagePath = req.file.path

  exec(`python src/python/parse.py ${imagePath}`, (error, stdout) => {
    if (error) {
      console.error(error)
      res.status(500).json({ error: 'Python script failed' })
      return
    }
    res.json(JSON.parse(stdout))
  })
})

app.listen(5000, () => console.log('Server running on port 5000'))