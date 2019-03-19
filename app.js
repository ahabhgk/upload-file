/* eslint-disable consistent-return */
/* eslint-disable indent */
/* eslint-disable array-callback-return */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { parseFile } = require('./parseFile.js')

// const username = ''

const handleSpecial = function (requestUrl) {
  if (requestUrl === '/') return '/public/index.html'
  if (requestUrl.slice(0, 3) === '/db') return requestUrl
  return `/public/${requestUrl}`
}

const handleRequst = function (requestUrl) {
  const filePath = path.join(__dirname, handleSpecial(requestUrl))
  const extname = path.extname(filePath)
  let contentType
  switch (extname) {
  case '.js':
    contentType = 'text/javascript'
    break
  case '.css':
    contentType = 'text/css'
    break
  case '.json':
    contentType = 'application/json'
    break
  case '.png':
    contentType = 'image/png'
    break
  case '.jpg':
    contentType = 'image/jpg'
    break
  default:
    contentType = 'text/html'
    break
  }
  return {
    filePath,
    contentType,
  }
}

const serverError = function (response, error) {
  response.statusCode = 500
  response.end(`<h1>Internal server error: ${error.code}</h1>`)
}

const fail = function (response, error) {
  response.statusCode = 500
  response.end(`<h1>Upload failed, error: ${error.code}</h1>`)
}

const notFound = function (response) {
  response.statusCode = 404
  response.end('<h1>404 not found...</h1>')
}

const returnPage = function (filePath, contentType, stat, response) {
  response.writeHead(200, {
    'Content-Length': stat.size,
    'Content-Type': contentType,
  })
  const stream = fs.createReadStream(filePath)
  stream.pipe(response)
  stream.on('error', err => serverError(response, err))
}

const handlePage = function (filePath, contentType, response) {
  fs.stat(filePath, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        notFound(response)
      } else {
        serverError(response, err)
      }
    } else {
      returnPage(filePath, contentType, stat, response)
    }
  })
}

const server = http.createServer(async (req, res) => {
  const { filePath, contentType } = handleRequst(req.url)
  if (req.url === '/api/upload') {
    const chopedFiles = []
    chopedFiles.push(await parseFile(req))
    chopedFiles.sort((a, b) => a.fileIndex - b.fileIndex).forEach((file) => {
      const stream = fs.createWriteStream(`./db/${file.fileName}`, { encoding: 'binary', start: parseInt(file.fileStart, 10) })
      stream.write(file.fileBinaryData)
      stream.on('error', (err) => {
        fail(res, err)
      })
      stream.on('finish', () => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('succeed')
      })
      stream.end()
    })
  } else if (req.url === '/api/view') {
    // eslint-disable-next-line consistent-return
    fs.readdir(path.join(__dirname, '/db'), (err, files) => {
      if (err) return fail(res, err)
      const html = files.map((file) => {
        if (['.jpg', '.gif', '.png'].includes(file.slice(-4))) return `<div class="wrap"><img class="img" src="${path.join('/db', file)}" /></div>`
      }).join('')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
    })
  } else {
    handlePage(filePath, contentType, res)
  }
})

const PORT = process.env.PORT || 8080

server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`))
