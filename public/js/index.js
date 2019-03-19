import ajax from './ajax-with-progress.js'

const { clientHeight } = document.documentElement

document.querySelector('body').style.height = `${clientHeight}px`

const form = document.querySelector('#form')
const userFile = document.querySelector('input[name="userFile"]')
const progress = document.querySelector('#uploadprogress')
const preview = document.querySelector('#preview')

// 对文件进行切片，初始化 formDatas
const initFormDatas = function (file) {
  const { size, name } = file
  const chopSize = 1 * 1024 * 1024
  const chopCount = Math.ceil(size / chopSize)
  const formDatas = []
  for (let i = 0; i < chopCount; i++) {
    const start = i * chopSize
    const end = Math.min(size, start + chopSize)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('index', i)
    formData.append('start', start)
    formData.append('data', file.slice(start, end))
    formDatas.push(formData)
  }
  return formDatas
}

// formDatas 分片上传
const uploadFile = function (url, formDatas) {
  const uploadStatus = []
  formDatas.forEach((data) => {
    const res = ajax(url, {
      method: 'POST',
      data,
      progress,
    })
    uploadStatus.push(res)
  })
  return uploadStatus
}

// 处理上传结果，都成功则跳转页面
const handleResults = function (uploadStatus) {
  Promise.all(uploadStatus)
    .then(results => results.map(e => e.text()))
    .then((res) => {
      if (res.every(e => e === 'succeed')) {
        window.location.href = `${window.location.origin}/succeed.html`
      }
    })
    .catch(e => console.log(e))
}

const upload = function (e) {
  e.preventDefault()
  const formDatas = initFormDatas(userFile.files[0])
  const uploadStatus = uploadFile(this.action, formDatas)
  handleResults(uploadStatus)
}

userFile.addEventListener('click', () => {
  progress.value = 0
})

form.addEventListener('submit', upload)

const handleFile = function (file) {
  preview.innerHTML = ''
  const imageType = /^image\//
  if (imageType.test(file.type)) {
    const reader = new FileReader()
    reader.onload = function (event) {
      const image = new Image()
      image.src = event.target.result
      image.width = 90
      image.height = 60
      preview.appendChild(image)
    }
    reader.readAsDataURL(file)
  }
}

userFile.addEventListener('change', function () {
  handleFile(this.files[0])
})

const holder = document.querySelector('#holder')

const dragover = function (e) {
  e.stopPropagation()
  e.preventDefault()
  this.className = 'hover'
}
const dragenter = function (e) {
  e.stopPropagation()
  e.preventDefault()
  this.className = ''
}
const drop = function (event) {
  event.preventDefault()
  this.className = ''
  const files = Array.from(event.dataTransfer.files)
  let allUploadStatus = []
  files.forEach((file) => {
    const formDatas = initFormDatas(file)
    const uploadStatus = uploadFile('http://localhost:8080/api/upload', formDatas)
    allUploadStatus.push(uploadStatus)
  })
  allUploadStatus = [].concat(...allUploadStatus)
  handleResults(allUploadStatus)
}

holder.addEventListener('dragenter', dragenter, false)
holder.addEventListener('dragover', dragover, false)
holder.addEventListener('drop', drop, false)
