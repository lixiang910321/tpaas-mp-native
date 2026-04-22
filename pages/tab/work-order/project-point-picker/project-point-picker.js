Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedId: null // 单选
  },

  onLoad(options) {
    if (options.selectedId) {
      this.setData({ selectedId: decodeURIComponent(String(options.selectedId)) })
    }
    this.loadList()
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadList()
    }, 300)
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return

    this.setData({ selectedId: item.id })
  },

  // 确认选择
  onConfirm() {
    if (!this.data.selectedId) {
      wx.showToast({ title: '请选择项点', icon: 'none' })
      return
    }

    // 获取选中的项点详情
    const selectedPoint = this.data.list.find(item => item.id === this.data.selectedId)
    if (!selectedPoint) {
      wx.showToast({ title: '项点信息异常', icon: 'none' })
      return
    }

    // 使用事件通道返回数据
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectProjectPoint', {
        id: selectedPoint.id,
        name: selectedPoint.name,
        projectPointType: selectedPoint.projectPointType
      })
    }

    wx.navigateBack()
  },

  async loadList() {
    this.setData({ loading: true })
    const app = getApp()
    const params = { current: 1, size: 100 }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }

    const res = await app.mpGetAuth('/mp/refactor/projectPoint/page', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ list: res.result.records || [], loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
