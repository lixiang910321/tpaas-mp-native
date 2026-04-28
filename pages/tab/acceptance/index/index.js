const app = getApp()

// 维修任务状态枚举
const RepairTaskStatus = {
  COMPLETED: 60    // 已完成状态
}

Page({
  data: {
    activeTab: 0,       // 0=待验收 1=已验收
    loading: false,
    hasMore: true,
    current: 1,
    list: []
  },

  onLoad() {
    this.loadList(true)
  },

  onShow() {
    if (!this.data.loading) {
      this.loadList(true)
    }
  },

  onPullDownRefresh() {
    this.loadList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false)
    }
  },

  // 切换 tab
  onTabChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx === this.data.activeTab) return
    this.setData({ activeTab: idx, list: [], current: 1, hasMore: true })
    this.loadList(true)
  },

  // 格式化任务状态
  formatStatus(status) {
    const map = {
      20: '待指派',
      30: '未开始',
      40: '已申请',
      [RepairTaskStatus.SUBMITTED]: '已提报',
      [RepairTaskStatus.COMPLETED]: '已完成'
    }
    if (status == null) return '-'
    return map[Number(status)] || String(status)
  },

  // 状态样式
  statusClass(status) {
    const n = Number(status)
    if (n === RepairTaskStatus.COMPLETED) return 'st-green'
    if (n === RepairTaskStatus.SUBMITTED) return 'st-orange'
    return 'st-normal'
  },

  // 格式化时间
  formatTime(v) {
    if (!v) return '-'
    return String(v).slice(0, 19).replace('T', ' ')
  },

  // 查看详情
  onDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/tab/work-order/repair-task-detail/repair-task-detail?id=${encodeURIComponent(String(id))}`
    })
  },

  // 加载列表
  async loadList(isRefresh) {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const page = isRefresh ? 1 : this.data.current
      const status = RepairTaskStatus.COMPLETED
      const accepted = this.data.activeTab === 1  // true=已验收 false=待验收
      const res = await app.mpGetAuth('/mp/repairTask/acceptancePage', {
        status,
        accepted,
        current: page,
        size: 20
      })

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const records = res.result.records || []
        const list = isRefresh ? records : this.data.list.concat(records)
        this.setData({
          list,
          current: page + 1,
          hasMore: records.length >= 20
        })
      } else {
        if (isRefresh) this.setData({ list: [] })
      }
    } catch (e) {
      if (isRefresh) this.setData({ list: [] })
    } finally {
      this.setData({ loading: false })
    }
  }
})
