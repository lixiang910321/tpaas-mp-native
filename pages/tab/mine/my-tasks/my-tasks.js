const { mpGetAuth } = require('../../../../utils/request')

Page({
  data: {
    activeTab: 'repair', // repair | maintenance
    repairList: [],
    maintenanceList: []
  },

  onLoad() {
    this.loadRepairTasks()
  },

  // 切换Tab
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (this.data.activeTab === tab) return
    
    this.setData({ activeTab: tab })
    
    if (tab === 'repair' && this.data.repairList.length === 0) {
      this.loadRepairTasks()
    } else if (tab === 'maintenance' && this.data.maintenanceList.length === 0) {
      this.loadMaintenanceTasks()
    }
  },

  // 加载维修任务
  async loadRepairTasks() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await mpGetAuth('/mp/repairTask/myTasks')
      
      if (res && res.result) {
        const list = (res.result || []).map(item => ({
          ...item,
          statusText: this.getRepairStatusText(item.status)
        }))
        this.setData({ repairList: list })
      }
    } catch (err) {
      console.error('加载维修任务失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载维保任务
  async loadMaintenanceTasks() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await mpGetAuth('/mp/maintenanceTask/myTasks')
      
      if (res && res.result) {
        const list = (res.result || []).map(item => ({
          ...item,
          statusText: this.getMaintenanceStatusText(item.status)
        }))
        this.setData({ maintenanceList: list })
      }
    } catch (err) {
      console.error('加载维保任务失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 维修任务状态文本
  getRepairStatusText(status) {
    const map = {
      10: '待确认',
      20: '待指派',
      30: '未开始',
      40: '已申请',
      50: '已提报',
      60: '已完成'
    }
    return map[status] || '未知'
  },

  // 维保任务状态文本
  getMaintenanceStatusText(status) {
    const map = {
      20: '待指派',
      30: '未开始',
      40: '已申请',
      50: '已提报',
      60: '已完成'
    }
    return map[status] || '未知'
  },

  // 点击任务卡片
  onTaskTap(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    // 根据任务类型跳转到不同的详情页
    if (this.data.activeTab === 'repair') {
      wx.navigateTo({
        url: `/pages/tab/work-order/repair-task-detail/repair-task-detail?id=${item.id}`
      })
    } else {
      wx.navigateTo({
        url: `/pages/tab/work-order/maintenance-task-detail/maintenance-task-detail?id=${item.id}`
      })
    }
  }
})
