Page({
  data: {
    loading: true,
    submitting: false,
    task: {},
    taskId: '',
    applyRemark: ''
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadTaskDetail()
  },

  onRemarkInput(e) {
    this.setData({ applyRemark: e.detail.value })
  },

  onCancel() {
    wx.navigateBack()
  },

  async loadTaskDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少任务ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const app = getApp()
    const res = await app.mpGetAuth(`/mp/repairTask/detail?id=${encodeURIComponent(taskId)}`)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ 
        task: res.result,
        loading: false
      })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  async onSubmit() {
    this.setData({ submitting: true })

    const app = getApp()
    const res = await app.mpPostAuth('/mp/repairTask/apply', {
      repairTaskId: this.data.taskId
    })

    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '申请成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '申请失败', icon: 'none' })
    }

    this.setData({ submitting: false })
  }
})
