Page({
  data: {
    loading: false,
    list: [],
    pageIndex: 1,
    pageSize: 10,
    hasMore: true,
    statusIndex: 0,
    statusOptions: [
      { label: '全部状态', value: null },
      { label: '待指派', value: 20 },
      { label: '未开始', value: 30 },
      { label: '已申请', value: 40 },
      { label: '已提报', value: 50 },
      { label: '已完成', value: 60 }
    ]
  },

  TASK_STATUS: {
    20: '待指派',
    30: '未开始',
    40: '已申请',
    50: '已提报',
    60: '已完成'
  },

  onLoad() {
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 状态变化
  onStatusChange(e) {
    this.setData({ statusIndex: Number(e.detail.value) })
    this.loadData(true)
  },

  // 获取状态文本
  getStatusText(status) {
    return this.TASK_STATUS[status] || '-'
  },

  // 获取状态样式
  getStatusClass(status) {
    if (status === 60) return 'status-completed'
    if (status === 50) return 'status-reported'
    return ''
  },

  // 格式化时间
  formatTime(v) {
    if (!v) return '-'
    return String(v).slice(0, 19).replace('T', ' ')
  },

  // 查看详情
  onDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || item.id == null) return
    const id = encodeURIComponent(String(item.id))
    wx.navigateTo({ url: `/pages/tab/work-order/repair-task-detail/repair-task-detail?id=${id}` })
  },

  // 加载数据
  async loadData(reset = false) {
    if (this.data.loading) return

    const pageIndex = reset ? 1 : this.data.pageIndex
    this.setData({ loading: true })

    try {
      const app = getApp()
      const status = this.data.statusOptions[this.data.statusIndex].value
      
      const params = {
        pageIndex,
        pageSize: this.data.pageSize
      }
      
      if (status != null) {
        params.status = status
      }

      const res = await app.mpGetAuth('/mp/repairTask/page', params)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const records = res.result.records || []
        const total = res.result.total || 0
        
        if (reset) {
          this.setData({
            list: records,
            pageIndex: 1,
            hasMore: records.length < total
          })
        } else {
          this.setData({
            list: [...this.data.list, ...records],
            pageIndex: pageIndex + 1,
            hasMore: this.data.list.length + records.length < total
          })
        }
      } else {
        if (reset) {
          this.setData({ list: [], hasMore: false })
        }
      }
    } catch (e) {
      if (reset) {
        this.setData({ list: [], hasMore: false })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMore() {
    this.loadData(false)
  }
})
