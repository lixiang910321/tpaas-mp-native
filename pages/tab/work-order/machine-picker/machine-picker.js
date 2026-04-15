Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedIds: [] // 支持多选
  },

  onLoad(options) {
    if (options.selectedIds) {
      try {
        const ids = JSON.parse(decodeURIComponent(options.selectedIds))
        this.setData({ selectedIds: ids })
      } catch (e) {
        console.error('解析已选机械ID失败', e)
      }
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

    const selectedIds = [...this.data.selectedIds]
    const index = selectedIds.indexOf(item.id)

    if (index > -1) {
      // 已选中，取消选择
      selectedIds.splice(index, 1)
    } else {
      // 未选中，添加选择
      selectedIds.push(item.id)
    }

    this.setData({ selectedIds: selectedIds })
  },

  // 确认选择
  onConfirm() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({ title: '请至少选择一台机械', icon: 'none' })
      return
    }

    // 获取选中的机械详情
    const selectedMachines = this.data.list.filter(item => 
      this.data.selectedIds.includes(item.id)
    )

    // 使用事件通道返回数据
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectMachines', {
        machines: selectedMachines.map(m => ({
          id: m.id,
          name: m.name
        }))
      })
    }

    wx.navigateBack()
  },

  async loadList() {
    this.setData({ loading: true })
    const app = getApp()
    const params = {}
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }

    const res = await app.mpGetAuth('/mp/refactor/machine/list', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ list: res.result || [], loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
