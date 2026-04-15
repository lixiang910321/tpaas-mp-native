const app = getApp()

Page({
  data: {
    loading: false,
    list: [],
    filterDate: '',
    packageNoKeyword: '',
    datePickerValue: ''
  },

  onLoad() {
    this.loadPackages()
  },

  // 启用下拉刷新
  onPullDownRefresh() {
    this.loadPackages().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      filterDate: e.detail.value || '',
      datePickerValue: e.detail.value || ''
    })
    // 更新过滤列表
    this.updateFilteredList()
  },

  // 关键词输入
  onKeywordInput(e) {
    this.setData({
      packageNoKeyword: e.detail.value
    })
  },

  // 搜索确认
  onSearchConfirm() {
    // 触发过滤
    this.updateFilteredList()
  },

  // 工单状态枚举
  PACKAGE_STATUS: {
    10: '待执行',
    20: '执行中',
    30: '已完成'
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

  // 格式化状态
  formatPackageStatus(s) {
    const n = this.statusId(s)
    if (n == null) return '-'
    return this.PACKAGE_STATUS[n] || String(s)
  },

  // 格式化时间
  formatTime(v) {
    if (!v) return '-'
    return String(v).slice(0, 19).replace('T', ' ')
  },

  // 状态样式类
  statusClass(status) {
    const n = this.statusId(status)
    if (n === 30) return 'st-green'  // 已完成
    if (n === 20) return 'st-purple' // 执行中
    return 'st-normal'
  },

  // 区域文本
  regionText(item) {
    if (!item) return '—'
    if (item.region) return item.region
    if (item.laborTeamName) return item.laborTeamName
    return '—'
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
    
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/workOrder/page', {
        pageIndex: 1,
        pageSize: 100
      })
      
      if (res && Number(res.isSuccess) === 1 && res.result && Array.isArray(res.result.records)) {
        const list = res.result.records
        // 加载完成后立即计算过滤列表
        const filteredList = this.filterList(list)
        this.setData({ list, filteredList })
      } else {
        this.setData({ list: [], filteredList: [] })
      }
    } catch (e) {
      this.setData({ list: [], filteredList: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 过滤列表
  filterList(list) {
    let rows = list || this.data.list
    
    // 按日期过滤
    const d = this.data.filterDate
    if (d) {
      rows = rows.filter(item => {
        const t = this.formatTime(item.createTime)
        return t.startsWith(d)
      })
    }
    
    // 按工单编号过滤
    const kw = this.data.packageNoKeyword.trim().toLowerCase()
    if (kw) {
      rows = rows.filter(item => {
        const no = (item.orderNo || item.packageNo || '').toLowerCase()
        return no.includes(kw)
      })
    }
    
    return rows
  },

  // 更新过滤列表（供筛选条件变化时调用）
  updateFilteredList() {
    const filteredList = this.filterList(this.data.list)
    this.setData({ filteredList })
  }
})
