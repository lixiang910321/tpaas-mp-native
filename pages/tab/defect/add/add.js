Page({
  data: {
    submitting: false,
    form: {
      cmdNum: '',
      reportDate: '',
      reportTimeOnly: '',
      source: null,
      description: '',
      areaId: null,
      areaName: '',
      areaIds: '',
      areaNames: '',
      stationDutyId: null,
      stationDutyName: '',
      employeeNames: '',
      employeeIds: '',
      photoList: []
    },
    sourceOptions: ['电话报修', '系统上报', '巡查发现', '其他'],
    sourceIndex: -1,
    selectedAreaName: '',
    stationDutyList: [],
    stationDutyIndex: -1
  },

  onLoad() {
    this.loadStationDutyList()
  },

  // === 加载可选驻站班组列表 ===

  async loadStationDutyList() {
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/diseaseReport/stationDutyList')
      if (res && Number(res.isSuccess) === 1 && res.result && res.result.length > 0) {
        this.setData({ stationDutyList: res.result })
      }
    } catch (e) {
      console.error('获取班组列表失败', e)
    }
  },

  // === 班组选择事件 ===

  onStationDutyChange(e) {
    const idx = e.detail.value
    const duty = this.data.stationDutyList[idx]
    if (duty) {
      this.setData({
        stationDutyIndex: idx,
        'form.stationDutyId': duty.stationDutyId,
        'form.stationDutyName': duty.stationDutyName,
        'form.employeeNames': duty.employeeNames,
        'form.employeeIds': duty.employeeIds
      })
    }
  },

  // === 输入事件 ===

  onCmdNumInput(e) {
    this.setData({ 'form.cmdNum': e.detail.value })
  },

  onDateChange(e) {
    this.setData({ 'form.reportDate': e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ 'form.reportTimeOnly': e.detail.value })
  },

  onSourceChange(e) {
    const idx = e.detail.value
    this.setData({
      sourceIndex: idx,
      'form.source': this.data.sourceOptions[idx]
    })
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // === 区域选择 ===

  onSelectArea() {
    const params = []
    if (this.data.form.areaId) {
      params.push(`selectedId=${this.data.form.areaId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.selectedAreaName)}`)
    }
    const query = params.length > 0 ? `?${params.join('&')}` : ''

    wx.navigateTo({
      url: `/pages/tab/work-order/area-picker/area-picker${query}`,
      events: {
        selectArea: (data) => {
          this.setData({
            selectedAreaName: data.name,
            'form.areaId': data.id,
            'form.areaName': data.name,
            'form.areaIds': JSON.stringify(data.pathIds || []),
            'form.areaNames': JSON.stringify(data.pathNames || [])
          })
        }
      }
    })
  },

  // === 照片上传 ===

  choosePhoto() {
    const that = this
    const count = 9 - this.data.form.photoList.length
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        that.uploadPhotos(tempFiles)
      }
    })
  },

  async uploadPhotos(paths) {
    wx.showLoading({ title: '上传中...' })
    try {
      const app = getApp()
      const urls = []
      for (const path of paths) {
        const uploadRes = await app.mpUploadFile(path)
        if (uploadRes.isSuccess === 1 && uploadRes.result?.url) {
          urls.push(uploadRes.result.url)
        }
      }
      const photoList = [...this.data.form.photoList, ...urls]
      this.setData({ 'form.photoList': photoList })
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const photoList = this.data.form.photoList.filter((_, i) => i !== index)
    this.setData({ 'form.photoList': photoList })
  },

  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.form.photoList[index],
      urls: this.data.form.photoList
    })
  },

  // === 提交 ===

  buildReportTime() {
    if (!this.data.form.reportDate || !this.data.form.reportTimeOnly) return ''
    let t = this.data.form.reportTimeOnly
    if (t.length === 5) t = t + ':00'
    return `${this.data.form.reportDate} ${t}`
  },

  async submit() {
    // 校验
    if (!this.data.form.cmdNum) {
      wx.showToast({ title: '请输入令号', icon: 'none' })
      return
    }
    if (!this.data.form.areaId) {
      wx.showToast({ title: '请选择区域', icon: 'none' })
      return
    }
    if (!this.data.form.reportDate || !this.data.form.reportTimeOnly) {
      wx.showToast({ title: '请填写接报日期与时间', icon: 'none' })
      return
    }
    if (!this.data.form.source) {
      wx.showToast({ title: '请选择来源', icon: 'none' })
      return
    }
    if (!this.data.form.description) {
      wx.showToast({ title: '请输入描述', icon: 'none' })
      return
    }
    if (this.data.stationDutyList.length > 0 && !this.data.form.stationDutyId) {
      wx.showToast({ title: '请选择驻站班组', icon: 'none' })
      return
    }

    const reportTime = this.buildReportTime()
    const areaIds = this.data.form.areaIds ? JSON.parse(this.data.form.areaIds) : []
    const areaNames = this.data.form.areaNames ? JSON.parse(this.data.form.areaNames) : []

    this.setData({ submitting: true })
    try {
      const app = getApp()
      const payload = {
        reportTime,
        source: this.data.form.source,
        description: this.data.form.description,
        cmdNum: this.data.form.cmdNum,
        areaId: this.data.form.areaId,
        areaName: this.data.form.areaName,
        areaIdPath: areaIds,
        areaNamePath: areaNames,
        stationDutyId: this.data.form.stationDutyId,
        stationDutyName: this.data.form.stationDutyName,
        stationDutyEmployeeNames: this.data.form.employeeNames,
        stationDutyEmployeeIds: this.data.form.employeeIds,
        photoList: this.data.form.photoList
      }

      const res = await app.mpPostAuth('/mp/diseaseReport/add', payload)
      if (res && Number(res.isSuccess) === 1) {
        wx.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res?.errorMsg || '提交失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
