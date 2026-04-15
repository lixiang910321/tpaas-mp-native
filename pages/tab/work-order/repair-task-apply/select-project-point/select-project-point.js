Page({
  data: {
    loading: false,
    list: [],
    hasMore: true,
    pageIndex: 1,
    pageSize: 10,
    keyword: '',
    selectedId: null,
    selectedName: ''
  },

  onLoad(options) {
    if (options.selectedId) {
      this.setData({
        selectedId: options.selectedId,
        selectedName: options.selectedName || ''
      })
    }
    this.loadData()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ pageIndex: 1, hasMore: true, list: [] })
    this.loadData()
  },

  onClear() {
    this.setData({ keyword: '', pageIndex: 1, hasMore: true, list: [] })
    this.loadData()
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
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

    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.setData({
        'form.projectPointId': this.data.selectedId,
        'form.projectPointName': this.data.selectedName
      })
    }
    wx.navigateBack()
  },

  async loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })

    const app = getApp()
    const params = {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize
    }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }

    const res = await app.mpGetAuth('/mp/refactor/projectPoint/page', params)

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
