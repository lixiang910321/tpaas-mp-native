const { isAccessTokenExpired } = require('../../utils/request')

const HOME_URL = '/pages/tab/work-order/index/index'
const LOGIN_URL = '/pages/login/login/login'

Page({
  onLoad() {
    this.routeByToken()
  },

  routeByToken() {
    const token = wx.getStorageSync('tpaas_mp_access_token')
    if (!token || isAccessTokenExpired(token)) {
      try {
        const app = getApp()
        if (app && app.clearLoginInfo && token) {
          app.clearLoginInfo()
        }
      } catch (e) {
        // ignore
      }
      wx.reLaunch({ url: LOGIN_URL })
      return
    }

    const app = getApp()
    if (app && !app.globalData.token) {
      app.globalData.token = token
      app.globalData.userInfo = wx.getStorageSync('tpaas_mp_user_info')
      app.globalData.currentProject = wx.getStorageSync('tpaas_mp_project')
      app.globalData.currentTenant = wx.getStorageSync('tpaas_mp_tenant')
      const userInfo = app.globalData.userInfo
      app.globalData.employeeId = userInfo?.employeeId ? String(userInfo.employeeId) : null
      app.globalData.laborersId = userInfo?.laborersId ? String(userInfo.laborersId) : null
      if (app.globalData.currentProject && app.globalData.currentProject.id != null) {
        app.globalData.projectId = app.globalData.currentProject.id
      }
    }
    wx.reLaunch({ url: HOME_URL })
  }
})
