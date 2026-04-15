Page({
  data: {
    loading: true,
    error: '',
    tasks: [],
    workOrderId: ''
  },

  TASK_STATUS: {
    20: '待指派',
    30: '未开始',
    40: '已申请',
    50: '已提报',
    60: '已完成'
  },

  onLoad(options) {
    const workOrderId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ workOrderId })
    this.loadDetail()
  },

  // 获取状态ID
  statusId(s) {
    if (s == null || s === '') return null
    if (typeof s === 'object' && s != null && 'id' in s) {
      const n = Number(s.id)
      return Number.isFinite(n) ? n : null
    }
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  },

  // 格式化任务状态
  formatTaskStatus(s) {
    const n = this.statusId(s)
    if (n == null) return '—'
    return this.TASK_STATUS[n] || String(s)
  },

  // 任务状态样式类
  taskStatusClass(s) {
    const n = this.statusId(s)
    if (n === 60) return 'st-green'  // 已完成
    if (n === 40 || n === 50) return 'st-purple' // 已申请/已提报
    return ''
  },

  // 判断任务是否待申请执行
  isTaskPendingApply(t) {
    return this.statusId(t && t.status) === 30
  },

  // 查看任务详情
  onTaskDetail(e) {
    console.log('onTaskDetail triggered', e)
    const t = e.currentTarget.dataset.item
    console.log('task item:', t)
    
    if (!t) {
      console.error('task item is null')
      wx.showToast({ title: '任务数据异常', icon: 'none' })
      return
    }
    
    if (t.taskId == null || t.taskId === '') {
      console.error('taskId is null or empty', t)
      wx.showToast({ title: '任务ID缺失', icon: 'none' })
      return
    }
    
    const id = encodeURIComponent(String(t.taskId))
    console.log('taskType:', t.taskType, 'taskId:', t.taskId)
    
    // 根据任务类型跳转不同页面
    if (t.taskType === 20) {
      // 维保任务
      console.log('导航到维保任务详情页')
      wx.navigateTo({ 
        url: `/pages/tab/work-order/maintenance-task-detail/maintenance-task-detail?id=${id}`,
        fail: (err) => {
          console.error('导航失败:', err)
          wx.showToast({ title: '页面跳转失败', icon: 'none' })
        }
      })
    } else {
      // 维修任务（taskType === 10 或其他）
      console.log('导航到维修任务详情页')
      wx.navigateTo({ 
        url: `/pages/tab/work-order/repair-task-detail/repair-task-detail?id=${id}`,
        fail: (err) => {
          console.error('导航失败:', err)
          wx.showToast({ title: '页面跳转失败', icon: 'none' })
        }
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
