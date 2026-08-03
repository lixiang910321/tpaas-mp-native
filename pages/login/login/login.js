const app = getApp()
const { isAccessTokenExpired } = require('../../../utils/request')

// 草稿存储 key
const DRAFT_KEY = 'tpaas_mp_login_draft'

Page({
  data: {
    // userName: '18221508122',
    // userName: '18516277726',
    // password: 'ys123456',
    // userName: '13521326548',
    // password: 'Aa123456',
    // userName: '18221508122',
    // password: 'wxy123123',
      userName: '',
      password: '',
    
    loading: false
  },

  onLoad() {
    this.tryAutoEnter()
  },

  onShow() {
    this.tryAutoEnter()
  },

  // 已有本地未过期 token 时直接进入业务页（remember=1 为 7 天，否则 3 小时）
  tryAutoEnter() {
    const token = wx.getStorageSync('tpaas_mp_access_token')
    if (!token) return
    // 本地先看 exp，过期则清登录态，停留登录页（避免先进业务页再被 401 踢回）
    if (isAccessTokenExpired(token)) {
      const appInst = getApp()
      if (appInst && appInst.clearLoginInfo) {
        appInst.clearLoginInfo()
      }
      return
    }
    const appInst = getApp()
    if (appInst && !appInst.globalData.token) {
      appInst.globalData.token = token
      appInst.globalData.userInfo = wx.getStorageSync('tpaas_mp_user_info')
      appInst.globalData.currentProject = wx.getStorageSync('tpaas_mp_project')
      appInst.globalData.currentTenant = wx.getStorageSync('tpaas_mp_tenant')
      const userInfo = appInst.globalData.userInfo
      appInst.globalData.employeeId = userInfo?.employeeId ? String(userInfo.employeeId) : null
      appInst.globalData.laborersId = userInfo?.laborersId ? String(userInfo.laborersId) : null
    }
    wx.reLaunch({ url: '/pages/tab/work-order/index/index' })
  },

  // 手机号输入
  onUserNameInput(e) {
    this.setData({
      userName: e.detail.value
    })
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 显示提示
  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  },

  // 进入第一步流程
  goPostStep1Flow(name, pwd, tenants) {
    const draft = { userName: name, password: pwd, tenantList: tenants }
    wx.removeStorageSync(DRAFT_KEY)
    wx.setStorageSync(DRAFT_KEY, draft)
    wx.navigateTo({ url: '/pages/login/select-tenant/select-tenant' })
  },

  // 提交登录
  async onSubmit() {
    const name = this.data.userName.trim()
    const pwd = this.data.password
    
    if (!name) {
      this.showToast('请输入手机号')
      return
    }
    if (!pwd) {
      this.showToast('请输入密码')
      return
    }

    this.setData({ loading: true })
    try {
      const step1 = await app.mpPost('/mp/login/loginStep1', { userName: name, password: pwd })
      
      const tenants = step1?.result?.tenantList || []
      if (tenants.length === 0) {
        this.showToast('无可用租户')
        return
      }

      this.goPostStep1Flow(name, pwd, tenants)
    } catch (e) {
      // showGlobalError 已在 request.js 中处理，此处无需重复弹窗
      console.error('登录step1失败', e)
    } finally {
      this.setData({ loading: false })
    }
  }
})
