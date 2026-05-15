Page({
  data: {
    loading: true,
    error: '',
    workOrder: null,
    tasks: [],
    workOrderId: ''
  },

  onLoad(options) {
    const workOrderId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ workOrderId })
    this.loadDetail()
  },

  onShow() {
    // 从任务详情页或申请页返回时刷新
    if (this.data.workOrderId) {
      this.loadDetail()
    }
  },

  // 跳转申请工单页面
  onApply() {
    const id = this.data.workOrderId
    if (!id) return
    wx.navigateTo({
      url: `/pages/tab/work-order/work-order-apply/work-order-apply?workOrderId=${encodeURIComponent(id)}`,
      fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
    })
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

  // 格式化状态
  formatStatus(s) {
    if (s == null || s === '') return '-'
    const app = getApp()
    const label = app.getDictLabel('workOrderStatusEnum', s)
    return label || '-'
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
      // 预加载字典
      await app.getDict('workOrderStatusEnum')
      
      const res = await app.mpGetAuth(`/mp/workOrder/detail?id=${encodeURIComponent(workOrderId)}`)
      
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const result = res.result
        // 格式化状态文本
        const statusText = this.formatStatus(result.status)
        this.setData({
          workOrder: { ...result, statusText },
          tasks: result.tasks || []
        })
      } else {
        this.setData({ 
          workOrder: null,
          tasks: [],
          error: (res && res.errorMsg) || '加载失败'
        })
      }
    } catch (e) {
      this.setData({ 
        workOrder: null,
        tasks: [],
        error: e && e.message ? e.message : '网络错误'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
