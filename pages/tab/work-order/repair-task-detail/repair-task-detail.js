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
        this.setData({ task: res.result })
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
