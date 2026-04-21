const app = getApp()

Page({
  data: {
    loading: false,
    list: [],
    total: 0,
    pageIndex: 1,
    pageSize: 10
  },

  onLoad() {
    // 预加载字典
    getApp().getDict('workOrderStatusEnum').then(() => {
      // 字典加载完成后再加载列表
      this.loadPackages()
    })
  },

  // 启用下拉刷新
  onPullDownRefresh() {
    this.setData({ pageIndex: 1 })
    this.loadPackages().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载更多
  onReachBottom() {
    if (this.data.list.length < this.data.total) {
      this.setData({ pageIndex: this.data.pageIndex + 1 })
      this.loadPackages()
    }
  },

  // 格式化状态
  formatStatus(s) {
    if (s == null || s === '') return '-'
    const label = getApp().getDictLabel('workOrderStatusEnum', s)
    return label || '-'
  },

  // 查看详情
  onDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || item.id == null || item.id === '') return
    const id = encodeURIComponent(String(item.id))
    wx.navigateTo({ url: `/pages/tab/work-order/detail/detail?id=${id}` })
  },

  // 加载工单列表
  async loadPackages() {
    this.setData({ loading: true })
    
    const res = await getApp().mpGetAuth('/mp/workOrder/page', {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize
    })
    
    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []
      const total = res.result.total || 0
      
      // 格式化状态文本
      const list = records.map(item => ({
        ...item,
        statusText: this.formatStatus(item.status)
      }))
      
      // 下拉加载更多时追加数据
      const finalList = this.data.pageIndex === 1 ? list : [...this.data.list, ...list]
      
      this.setData({ list: finalList, total })
    }
    
    this.setData({ loading: false })
  },
})
