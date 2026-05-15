Page({
  data: {
    loading: false,
    list: [],
    selectedFaultTypeId: null,
    selectedFaultTypeName: '',
    diseaseLibraryId: null,
    diseaseLibraryName: '',
    facilityId: null
  },

  onLoad(options) {
    if (options.facilityId) {
      this.setData({ facilityId: options.facilityId })
    }
    if (options.selectedFaultTypeId) {
      this.setData({
        selectedFaultTypeId: options.selectedFaultTypeId,
        selectedFaultTypeName: options.selectedFaultTypeName ? decodeURIComponent(options.selectedFaultTypeName) : ''
      })
    }
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    const app = getApp()

    // 第一步：按 facilityId 查病害库详情
    try {
      const libRes = await app.mpGetAuth('/mp/diseaseLibrary/detailByFacility', {
        facilityId: this.data.facilityId
      })
      if (libRes && Number(libRes.isSuccess) === 1 && libRes.result) {
        const diseaseLibrary = libRes.result
        this.setData({
          diseaseLibraryId: diseaseLibrary.id,
          diseaseLibraryName: diseaseLibrary.name
        })

        // 第二步：按病害库id查故障类型列表
        const faultRes = await app.mpGetAuth('/mp/diseaseLibrary/faultTypeList', {
          diseaseLibraryId: diseaseLibrary.id
        })
        if (faultRes && Number(faultRes.isSuccess) === 1 && faultRes.result) {
          this.setData({ list: faultRes.result || [] })
        }
      } else {
        this.setData({ list: [] })
        wx.showToast({ title: '该设施暂未关联病害库', icon: 'none' })
      }
    } catch (e) {
      this.setData({ list: [] })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }

    this.setData({ loading: false })
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    if (this.data.selectedFaultTypeId === item.faultTypeId) {
      this.setData({
        selectedFaultTypeId: null,
        selectedFaultTypeName: ''
      })
    } else {
      this.setData({
        selectedFaultTypeId: item.faultTypeId,
        selectedFaultTypeName: item.faultTypeName
      })
    }
  },

  onConfirm() {
    if (!this.data.selectedFaultTypeId) {
      wx.showToast({ title: '请选择故障类型', icon: 'none' })
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectFaultType', {
        faultTypeId: this.data.selectedFaultTypeId,
        faultTypeName: this.data.selectedFaultTypeName,
        diseaseLibraryId: this.data.diseaseLibraryId,
        diseaseLibraryName: this.data.diseaseLibraryName
      })
    }

    wx.navigateBack()
  }
})
