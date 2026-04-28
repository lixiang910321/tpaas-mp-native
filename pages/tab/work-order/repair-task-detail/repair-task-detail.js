Page({
  data: {
    loading: true,
    error: '',
    task: {},
    taskId: '',
    isConfirmEmployee: false
  },

  TASK_STATUS: {
    20: '待指派',
    30: '未开始',
    40: '已申请',
    50: '已提报',
    60: '已完成'
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadDetail()
  },

  onShow() {
    // 从申请/验收页返回时刷新详情
    if (this.data.taskId) {
      this.loadDetail()
    }
  },

  getStatusText(status) {
    return this.TASK_STATUS[status] || '-'
  },

  getStatusClass(status) {
    if (status === 60) return 'status-completed'
    if (status === 50) return 'status-reported'
    if (status === 40) return 'status-applied'
    return ''
  },

  formatTime(v) {
    if (!v) return '-'
    return String(v).slice(0, 19).replace('T', ' ')
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },

  onApply() {
    const id = encodeURIComponent(String(this.data.taskId))
    wx.navigateTo({ url: `/pages/tab/work-order/repair-task-apply/repair-task-apply?id=${id}` })
  },

  onReport() {
    const id = encodeURIComponent(String(this.data.taskId))
    wx.navigateTo({ url: `/pages/tab/work-order/repair-task-report/repair-task-report?id=${id}` })
  },

  onAccept() {
    const id = encodeURIComponent(String(this.data.taskId))
    wx.navigateTo({ url: `/pages/tab/work-order/repair-task-acceptance/repair-task-acceptance?id=${id}` })
  },

  onComplete() {
    const taskId = this.data.taskId
    wx.showModal({
      title: '确认完成',
      content: '确定该维修任务已完工吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '提交中' })
        try {
          const app = getApp()
          const result = await app.mpPostAuth('/mp/repairTask/complete', {
            repairTaskId: String(taskId)
          })

          if (result && Number(result.isSuccess) === 1) {
            wx.showToast({ title: '已完成', icon: 'success' })
            this.loadDetail()
          } else {
            wx.showToast({ title: (result && result.errorMsg) || '操作失败', icon: 'none' })
          }
        } catch (e) {
          wx.showToast({ title: e?.message || '网络错误', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  async loadDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false, error: '缺少任务ID' })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/repairTask/detail?id=${encodeURIComponent(taskId)}`)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const task = res.result
        
        // 解析JSON字段
        if (task.completionPhotoUrls) {
          try {
            task.completionPhotoUrls = JSON.parse(task.completionPhotoUrls)
          } catch (e) {
            task.completionPhotoUrls = []
          }
        }
        if (task.acceptancePhotoUrls) {
          try {
            task.acceptancePhotoUrls = JSON.parse(task.acceptancePhotoUrls)
          } catch (e) {
            task.acceptancePhotoUrls = []
          }
        }
        
        this.setData({ task: task })
        
        // 判断当前用户是否为确认人（控制验收按钮显隐）
        const app = getApp()
        const currentEmployeeId = app.globalData.employeeId
        const isConfirmEmployee = currentEmployeeId && task.confirmEmployeeId && 
          currentEmployeeId == task.confirmEmployeeId
        if (this.data.isConfirmEmployee !== isConfirmEmployee) {
          this.setData({ isConfirmEmployee })
        }
      } else {
        this.setData({ error: (res && res.errorMsg) || '加载失败' })
      }
    } catch (e) {
      this.setData({ error: e?.message || '网络错误' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
