/**
 * 拼接完整 URL
 */
function joinUrl(path) {
  // const baseURL = 'http://127.0.0.1:28201'
  const baseURL = 'https://tpaas-app-api-qa.fantuo.co/'
  if (!path.startsWith('/')) {
    return `${baseURL}/${path}`
  }
  return `${baseURL}${path}`
}

const TOKEN_KEY = 'tpaas_mp_access_token'

/**
 * GET 请求（带认证）
 */
export function mpGetAuth(path, params = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    
    // 拼接查询参数
    let url = joinUrl(path)
    const queryStrings = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    
    if (queryStrings.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryStrings.join('&')
    }
    
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // 未授权，清除登录信息并跳转登录页
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({
            url: '/pages/login/login/login'
          })
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(res.data.errorMsg || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * GET 请求（无认证）
 */
export function mpGet(path, params = {}) {
  return new Promise((resolve, reject) => {
    let url = joinUrl(path)
    const queryStrings = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    
    if (queryStrings.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryStrings.join('&')
    }
    
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.errorMsg || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * POST 请求（带认证）
 */
export function mpPostAuth(path, data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    
    wx.request({
      url: joinUrl(path),
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      data: data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({
            url: '/pages/login/login/login'
          })
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(res.data.errorMsg || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * POST 请求（无认证）
 */
export function mpPost(path, data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: joinUrl(path),
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.errorMsg || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * PUT 请求（带认证）
 */
export function mpPutAuth(path, data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    
    wx.request({
      url: joinUrl(path),
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      data: data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({
            url: '/pages/login/login/login'
          })
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(res.data.errorMsg || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 上传文件
 */
export function mpUploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    
    wx.uploadFile({
      url: joinUrl('/mp/file/upload'),
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({
            url: '/pages/login/login/login'
          })
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 下载文件
 */
export function mpDownloadFile(url) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    
    wx.downloadFile({
      url: joinUrl(url),
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.tempFilePath)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({
            url: '/pages/login/login/login'
          })
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}
