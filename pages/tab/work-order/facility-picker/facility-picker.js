Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedId: null,
    selectedName: '',
    areaId: null,
    // 分页
    pageIndex: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad(options) {
    if (options.selectedId) {
      this.setData({
        selectedId: String(options.selectedId),
        selectedName: options.selectedName ? decodeURIComponent(options.selectedName) : ''
      })
    }
    if (options.areaId) {
      this.setData({ areaId: options.areaId })
    }
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
      wx.showToast({ title: '请选择设施', icon: 'none' })
      return
    }

    const selected = this.data.list.find(item => item.id === this.data.selectedId)
    if (!selected) {
      wx.showToast({ title: '设施信息异常', icon: 'none' })
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectFacility', {
        id: selected.id,
        name: selected.name
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
      current: this.data.pageIndex,
      size: this.data.pageSize
    }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    if (this.data.areaId) {
      params.areaId = this.data.areaId
    }

    const res = await app.mpGetAuth('/mp/facility/list', params)

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
