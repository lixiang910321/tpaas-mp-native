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
      areaId: null
    },
    selectedAreaId: null,
    selectedAreaName: '',
    showAreaPicker: false,
    showCategoryPicker: false,
    showResultPicker: false,
    areaTree: [],
    categoryList: []
  },

  onLoad(options) {
    const diseaseReportId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ diseaseReportId })
    this.loadDiseaseDetail()
    this.loadAreaTree()
    this.loadCategoryList()
  },

  getResultText(result) {
    const map = { 10: '转班组', 20: '现场处理' }
    return map[result] || ''
  },

  onRemarkInput(e) {
    this.setData({ 'form.confirmRemark': e.detail.value })
  },

  onShowAreaPicker() { this.setData({ showAreaPicker: true }) },
  onHideAreaPicker() { this.setData({ showAreaPicker: false }) },
  onShowCategoryPicker() { this.setData({ showCategoryPicker: true }) },
  onHideCategoryPicker() { this.setData({ showCategoryPicker: false }) },
  onShowResultPicker() { this.setData({ showResultPicker: true }) },
  onHideResultPicker() { this.setData({ showResultPicker: false }) },

  selectArea(e) {
    const area = e.currentTarget.dataset.item
    this.setData({
      selectedAreaId: area.id,
      selectedAreaName: area.name,
      'form.areaId': area.id,
      showAreaPicker: false
    })
  },

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

  async loadDiseaseDetail() {
    const id = this.data.diseaseReportId
    if (!id) return
    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/diseaseReport/detail/${id}`)
      if (res && Number(res.isSuccess) === 1 && res.result) {
        this.setData({ diseaseDetail: res.result })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadAreaTree() {
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/area/list')
      if (res && Number(res.isSuccess) === 1 && res.result) {
        this.setData({ areaTree: res.result })
      }
    } catch (e) {
      console.error('加载区域失败', e)
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
