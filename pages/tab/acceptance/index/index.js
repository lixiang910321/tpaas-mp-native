const app = getApp()

Page({
  data: {
    activeTab: 0,       // 0=待验收 1=已验收
    loading: false,
    list: []
  },

  onLoad() {
    this.loadList()
  },

  onShow() {
    this.loadList()
  },

  onPullDownRefresh() {
    this.loadList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 切换 tab
  onTabChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx === this.data.activeTab) return
    this.setData({ activeTab: idx })
    this.loadList()
  },

  // 格式化任务状态
  formatStatus(status) {
    const map = {
      20: '待指派',
      30: '未开始',
      40: '已申请',
      50: '已提报',
      60: '已完成'
    }
    if (status == null) return '-'
    return map[Number(status)] || String(status)
  },

  // 状态样式
  statusClass(status) {
    const n = Number(status)
    if (n === 60) return 'st-green'
    if (n === 50) return 'st-orange'
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
  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await app.mpGetAuth('/mp/repairTask/acceptancePage', {
        tab: this.data.activeTab
      })
      if (res && Number(res.isSuccess) === 1 && Array.isArray(res.result)) {
        this.setData({ list: res.result })
      } else {
        this.setData({ list: [] })
      }
    } catch (e) {
      this.setData({ list: [] })
    } finally {
      this.setData({ loading: false })
    }
  }
})
