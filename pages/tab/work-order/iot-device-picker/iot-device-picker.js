Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedIds: [], // 多选支持
    multiSelect: false
  },

  onLoad(options) {
    const multiSelect = options.multiSelect === 'true'
    this.setData({ multiSelect })

    if (options.selectedIds) {
      try {
        const ids = JSON.parse(decodeURIComponent(options.selectedIds))
        this.setData({ selectedIds: ids })
      } catch (e) {
        // fallback: single selectedId
        if (options.selectedId) {
          this.setData({ selectedIds: [decodeURIComponent(String(options.selectedId))] })
        }
      }
    } else if (options.selectedId) {
      this.setData({ selectedIds: [decodeURIComponent(String(options.selectedId))] })
    }
    this.loadList()
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadList()
    }, 300)
  },

  onSelect(e) {
    const index = e.currentTarget.dataset.index
    if (index === undefined || index === null) return

    const list = [...this.data.list]
    const item = list[index]
    if (!item) return

    if (this.data.multiSelect) {
      // 多选模式
      item.selected = !item.selected
      const selectedIds = [...this.data.selectedIds]
      const idIndex = selectedIds.findIndex(id => String(id) === String(item.id))
      if (idIndex > -1) {
        selectedIds.splice(idIndex, 1)
      } else {
        selectedIds.push(item.id)
      }
      this.setData({ list, selectedIds })
    } else {
      // 单选模式
      const newList = list.map((it, idx) => ({
        ...it,
        selected: idx === index
      }))
      this.setData({
        list: newList,
        selectedIds: [item.id]
      })
    }
  },

  onConfirm() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({ title: '请选择物联设备', icon: 'none' })
      return
    }

    const selectedDevices = this.data.list.filter(item =>
      this.data.selectedIds.some(id => String(id) === String(item.id))
    )

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      if (this.data.multiSelect) {
        eventChannel.emit('selectIotDevices', {
          devices: selectedDevices.map(d => ({
            id: d.id,
            name: d.name,
            deviceType: d.deviceType
          }))
        })
      } else {
        const selectedDevice = selectedDevices[0]
        if (selectedDevice) {
          eventChannel.emit('selectIotDevice', {
            id: selectedDevice.id,
            name: selectedDevice.name,
            deviceType: selectedDevice.deviceType
          })
        }
      }
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

    const res = await app.mpGetAuth('/mp/refactor/iotDevice/list', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const list = (res.result || []).map(item => ({
        ...item,
        selected: this.data.selectedIds.some(id => String(id) === String(item.id))
      }))
      this.setData({ list, loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
