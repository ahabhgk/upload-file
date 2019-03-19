const querystring = require('querystring')

const parseBinary = function (file, body, boundary) {
  const entireData = body.toString()
  const contentType = file['Content-Type'].substring(1)
  // 获取文件二进制数据开始位置，即contentType的结尾
  const upperBoundary = entireData.indexOf(contentType) + contentType.length
  const shorterData = entireData.substring(upperBoundary)
  // 替换开始位置的空格
  const binaryDataAlmost = shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
  // 去除数据末尾的额外数据，即: "--"+ boundary + "--"
  const binaryData = binaryDataAlmost.substring(0, binaryDataAlmost.indexOf(`--${boundary}--`))
  return binaryData
}

function parseFile(req) {
  return new Promise((resolve) => {
    req.setEncoding('binary')
    let body = ''
    // 边界字符串
    const boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '')
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      const data = body.split(`--${boundary}`)
      // eslint-disable-next-line prefer-destructuring
      const file = querystring.parse(data[4], '\r\n', ':')
      const fileName = data[1].split('\r\n')[3]
      const fileIndex = data[2].split('\r\n')[3]

      const chopedData = {
        fileName,
        fileIndex,
        fileStart: data[3].split('\r\n')[3],
        fileBinaryData: parseBinary(file, body, boundary),
      }
      resolve(chopedData)
    })
  })
}

module.exports = {
  parseFile,
}
