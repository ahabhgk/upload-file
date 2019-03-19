import ajax from './ajax-with-progress.js'

const box = document.querySelector('#box')

ajax('/api/view').then((res) => { box.innerHTML = res.text() })
