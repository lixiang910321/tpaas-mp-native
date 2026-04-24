const app = getApp()

// 草稿存储 key
const DRAFT_KEY = 'tpaas_mp_login_draft'

Page({
  data: {
    // userName: '18221508122',
    // userName: '18516277726',
    // password: 'ys123456',
    // userName: '13521326548',
    // password: 'Aa123456',
    userName: '13521326548',
    password: 'Aa123456',
    
    loading: false
  },

  onLoad() {
    // 页面加载时的初始化逻辑
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
