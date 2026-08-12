const app = getApp()

Page({
  data: {
    loading: false,
    list: [],
    total: 0,
    pageIndex: 1,
    pageSize: 10,
    filterVisible: false,
    filterCount: 0,
    statusOptions: [],
    lines: [],
    orderNo: '',
    orderNoInput: '',
    status: '',
    statusName: '',
    createStartDate: '',
    createEndDate: '',
    lineId: '',
    lineName: '',
    stationName: '',
    draftStatus: '',
    draftStatusName: '',
    draftCreateStartDate: '',
    draftCreateEndDate: '',
    draftLineId: '',
    draftLineName: '',
    draftStationName: ''
  },

  async onLoad() {
    await Promise.all([this.loadStatusOptions(), this.loadLines()])
    this.loadPackages()
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

  async loadLines() {
    try {
      const res = await app.mpGetAuth('/mp/area/list')
      if (res && Number(res.isSuccess) === 1) {
        this.setData({ lines: res.result || [] })
      }
    } catch (e) {
      console.error('加载线路失败', e)
    }
  },

  async loadStatusOptions() {
    const statuses = await app.getDict('workOrderStatusEnum')
    const statusOptions = (statuses || []).map(item => ({
      id: item.id,
      name: item.value || item.desc || ''
    }))
    this.setData({ statusOptions })
  },

  openFilter() {
    this.setData({
      filterVisible: true,
      draftStatus: this.data.status,
      draftStatusName: this.data.statusName,
      draftCreateStartDate: this.data.createStartDate,
      draftCreateEndDate: this.data.createEndDate,
      draftLineId: this.data.lineId,
      draftLineName: this.data.lineName,
      draftStationName: this.data.stationName
    })
  },

  closeFilter() {
    this.setData({ filterVisible: false })
  },

  stopPropagation() {},

  onOrderNoInput(e) {
    this.setData({ orderNoInput: e.detail.value })
  },

  onOrderNoConfirm(e) {
    const orderNo = (e.detail.value || '').trim()
    this.setData({
      orderNo,
      orderNoInput: orderNo,
      pageIndex: 1,
      list: []
    })
    this.loadPackages()
  },

  onStatusSelect(e) {
    const id = e.currentTarget.dataset.id
    const status = id === '' || id == null ? '' : Number(id)
    this.setData({
      draftStatus: status,
      draftStatusName: e.currentTarget.dataset.name || ''
    })
  },

  onStartDateChange(e) {
    this.setData({ draftCreateStartDate: e.detail.value })
  },

  onEndDateChange(e) {
    this.setData({ draftCreateEndDate: e.detail.value })
  },

  onLineSelect(e) {
    const id = e.currentTarget.dataset.id || ''
    const name = e.currentTarget.dataset.name || ''
    this.setData({
      draftLineId: String(id),
      draftLineName: name,
      draftStationName: ''
    })
  },

  onStationInput(e) {
    this.setData({ draftStationName: e.detail.value })
  },

  resetFilter() {
    this.setData({
      filterVisible: false,
      filterCount: 0,
      status: '',
      statusName: '',
      createStartDate: '',
      createEndDate: '',
      lineId: '',
      lineName: '',
      stationName: '',
      draftStatus: '',
      draftStatusName: '',
      draftCreateStartDate: '',
      draftCreateEndDate: '',
      draftLineId: '',
      draftLineName: '',
      draftStationName: '',
      pageIndex: 1,
      list: []
    })
    this.loadPackages()
  },

  applyFilter() {
    const startDate = this.data.draftCreateStartDate
    const endDate = this.data.draftCreateEndDate
    if (startDate && endDate && startDate > endDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return
    }

    const stationName = (this.data.draftStationName || '').trim()
    const filterCount = (this.data.draftStatus !== '' ? 1 : 0) +
      (startDate || endDate ? 1 : 0) +
      (this.data.draftLineId ? 1 : 0) +
      (stationName ? 1 : 0)

    this.setData({
      filterVisible: false,
      filterCount,
      status: this.data.draftStatus,
      statusName: this.data.draftStatusName,
      createStartDate: startDate,
      createEndDate: endDate,
      lineId: this.data.draftLineId,
      lineName: this.data.draftLineName,
      stationName,
      draftStationName: stationName,
      pageIndex: 1,
      list: []
    })
    this.loadPackages()
  },

  // 加载工单列表
  async loadPackages() {
    this.setData({ loading: true })
    try {
      const params = {
        pageIndex: this.data.pageIndex,
        pageSize: this.data.pageSize
      }
      if (this.data.orderNo) params.orderNo = this.data.orderNo
      if (this.data.status !== '') params.status = this.data.status
      if (this.data.createStartDate) params.createStartDate = this.data.createStartDate
      if (this.data.createEndDate) params.createEndDate = this.data.createEndDate
      if (this.data.lineId) params.lineId = this.data.lineId
      if (this.data.stationName) params.stationName = this.data.stationName

      const res = await app.mpGetAuth('/mp/workOrder/page', params)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const records = res.result.records || []
        const total = res.result.total || 0
        const list = records.map(item => ({
          ...item,
          statusText: this.formatStatus(item.status)
        }))
        const finalList = this.data.pageIndex === 1 ? list : [...this.data.list, ...list]
        this.setData({ list: finalList, total })
      }
    } catch (e) {
      console.error('加载工单列表失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },
})
