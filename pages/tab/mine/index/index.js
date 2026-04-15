Page({
  data: {
    userInfo: null,
    currentProject: null,
    currentTenant: null
  },

  onShow() {
    // 每次显示时刷新，切换项目后能立即看到变化
    this._loadInfo()
  },

  _loadInfo() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    const currentProject = app.globalData.currentProject
    const currentTenant = app.globalData.currentTenant
    this.setData({ userInfo, currentProject, currentTenant })
  },

  // 切换项目
  onSwitchProject() {
    wx.navigateTo({ url: '/pages/login/switch-project/switch-project' })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearLoginInfo()
          wx.reLaunch({ url: '/pages/login/login/login' })
        }
      }
    })
  }
})

