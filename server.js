import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { exec } from 'child_process'
import fs from 'fs'

const app = express()
app.use(cors())

const upload = multer({ dest: 'uploads/' })

app.post('/parse', upload.single('image'), (req, res) => {
  const imagePath = req.file.path

  exec(`python src/python/parse.py ${imagePath}`, (error, stdout) => {
    if (error) {
      console.error(error)
      fs.unlink(imagePath, () => {})
      res.status(500).json({ error: 'Python script failed' })
      return
    }

    // send response first
    res.json(JSON.parse(stdout))

    // delete file after response is sent
    fs.unlink(imagePath, () => {})
  })
})

app.listen(5000, () => console.log('Server running on port 5000'))