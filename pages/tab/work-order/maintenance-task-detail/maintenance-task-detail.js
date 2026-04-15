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
      
      this.setData({ task: task, loading: false })
    } else {
      this.setData({ error: (res && res.errorMsg) || '加载失败', loading: false })
    }
  }
})
