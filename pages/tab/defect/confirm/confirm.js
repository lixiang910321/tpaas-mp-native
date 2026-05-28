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
      planProjectPointName: '',
      // 计划侧：模板归属（大类）
      planTemplateOwnerId: '',
      planTemplateOwnerValue: '',
      planTemplateOwnerName: '',
      // 计划侧：模板（中类）
      planTemplateId: '',
      planTemplateCode: '',
      planTemplateName: '',
      // 计划侧：设施分类（多级分类）
      planCategoryId: '',
      planCategoryName: '',
      planCategoryIds: [],
      planCategoryNames: [],
      planCategoryDisplayName: '',
      // 计划设施
      planFacilityId: '',
      planFacilityName: '',
      // 紧急程度
      urgencyLevel: '',
      urgencyLevelText: '',
      // 窗口时间
      windowTimeId: null,
      windowTimeName: '',
      // 病害原因
      diseaseReasonId: null,
      diseaseReasonName: ''
    },
    // 计划项点冗余信息
    areaInfo: { id: null, name: '' },
    facilityInfo: { id: null, name: '' },
    diseaseLibraryInfo: { id: null, name: '' },
    faultTypeInfo: { id: null, name: '' },
    selectedAreaId: null,
    selectedAreaName: '',
    showCategoryPicker: false,
    showResultPicker: false,
    categoryList: [],
    // 紧急程度选项
    urgencyOptions: [
      { code: 'A', name: 'A-严重故障' },
      { code: 'B', name: 'B-紧急故障' },
      { code: 'C', name: 'C-一般故障' }
    ],
    // 窗口时间选项
    windowTimeOptions: [
      { id: 1, name: '白班' },
      { id: 2, name: '夜班' }
    ],
    // 病害原因选项（从字典加载）
    diseaseReasonOptions: [],
    // 病害接报图片
    diseasePhotos: []
  },

  onLoad(options) {
    const diseaseReportId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ diseaseReportId })
    this.loadDiseaseDetail()
    this.loadCategoryList()
    this.loadDiseaseReasonOptions()
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

  // === 紧急程度选择 ===
  onUrgencyChange(e) {
    const idx = Number(e.detail.value)
    const opt = this.data.urgencyOptions[idx]
    if (opt) {
      this.setData({
        'form.urgencyLevel': opt.code,
        'form.urgencyLevelText': opt.name
      })
    }
  },

  // === 窗口时间选择 ===
  onWindowTimeChange(e) {
    const idx = Number(e.detail.value)
    const opt = this.data.windowTimeOptions[idx]
    if (opt) {
      this.setData({
        'form.windowTimeId': opt.id,
        'form.windowTimeName': opt.name
      })
    }
  },

  // === 病害原因选择 ===
  onDiseaseReasonChange(e) {
    const idx = Number(e.detail.value)
    const opt = this.data.diseaseReasonOptions[idx]
    if (opt) {
      this.setData({
        'form.diseaseReasonId': opt.id,
        'form.diseaseReasonName': opt.name
      })
    }
  },

  // === 加载病害原因字典（从 dict_library 动态加载） ===
  async loadDiseaseReasonOptions() {
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/diseaseReportConfirm/diseaseReasonOptions')
      if (res && Number(res.isSuccess) === 1 && Array.isArray(res.result)) {
        const options = res.result.map(item => ({
          id: item.id,
          name: item.name
        }))
        this.setData({ diseaseReasonOptions: options })
      }
    } catch (e) {
      console.error('加载病害原因字典失败', e)
    }
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

  previewDiseasePhoto(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.diseasePhotos
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

  // === 设施分类选择（跳转 facility-category-picker） ===
  onSelectFacilityCategory() {
    wx.navigateTo({
      url: '/pages/tab/work-order/facility-category-picker/facility-category-picker',
      events: {
        selectFacilityCategory: (data) => {
          console.log('病害确认 - 选择设施分类结果:', data)
          this.setData({
            // 大类（模板归属）
            'form.planTemplateOwnerId': data.templateOwnerId || '',
            'form.planTemplateOwnerValue': data.templateOwnerValue || '',
            'form.planTemplateOwnerName': data.templateOwnerName || '',
            // 中类（模板）
            'form.planTemplateId': data.templateId || '',
            'form.planTemplateCode': data.templateCode || '',
            'form.planTemplateName': data.templateName || '',
            // 多级分类
            'form.planCategoryId': data.categoryId || '',
            'form.planCategoryName': data.categoryName || '',
            'form.planCategoryIds': data.categoryIds || [],
            'form.planCategoryNames': data.categoryNames || [],
            'form.planCategoryDisplayName': (data.categoryNames || []).join(' / '),
            // 设施分类变更 → 清空计划设施 + 计划项点
            'form.planFacilityId': '',
            'form.planFacilityName': '',
            'form.planProjectPointId': null,
            'form.planProjectPointName': '',
            areaInfo: { id: null, name: '' },
            facilityInfo: { id: null, name: '' },
            diseaseLibraryInfo: { id: null, name: '' },
            faultTypeInfo: { id: null, name: '' }
          })
        }
      }
    })
  },

  // === 计划设施选择（跳转 facility-picker，传入 categoryId） ===
  onSelectPlanFacility() {
    const categoryId = this.data.form.planCategoryId
    if (!categoryId) {
      wx.showToast({ title: '请先选择设施分类', icon: 'none' })
      return
    }
    const params = [`categoryId=${categoryId}`]
    if (this.data.form.planFacilityId) {
      params.push(`selectedId=${this.data.form.planFacilityId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.planFacilityName)}`)
    }
    wx.navigateTo({
      url: `/pages/tab/work-order/facility-picker/facility-picker?${params.join('&')}`,
      events: {
        selectFacility: (data) => {
          this.setData({
            'form.planFacilityId': data.id,
            'form.planFacilityName': data.name
          })
        }
      }
    })
  },

  onSelectProjectPoint() {
    console.log('病害确认 - 选择项点')
    const categoryId = this.data.form.planCategoryId
    if (!categoryId) {
      wx.showToast({ title: '请先选择设施分类', icon: 'none' })
      return
    }
    
    const params = [`categoryId=${categoryId}`, 'taskType=1']
    if (this.data.form.planProjectPointId) {
      params.push(`selectedId=${this.data.form.planProjectPointId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.planProjectPointName)}`)
    }
    const query = `?${params.join('&')}`
    
    wx.navigateTo({
      url: `/pages/tab/work-order/project-point-picker/project-point-picker${query}`,
      events: {
        selectProjectPoint: (data) => {
          this.setData({
            'form.planProjectPointId': data.id,
            'form.planProjectPointName': data.name,
            areaInfo: data.areaInfo || { id: null, name: '' },
            facilityInfo: data.facilityInfo || { id: null, name: '' },
            diseaseLibraryInfo: data.diseaseLibraryInfo || { id: null, name: '' },
            faultTypeInfo: data.faultTypeInfo || { id: null, name: '' }
          })
        }
      }
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
        // photoUrls 后端存的是 JSON 字符串，需要解析为数组
        let diseasePhotos = []
        if (detail.photoUrls) {
          try {
            const parsed = typeof detail.photoUrls === 'string'
              ? JSON.parse(detail.photoUrls)
              : detail.photoUrls
            diseasePhotos = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            diseasePhotos = []
          }
        }
        this.setData({
          diseaseDetail: detail,
          reportDate: parts[0] || '',
          reportTimeOnly: parts[1] || '',
          diseasePhotos
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
    if (!this.data.form.planCategoryId) {
      wx.showToast({ title: '请选择设施分类', icon: 'none' })
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
    if (!this.data.form.urgencyLevel) {
      wx.showToast({ title: '请选择紧急程度', icon: 'none' })
      return
    }
    if (!this.data.form.windowTimeId) {
      wx.showToast({ title: '请选择窗口时间', icon: 'none' })
      return
    }
    if (!this.data.form.diseaseReasonId) {
      wx.showToast({ title: '请选择病害原因', icon: 'none' })
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
        confirmRemark: this.data.form.confirmRemark,
        // 计划侧：模板归属（大类）
        planTemplateOwnerId: this.data.form.planTemplateOwnerId || null,
        planTemplateOwnerValue: this.data.form.planTemplateOwnerValue || null,
        planTemplateOwnerName: this.data.form.planTemplateOwnerName || null,
        // 计划侧：模板（中类）
        planTemplateId: this.data.form.planTemplateId || null,
        planTemplateCode: this.data.form.planTemplateCode || null,
        planTemplateName: this.data.form.planTemplateName || null,
        // 计划侧：设施分类（多级分类）
        planCategoryId: this.data.form.planCategoryId || null,
        planCategoryName: this.data.form.planCategoryName || null,
        planCategoryIds: this.data.form.planCategoryIds.length > 0 ? JSON.stringify(this.data.form.planCategoryIds) : null,
        planCategoryNames: this.data.form.planCategoryNames.length > 0 ? JSON.stringify(this.data.form.planCategoryNames) : null,
        // 计划设施
        planFacilityId: this.data.form.planFacilityId || null,
        planFacilityName: this.data.form.planFacilityName || null,
        // 紧急程度
        urgencyLevel: this.data.form.urgencyLevel || null,
        urgencyLevelText: this.data.form.urgencyLevelText || null,
        // 窗口时间
        windowTimeId: this.data.form.windowTimeId || null,
        windowTimeName: this.data.form.windowTimeName || null,
        // 病害原因
        diseaseReasonId: this.data.form.diseaseReasonId || null,
        diseaseReasonName: this.data.form.diseaseReasonName || null
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
