const app = getApp()

// 拼接区域全层级名称：优先解析 areaNames(JSON数组)，用 - 连接；兜底 areaName
function buildAreaFullName(item) {
  if (!item) return ''
  var names = item.areaNames
  if (names) {
    if (Array.isArray(names)) {
      var arr = names.filter(function (n) { return n != null && String(n).trim() !== '' })
      if (arr.length) return arr.join('-')
    } else if (typeof names === 'string' && names.trim() !== '') {
      try {
        var parsed = JSON.parse(names)
        if (Array.isArray(parsed)) {
          var arr2 = parsed.filter(function (n) { return n != null && String(n).trim() !== '' })
          if (arr2.length) return arr2.join('-')
        }
      } catch (e) {
        return names.trim()
      }
    }
  }
  return item.areaName || ''
}

Page({
  data: {
    list: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    pageIndex: 1,
    pageSize: 10,
    status: null
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
    this.setData({ pageIndex: 1, hasMore: true, list: [], refreshing: true })
    this.loadData().finally(() => {
      this.setData({ refreshing: false })
    })
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
    // 确保字典已加载
    await app.getDict('diseaseConfirmStatusEnum')

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
      const rawRecords = res.result.records || []
      // 预计算状态文本（从字典获取，禁止硬编码枚举文案）
      const records = rawRecords.map(item => {
        return Object.assign({}, item, {
          statusText: app.getDictLabel('diseaseConfirmStatusEnum', item.status) || '-',
          areaFullName: buildAreaFullName(item)
        })
      })
      
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
