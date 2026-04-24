Page({
  data: {
    loading: true,
    error: '',
    tasks: [],
    workOrderId: ''
  },

  onLoad(options) {
    const workOrderId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ workOrderId })
    this.loadDetail()
  },

  onShow() {
    // 从任务详情页返回时刷新
    if (this.data.workOrderId) {
      this.loadDetail()
    }
  },

  // 查看任务详情
  onTaskDetail(e) {
    const t = e.currentTarget.dataset.item
    
    if (!t || t.taskId == null || t.taskId === '') {
      wx.showToast({ title: '任务数据异常', icon: 'none' })
      return
    }
    
    const id = encodeURIComponent(String(t.taskId))
    
    // 根据任务类型跳转不同页面
    if (t.taskType === 20) {
      // 维保任务
      wx.navigateTo({ 
        url: `/pages/tab/work-order/maintenance-task-detail/maintenance-task-detail?id=${id}`,
        fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
      })
    } else {
      // 维修任务
      wx.navigateTo({ 
        url: `/pages/tab/work-order/repair-task-detail/repair-task-detail?id=${id}`,
        fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
      })
    }
  },

  // 加载工单详情
  async loadDetail() {
    const workOrderId = this.data.workOrderId
    const app = getApp()
    
    if (!workOrderId) {
      this.setData({ loading: false, error: '缺少工单 id' })
      return
    }
    
    this.setData({ loading: true, error: '' })
    
    try {
      const res = await app.mpGetAuth(`/mp/workOrder/detail?id=${encodeURIComponent(workOrderId)}`)
      
      if (res && Number(res.isSuccess) === 1 && res.result) {
        // 工单详情包含 tasks 数组
        this.setData({ tasks: res.result.tasks || [] })
      } else {
        this.setData({ 
          tasks: [],
          error: (res && res.errorMsg) || '加载失败'
        })
      }
    } catch (e) {
      this.setData({ 
        tasks: [],
        error: e && e.message ? e.message : '网络错误'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
