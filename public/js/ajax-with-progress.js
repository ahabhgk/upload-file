/**
 * An promisify ajax function
 * @param {String} baseUrl An url.
 * @param {Object} options Define request's method, data, headers, progress tag...(unfinish)
 * @return {Object} There are three functions to process the response data into text,json and blob.
 */
export default function (baseUrl, options = {}) {
  const opts = {
    method: (options.method || 'GET').toUpperCase(),
    data: options.data || '',
    headers: options.headers || '',
    progress: options.progress || null,
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.onreadystatechange = () => {
      if (request.readyState === 4
        && (request.status >= 200 || request.status < 300 || request.status === 304)) {
        resolve({
          text: () => request.responseText,
          json: () => JSON.parse(request.responseText),
          blob: () => new Blob([request.response]),
        })
      }
    }
    if (opts.progress) {
      request.upload.onprogress = (event) => {
        opts.progress.value = event.loaded / event.total * 100
      }
    }
    request.onerror = () => {
      reject(new Error('Ajax request failed...'))
    }
    if (opts.method === 'GET') {
      const dataStr = opts.data ? `?${Object.entries(opts.data).map(data => data.join('=')).join('&')}` : ''
      request.open(opts.method, baseUrl + dataStr, true)
      request.send()
    } else if (opts.method === 'POST') {
      request.open(opts.method, baseUrl, true)
      // request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      if (opts.headers) {
        Object.entries(opts.headers).forEach((header) => {
          const [key, value] = header
          request.setRequestHeader(key, value)
        })
      }
      request.send(opts.data)
    }
  })
}
