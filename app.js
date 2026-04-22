// 引入网络请求工具
const request = require('./utils/request.js')

App({
  globalData: {
    token: '',
    userInfo: null,
    currentProject: null,
    currentTenant: null,
    employeeId: null,
    laborersId: null,
    projectId: null,
    dictCache: {} // 字典缓存 { dictCode: [items] }
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('tpaas_mp_access_token')
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = wx.getStorageSync('tpaas_mp_user_info')
      this.globalData.currentProject = wx.getStorageSync('tpaas_mp_project')
      this.globalData.currentTenant = wx.getStorageSync('tpaas_mp_tenant')
    }
  },

  // ========== 全局网络请求方法（所有页面可直接调用 getApp().xxx） ==========
  
  // GET 请求（带认证）
  mpGetAuth: request.mpGetAuth,
  
  // GET 请求（无认证）
  mpGet: request.mpGet,
  
  // POST 请求（带认证）
  mpPostAuth: request.mpPostAuth,
  
  // POST 请求（无认证）
  mpPost: request.mpPost,
  
  // PUT 请求（带认证）
  mpPutAuth: request.mpPutAuth,
  
  // 上传文件
  mpUploadFile: request.mpUploadFile,
  
  // 下载文件
  mpDownloadFile: request.mpDownloadFile,

  // 全局方法 - 检查登录
  checkLogin() {
    return !!this.globalData.token
  },

  // 全局方法 - 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 全局方法 - 设置登录信息
  setLoginInfo(data) {
    this.globalData.token = data.token
    this.globalData.userInfo = data.userInfo
    wx.setStorageSync('tpaas_mp_access_token', data.token)
    wx.setStorageSync('tpaas_mp_user_info', data.userInfo)
  },

  // 全局方法 - 设置项目信息
  setProjectInfo(project) {
    this.globalData.currentProject = project
    this.globalData.projectId = project.id
    wx.setStorageSync('tpaas_mp_project', project)
  },

  // 全局方法 - 设置租户信息
  setTenantInfo(tenant) {
    this.globalData.currentTenant = tenant
    wx.setStorageSync('tpaas_mp_tenant', tenant)
  },

  // 全局方法 - 清除登录信息
  clearLoginInfo() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    this.globalData.currentProject = null
    this.globalData.currentTenant = null
    this.globalData.employeeId = null
    this.globalData.laborersId = null
    this.globalData.projectId = null
    wx.removeStorageSync('tpaas_mp_access_token')
    wx.removeStorageSync('tpaas_mp_user_info')
    wx.removeStorageSync('tpaas_mp_project')
    wx.removeStorageSync('tpaas_mp_tenant')
  },

  // 全局方法 - 获取字典（带缓存）
  async getDict(dictCode) {
    // 先从缓存取
    if (this.globalData.dictCache[dictCode]) {
      return this.globalData.dictCache[dictCode]
    }

    // 缓存没有，请求所有字典
    try {
      const res = await this.mpGetAuth('/mp/sys/Dict/all')
      if (res && res.isSuccess && res.result) {
        // 缓存所有字典
        const allDicts = res.result
        for (const key in allDicts) {
          this.globalData.dictCache[key] = allDicts[key]
        }
        // 返回需要的字典
        return this.globalData.dictCache[dictCode] || []
      }
      return []
    } catch (e) {
      console.error(`获取字典${dictCode}失败`, e)
      return []
    }
  },

  // 全局方法 - 预加载字典
  async preloadDicts(dictCodes) {
    const promises = dictCodes.map(code => this.getDict(code))
    return Promise.all(promises)
  },

  // 全局方法 - 根据字典和ID获取值
  getDictLabel(dictCode, id) {
    const dict = this.globalData.dictCache[dictCode]
    if (!dict || !Array.isArray(dict)) return ''
    
    const item = dict.find(item => item.id == id)
    return item ? (item.value || item.desc || '') : ''
  }
})
