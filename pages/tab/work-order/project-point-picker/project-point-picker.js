Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedId: null,
    selectedName: '',
    taskType: null, // 1-维修项点 2-维保项点，由调用方显式传入
    facilityId: null, // 设施id筛选
    faultTypeId: null, // 故障类型id筛选
    // 分页
    pageIndex: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad(options) {
    // 解析URL参数
    let taskType = null
    if (options.taskType) {
      taskType = Number(options.taskType)
    }
    if (options.selectedId) {
      this.setData({
        selectedId: String(options.selectedId),
        selectedName: options.selectedName || ''
      })
    }
    if (options.facilityId) {
      this.setData({ facilityId: options.facilityId })
    }
    if (options.faultTypeId) {
      this.setData({ faultTypeId: options.faultTypeId })
    }

    this.setData({ taskType })
    this.loadList(true)
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadList(true)
    }, 300)
  },

  onClear() {
    this.setData({ keyword: '' })
    clearTimeout(this.searchTimer)
    this.loadList(true)
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    this.setData({
      selectedId: item.id,
      selectedName: item.name
    })
  },

  onConfirm() {
    if (!this.data.selectedId) {
      wx.showToast({ title: '请选择项点', icon: 'none' })
      return
    }

    const selectedPoint = this.data.list.find(item => item.id === this.data.selectedId)
    if (!selectedPoint) {
      wx.showToast({ title: '项点信息异常', icon: 'none' })
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectProjectPoint', {
        id: selectedPoint.id,
        name: selectedPoint.name,
        projectPointType: selectedPoint.projectPointType,
        diseaseLibraryId: selectedPoint.diseaseLibraryId,
        diseaseLibraryName: selectedPoint.diseaseLibraryName
      })
    }

    wx.navigateBack()
  },

  async loadList(reset) {
    if (this.data.loading) return
    if (reset) {
      this.setData({ pageIndex: 1, hasMore: true, list: [] })
    }
    if (!this.data.hasMore) return

    this.setData({ loading: true })
    const app = getApp()
    const params = {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize
    }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    if (this.data.taskType) {
      params.type = this.data.taskType
    }
    if (this.data.facilityId) {
      params.facilityId = this.data.facilityId
    }
    if (this.data.faultTypeId) {
      params.faultTypeId = this.data.faultTypeId
    }

    const res = await app.mpGetAuth('/mp/refactor/projectPoint/page', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []
      this.setData({
        list: reset ? records : [...this.data.list, ...records],
        hasMore: records.length >= this.data.pageSize,
        pageIndex: this.data.pageIndex + 1
      })
    } else {
      if (reset) this.setData({ list: [] })
    }

    this.setData({ loading: false })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false)
    }
  }
})
