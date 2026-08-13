/**
 * 拼接完整 URL
 */
function joinUrl(path) {
  // const baseURL = 'http://127.0.0.1:28201'
  const baseURL = 'https://tpaas-app-api-qa.fantuo.co/'
  // const baseURL = 'https://cywb-mp-api.fantuo.co/'

  
  if (!path.startsWith('/')) {
    return `${baseURL}/${path}`
  }
  return `${baseURL}${path}`
}

function sanitizeLogData(data) {
  try {
    const source = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.parse(JSON.stringify(source, (key, value) => {
      const normalizedKey = String(key).toLowerCase()
      if (normalizedKey.includes('token') || normalizedKey === 'authorization' || normalizedKey.includes('password') || normalizedKey.includes('secret')) {
        return '[REDACTED]'
      }
      return value
    }))
  } catch (e) {
    return data
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function buildCurlCommand(method, url, requestData, options = {}) {
  const curlMethod = method === 'UPLOAD' ? 'POST' : method === 'DOWNLOAD' ? 'GET' : method
  const parts = ['curl', '-X', curlMethod, shellQuote(url)]
  if (options.authenticated) {
    parts.push('-H', shellQuote('Authorization: Bearer [REDACTED]'))
  }
  if (method === 'UPLOAD') {
    parts.push('-F', shellQuote(`file=@${options.filePath || ''}`))
  } else if (curlMethod === 'POST' || curlMethod === 'PUT') {
    parts.push('-H', shellQuote('Content-Type: application/json'))
    parts.push('--data-raw', shellQuote(JSON.stringify(sanitizeLogData(requestData || {}))))
  }
  return parts.join(' ')
}

function logResponse(method, url, requestData, res, options = {}) {
  const logData = {
    request: {
      method,
      url,
      data: sanitizeLogData(requestData),
      curl: buildCurlCommand(method, url, requestData, options)
    },
    response: {
      statusCode: res.statusCode,
      data: sanitizeLogData(res.data)
    }
  }
  if (res.tempFilePath) {
    logData.response.tempFilePath = res.tempFilePath
  }
  console.log(`[网络请求响应] ${method} ${url}`, logData)
}

function logRequestFailure(method, url, requestData, err, options = {}) {
  console.error(`[网络请求失败] ${method} ${url}`, {
    request: {
      method,
      url,
      data: sanitizeLogData(requestData),
      curl: buildCurlCommand(method, url, requestData, options)
    },
    error: err
  })
}

/**
 * 全局错误处理 - 显示错误弹窗
 */
function showGlobalError(message) {
  if (!message || message === '服务异常') {
    message = '网络请求失败，请稍后重试'
  }
  wx.showModal({
    title: '提示',
    content: message,
    showCancel: false,
    confirmText: '我知道了'
  })
}

const TOKEN_KEY = 'tpaas_mp_access_token'

/**
 * 解析 JWT payload（不校验签名，仅用于本地过期判断）
 * 后端 hutool JWT 的 exp/iat 为秒级时间戳
 */
function parseJwtPayload(token) {
  try {
    const part = String(token || '').split('.')[1]
    if (!part) return null
    let base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) base64 += '='.repeat(4 - pad)
    const bytes = new Uint8Array(wx.base64ToArrayBuffer(base64))
    let str = ''
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i])
    }
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

/**
 * 本地判断 token 是否已过期（后端仍会再校验一次）
 */
export function isAccessTokenExpired(token) {
  const payload = parseJwtPayload(token)
  if (!payload || payload.exp == null) return true
  let expMs = Number(payload.exp)
  if (Number.isNaN(expMs)) {
    const t = Date.parse(payload.exp)
    if (Number.isNaN(t)) return true
    expMs = t
  } else if (expMs < 1e12) {
    // 秒级时间戳（hutool JWT）
    expMs = expMs * 1000
  }
  return Date.now() >= expMs
}

let handling401 = false

/**
 * 401 统一处理：清除所有登录信息并跳转登录页
 */
