Page({
  data: {
    loading: true,
    error: '',
    task: {},
    taskId: ''
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
    // 从申请/提报页返回时刷新详情
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
    wx.navigateTo({ url: `/pages/tab/work-order/maintenance-task-apply/maintenance-task-apply?id=${id}` })
  },

  onReport() {
    const id = encodeURIComponent(String(this.data.taskId))
    wx.navigateTo({ url: `/pages/tab/work-order/maintenance-task-report/maintenance-task-report?id=${id}` })
  },

  onComplete() {
    const taskId = this.data.taskId
    wx.showModal({
      title: '确认完成',
      content: '确定该维保任务已完工吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '提交中' })
        try {
          const app = getApp()
          const result = await app.mpPostAuth('/mp/maintenanceTask/complete', {
            taskId: String(taskId)
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

    const app = getApp()
    const res = await app.mpGetAuth(`/mp/maintenanceTask/detail?id=${encodeURIComponent(taskId)}`)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const task = res.result
      
      // 解析JSON字段
      if (task.applyBriefingFileUrls) {
        try {
          task.applyBriefingFileUrls = JSON.parse(task.applyBriefingFileUrls)
        } catch (e) {
          task.applyBriefingFileUrls = []
        }
      }
      if (task.applyMeasureFileUrls) {
        try {
          task.applyMeasureFileUrls = JSON.parse(task.applyMeasureFileUrls)
        } catch (e) {
          task.applyMeasureFileUrls = []
        }
      }
      if (task.reportCompletionFileUrls) {
        try {
          task.reportCompletionFileUrls = JSON.parse(task.reportCompletionFileUrls)
        } catch (e) {
          task.reportCompletionFileUrls = []
        }
      }
      if (task.reportMaterialJson) {
        try {
          task.reportMaterialJson = JSON.parse(task.reportMaterialJson)
        } catch (e) {
          task.reportMaterialJson = []
        }
      }
      
      // 区域：JSON数组转为 "-" 连接
      if (task.areaNames && typeof task.areaNames === 'string') {
        try {
          const arr = JSON.parse(task.areaNames)
          if (Array.isArray(arr) && arr.length > 0) {
            task.areaNames = arr.join('-')
          }
        } catch (e) {
          // 保持原样
        }
      }
      
      this.setData({ task: task, loading: false })
    } else {
      this.setData({ error: (res && res.errorMsg) || '加载失败', loading: false })
    }
  }
})
