Page({
  data: {
    submitting: false,
    diseaseReportId: '',
    diseaseDetail: {},
    form: {
      constructionCategoryId: null,
      constructionCategoryName: '',
      confirmResult: null,
      beforePhotoUrls: [],
      confirmRemark: '',
      areaId: null,
      areaName: '',
      areaIds: '',          // JSON: [根id, 父id, 选中id]
      areaNames: '',        // JSON: [根名, 父名, 选中名]
      planProjectPointId: null,
      planProjectPointName: ''
    },
    selectedAreaId: null,
    selectedAreaName: '',
    showCategoryPicker: false,
    showResultPicker: false,
    categoryList: []
  },

  onLoad(options) {
    const diseaseReportId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ diseaseReportId })
    this.loadDiseaseDetail()
    this.loadCategoryList()
  },

  onShow() {
    // 页面显示时打印当前表单数据，用于调试
    console.log('病害确认 - onShow')
    console.log('病害确认 - form.planProjectPointId:', this.data.form.planProjectPointId)
    console.log('病害确认 - form.planProjectPointName:', this.data.form.planProjectPointName)
  },

  getResultText(result) {
    const map = { 10: '转班组', 20: '现场处理' }
    return map[result] || ''
  },

  onRemarkInput(e) {
    this.setData({ 'form.confirmRemark': e.detail.value })
  },

  // === 区域选择（跳转独立页面） ===

  onSelectArea() {
    // 传递当前已选区域用于回显
    const params = []
    if (this.data.selectedAreaId) {
      params.push(`selectedId=${this.data.selectedAreaId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.selectedAreaName)}`)
    }
    const query = params.length > 0 ? `?${params.join('&')}` : ''

    wx.navigateTo({
      url: `/pages/tab/work-order/area-picker/area-picker${query}`,
      events: {
        selectArea: (data) => {
          this.setData({
            selectedAreaId: data.id,
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

  onShowCategoryPicker() { this.setData({ showCategoryPicker: true }) },
  onHideCategoryPicker() { this.setData({ showCategoryPicker: false }) },
  onShowResultPicker() { this.setData({ showResultPicker: true }) },
  onHideResultPicker() { this.setData({ showResultPicker: false }) },

  selectCategory(e) {
    const cat = e.currentTarget.dataset.item
    this.setData({
      'form.constructionCategoryId': cat.id,
      'form.constructionCategoryName': cat.name,
      showCategoryPicker: false
    })
  },

  selectResult(e) {
    const result = e.currentTarget.dataset.result
    this.setData({
      'form.confirmResult': result,
      showResultPicker: false
    })
  },

  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.form.beforePhotoUrls[index],
      urls: this.data.form.beforePhotoUrls
    })
  },

  choosePhoto() {
    const that = this
    const count = 9 - this.data.form.beforePhotoUrls.length
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
      const beforePhotoUrls = [...this.data.form.beforePhotoUrls, ...urls]
      this.setData({ 'form.beforePhotoUrls': beforePhotoUrls })
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const beforePhotoUrls = this.data.form.beforePhotoUrls.filter((_, i) => i !== index)
    this.setData({ 'form.beforePhotoUrls': beforePhotoUrls })
  },

  goBack() {
    wx.navigateBack()
  },

  onSelectProjectPoint() {
    console.log('病害确认 - 选择项点')
    console.log('病害确认 - 当前 planProjectPointId:', this.data.form.planProjectPointId)
    console.log('病害确认 - 当前 planProjectPointName:', this.data.form.planProjectPointName)
    
    const params = []
    // 传递任务类型：1-维修项点
    params.push('taskType=1')
    if (this.data.form.planProjectPointId) {
      params.push(`selectedId=${this.data.form.planProjectPointId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.planProjectPointName)}`)
    }
    const query = params.length > 0 ? `?${params.join('&')}` : ''
    console.log('病害确认 - 跳转URL:', `/pages/tab/work-order/repair-task-apply/select-project-point/select-project-point${query}`)
    wx.navigateTo({
      url: `/pages/tab/work-order/repair-task-apply/select-project-point/select-project-point${query}`
    })
  },

  async loadDiseaseDetail() {
    const id = this.data.diseaseReportId
    if (!id) return
    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/diseaseReport/detail/${id}`)
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const detail = res.result
        // 解析 reportTime（格式：yyyy-MM-dd HH:mm:ss）为日期和时间
        const reportTime = detail.reportTime || ''
        const parts = reportTime.split(' ')
        this.setData({
          diseaseDetail: detail,
          reportDate: parts[0] || '',
          reportTimeOnly: parts[1] || ''
        })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadCategoryList() {
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/diseaseReportConfirm/constructionCategoryOptions')
      if (res && Number(res.isSuccess) === 1 && res.result) {
        this.setData({ categoryList: res.result })
      }
    } catch (e) {
      this.setData({
        categoryList: [
          { id: 10, name: '维修' },
          { id: 20, name: '临补' }
        ]
      })
    }
  },

  async submitConfirm() {
    if (!this.data.form.areaId) {
      wx.showToast({ title: '请选择区域', icon: 'none' })
      return
    }
    if (!this.data.form.planProjectPointId) {
      wx.showToast({ title: '请选择计划项点', icon: 'none' })
      return
    }
    if (!this.data.form.constructionCategoryId) {
      wx.showToast({ title: '请选择施工类别', icon: 'none' })
      return
    }
    if (!this.data.form.confirmResult) {
      wx.showToast({ title: '请选择确认结果', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const app = getApp()
      const res = await app.mpPostAuth('/mp/diseaseReportConfirm/confirm', {
        diseaseReportId: this.data.diseaseReportId,
        areaId: this.data.form.areaId,
        areaName: this.data.form.areaName,
        areaIdPath: this.data.form.areaIds ? JSON.parse(this.data.form.areaIds) : [],
        areaNamePath: this.data.form.areaNames ? JSON.parse(this.data.form.areaNames) : [],
        planProjectPointId: this.data.form.planProjectPointId,
        planProjectPointName: this.data.form.planProjectPointName,
        constructionCategoryId: this.data.form.constructionCategoryId,
        constructionCategoryName: this.data.form.constructionCategoryName,
        confirmResult: this.data.form.confirmResult,
        beforePhotoUrls: this.data.form.beforePhotoUrls,
        confirmRemark: this.data.form.confirmRemark
      })

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
  }
})