function handle401() {
  if (handling401) return
  handling401 = true
  try {
    const app = getApp()
    if (app && app.clearLoginInfo) {
      app.clearLoginInfo()
    }
  } catch (e) {
    // fallback：手动清除 storage
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync('tpaas_mp_user_info')
    wx.removeStorageSync('tpaas_mp_project')
    wx.removeStorageSync('tpaas_mp_tenant')
  }
  wx.reLaunch({
    url: '/pages/login/login/login',
    complete: () => {
      // 允许下次过期再次触发
      setTimeout(() => {
        handling401 = false
      }, 800)
    }
  })
}

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
        logResponse('GET', url, params, res, { authenticated: true })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务错误
          if (res.data && Number(res.data.isSuccess) !== 1) {
            const errorMsg = res.data.errorMsg || '操作失败'
            showGlobalError(errorMsg)
            reject(new Error(errorMsg))
          } else {
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          handle401()
          reject(new Error('未登录或登录已过期'))
        } else {
          const errorMsg = res.data.errorMsg || `HTTP ${res.statusCode}`
          showGlobalError(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        logRequestFailure('GET', url, params, err, { authenticated: true })
        showGlobalError('网络请求失败')
        reject(err)
      }
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
        logResponse('GET', url, params, res)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务错误
          if (res.data && Number(res.data.isSuccess) !== 1) {
            const errorMsg = res.data.errorMsg || '操作失败'
            showGlobalError(errorMsg)
            reject(new Error(errorMsg))
          } else {
            resolve(res.data)
          }
        } else {
          const errorMsg = res.data.errorMsg || `HTTP ${res.statusCode}`
          showGlobalError(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        logRequestFailure('GET', url, params, err)
        showGlobalError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * POST 请求（带认证）
 */
export function mpPostAuth(path, data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    const url = joinUrl(path)
    
    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      data: data,
      success: (res) => {
        logResponse('POST', url, data, res, { authenticated: true })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务错误
          if (res.data && Number(res.data.isSuccess) !== 1) {
            const errorMsg = res.data.errorMsg || '操作失败'
            showGlobalError(errorMsg)
            reject(new Error(errorMsg))
          } else {
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          handle401()
          reject(new Error('未登录或登录已过期'))
        } else {
          const errorMsg = res.data.errorMsg || `HTTP ${res.statusCode}`
          showGlobalError(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        logRequestFailure('POST', url, data, err, { authenticated: true })
        showGlobalError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * POST 请求（无认证）
 */
export function mpPost(path, data = {}) {
  return new Promise((resolve, reject) => {
    const url = joinUrl(path)

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      success: (res) => {
        logResponse('POST', url, data, res)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务错误
          if (res.data && Number(res.data.isSuccess) !== 1) {
            const errorMsg = res.data.errorMsg || '操作失败'
            showGlobalError(errorMsg)
            reject(new Error(errorMsg))
          } else {
            resolve(res.data)
          }
        } else {
          const errorMsg = res.data.errorMsg || `HTTP ${res.statusCode}`
          showGlobalError(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        logRequestFailure('POST', url, data, err)
        showGlobalError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * PUT 请求（带认证）
 */
export function mpPutAuth(path, data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    const url = joinUrl(path)
    
    wx.request({
      url: url,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      data: data,
      success: (res) => {
        logResponse('PUT', url, data, res, { authenticated: true })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务错误
          if (res.data && Number(res.data.isSuccess) !== 1) {
            const errorMsg = res.data.errorMsg || '操作失败'
            showGlobalError(errorMsg)
            reject(new Error(errorMsg))
          } else {
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          handle401()
          reject(new Error('未登录或登录已过期'))
        } else {
          const errorMsg = res.data.errorMsg || `HTTP ${res.statusCode}`
          showGlobalError(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        logRequestFailure('PUT', url, data, err, { authenticated: true })
        showGlobalError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * 上传文件
 */
export function mpUploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    const url = joinUrl('/mp/file/upload')
    
    wx.uploadFile({
      url: url,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        logResponse('UPLOAD', url, { filePath }, res, { authenticated: true, filePath })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else if (res.statusCode === 401) {
          handle401()
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        logRequestFailure('UPLOAD', url, { filePath }, err, { authenticated: true, filePath })
        reject(err)
      }
    })
  })
}

/**
 * 下载文件
 */
export function mpDownloadFile(url) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    const requestUrl = joinUrl(url)
    
    wx.downloadFile({
      url: requestUrl,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        logResponse('DOWNLOAD', requestUrl, {}, res, { authenticated: true })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.tempFilePath)
        } else if (res.statusCode === 401) {
          handle401()
          reject(new Error('未登录或登录已过期'))
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        logRequestFailure('DOWNLOAD', requestUrl, {}, err, { authenticated: true })
        reject(err)
      }
    })
  })
}

