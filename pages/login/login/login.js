const app = getApp()

// 草稿存储 key
const DRAFT_KEY = 'tpaas_mp_login_draft'

Page({
  data: {
    userName: '1232312321',
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
    const step1 = await app.mpPost('/mp/login/loginStep1', { userName: name, password: pwd })
    
    if (!step1 || step1.isSuccess !== 1) {
      this.showToast(step1?.errorMsg || '登录失败')
      this.setData({ loading: false })
      return
    }
    
    const tenants = step1.result?.tenantList || []
    if (tenants.length === 0) {
      this.showToast('无可用租户')
      this.setData({ loading: false })
      return
    }

    this.goPostStep1Flow(name, pwd, tenants)
    this.setData({ loading: false })
  }
})
