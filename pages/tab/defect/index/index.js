const app = getApp()
Page({
  data: {
    list: [],
    loading: false,
    hasMore: true,
    pageIndex: 1,
    pageSize: 10,
    status: null
  },

  STATUS_MAP: {
    10: '待确认',
    20: '已确认',
    30: '处理中',
    40: '已完成'
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次回到列表重新刷新
    this.setData({ pageIndex: 1, hasMore: true, list: [] })
    this.loadData()
  },

  onPullDownRefresh() {
    this.setData({ pageIndex: 1, hasMore: true, list: [] })
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  getStatusText(status) {
    return this.STATUS_MAP[status] || '-'
  },

  getStatusClass(status) {
    if (status === 10) return 'status-pending'
    if (status === 20) return 'status-confirmed'
    if (status === 40) return 'status-completed'
    return ''
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return
    wx.navigateTo({ url: `/pages/tab/defect/detail/detail?id=${encodeURIComponent(item.id)}` })
  },

  goConfirm(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return
    wx.navigateTo({ url: `/pages/tab/defect/confirm/confirm?id=${encodeURIComponent(item.id)}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/tab/defect/add/add' })
  },

  async loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })
    
    const app = getApp()
    const params = {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize
    }
    if (this.data.status !== null) {
      params.status = this.data.status
    }

    const query = Object.keys(params)
      .filter(k => params[k] !== null && params[k] !== undefined)
      .map(k => `${k}=${params[k]}`)
      .join('&')
    
    const res = await app.mpGetAuth(`/mp/diseaseReport/page?${query}`)
    
    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []
      
      if (this.data.pageIndex === 1) {
        this.setData({
          list: records,
          hasMore: records.length >= this.data.pageSize
        })
      } else {
        this.setData({
          list: [...this.data.list, ...records],
          hasMore: records.length >= this.data.pageSize
        })
      }
      
      if (this.data.hasMore) {
        this.setData({ pageIndex: this.data.pageIndex + 1 })
      }
    }
    
    this.setData({ loading: false })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData()
    }
  }
})
