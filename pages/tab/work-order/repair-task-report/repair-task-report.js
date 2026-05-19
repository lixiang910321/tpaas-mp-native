function parseJsonArray(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

Page({
  data: {
    loading: true,
    submitting: false,
    task: {},
    taskId: '',
    form: {
      repairResult: '',
      repairResultId: null,
      repairResultName: '',
      unfixReason: '',
      constructionCategoryId: null,
      constructionCategoryName: '',
      actualProjectPointId: null,
      actualProjectPointName: '',
      repairLaborers: [],
      materialLines: [],
      completionPhotos: [],
      submitRemark: '',
      // 实际侧：模板归属（大类）
      actualTemplateOwnerId: '',
      actualTemplateOwnerValue: '',
      actualTemplateOwnerName: '',
      // 实际侧：模板（中类）
      actualTemplateId: '',
      actualTemplateCode: '',
      actualTemplateName: '',
      // 实际侧：设施分类（多级分类）
      actualCategoryId: '',
      actualCategoryName: '',
      actualCategoryIds: [],
      actualCategoryNames: [],
      // 实际设施
      actualFacilityId: '',
      actualFacilityName: ''
    },
    repairResultOptions: [],
    constructionCategoryOptions: [
      { id: 10, name: '维修' },
      { id: 20, name: '临补' }
    ]
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadRepairResultOptions()
    this.loadTaskDetail()
  },

  // 维修结果选择
  onRepairResultChange(e) {
    const index = e.detail.value
    const selected = this.data.repairResultOptions[index]
    this.setData({
      'form.repairResultId': selected.id,
      'form.repairResultName': selected.name,
      'form.repairResult': selected.name
    })
  },

  // 未修复原因输入
  onUnfixReasonInput(e) {
    this.setData({ 'form.unfixReason': e.detail.value })
  },

  // 施工类别选择
  onConstructionCategoryChange(e) {
    const index = e.detail.value
    const selected = this.data.constructionCategoryOptions[index]
    this.setData({
      'form.constructionCategoryId': selected.id,
      'form.constructionCategoryName': selected.name
    })
  },

  // 实际项点选择
  onSelectActualProjectPoint() {
    const categoryId = this.data.form.actualCategoryId
    wx.navigateTo({
      url: `/pages/tab/work-order/project-point-picker/project-point-picker?taskType=1&categoryId=${categoryId || ''}&selectedId=${this.data.form.actualProjectPointId || ''}`,
      events: {
        selectProjectPoint: (data) => {
          this.setData({
            'form.actualProjectPointId': data.id,
            'form.actualProjectPointName': data.name
          })
        }
      }
    })
  },

  // 实际设施分类选择
  onSelectActualFacilityCategory() {
    wx.navigateTo({
      url: '/pages/tab/work-order/facility-category-picker/facility-category-picker',
      events: {
        selectFacilityCategory: (data) => {
          console.log('维修提报 - 选择实际设施分类结果:', data)
          this.setData({
            // 大类（模板归属）
            'form.actualTemplateOwnerId': data.templateOwnerId || '',
            'form.actualTemplateOwnerValue': data.templateOwnerValue || '',
            'form.actualTemplateOwnerName': data.templateOwnerName || '',
            // 中类（模板）
            'form.actualTemplateId': data.templateId || '',
            'form.actualTemplateCode': data.templateCode || '',
            'form.actualTemplateName': data.templateName || '',
            // 多级分类
            'form.actualCategoryId': data.categoryId || '',
            'form.actualCategoryName': data.categoryName || '',
            'form.actualCategoryIds': data.categoryIds || [],
            'form.actualCategoryNames': data.categoryNames || [],
            // 设施分类变更 → 清空实际设施 + 实际项点
            'form.actualFacilityId': '',
            'form.actualFacilityName': '',
            'form.actualProjectPointId': null,
            'form.actualProjectPointName': ''
          })
        }
      }
    })
  },

  // 实际设施选择
  onSelectActualFacility() {
    const categoryId = this.data.form.actualCategoryId
    if (!categoryId) {
      wx.showToast({ title: '请先选择实际设施分类', icon: 'none' })
      return
    }
    const params = [`categoryId=${categoryId}`]
    if (this.data.form.actualFacilityId) {
      params.push(`selectedId=${this.data.form.actualFacilityId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.actualFacilityName)}`)
    }
    wx.navigateTo({
      url: `/pages/tab/work-order/facility-picker/facility-picker?${params.join('&')}`,
      events: {
        selectFacility: (data) => {
          this.setData({
            'form.actualFacilityId': data.id,
            'form.actualFacilityName': data.name
          })
        }
      }
    })
  },

  // 维修人员选择
  onSelectRepairLaborer() {
    const selectedIds = this.data.form.repairLaborers.map(l => l.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/labor-picker/labor-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectLaborer: (data) => {
          // data.laborers 是选中的劳务人员列表
          this.setData({
            'form.repairLaborers': data.laborers.map(l => ({
              id: l.id,
              name: l.name,
              workTypeId: l.workTypeId,
              workTypeName: l.workTypeName
            }))
          })
        }
      }
    })
  },

  // 删除维修人员
  onDeleteRepairLaborer(e) {
    const index = e.currentTarget.dataset.index
    const repairLaborers = [...this.data.form.repairLaborers]
    repairLaborers.splice(index, 1)
    this.setData({ 'form.repairLaborers': repairLaborers })
  },

  // 物料选择
  onSelectMaterial() {
    const selectedIds = this.data.form.materialLines.map(m => m.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/material-picker/material-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectMaterials: (data) => {
          this.setData({
            'form.materialLines': data.materials.map(m => ({
              id: m.id,
              name: m.name,
              categoryName: m.categoryName || m.name,
              modelSpec: m.modelSpec,
              unit: m.unit || '个',
              quantity: ''
            }))
          })
        }
      }
    })
  },

  // 删除物料
  onDeleteMaterial(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines.splice(index, 1)
    this.setData({ 'form.materialLines': materialLines })
  },

  // 物料数量输入
  onMaterialQuantityInput(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines[index].quantity = e.detail.value
    this.setData({ 'form.materialLines': materialLines })
  },

  // 完工图片变化
  onCompletionPhotosChange(e) {
    this.setData({ 'form.completionPhotos': e.detail.fileList })
  },

  // 提报备注输入
  onSubmitRemarkInput(e) {
    this.setData({ 'form.submitRemark': e.detail.value })
  },

  onCancel() {
    wx.navigateBack()
  },

  async loadRepairResultOptions() {
    const app = getApp()
    const res = await app.mpGetAuth('/mp/repairTask/repairResultOptions')
    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ repairResultOptions: res.result })
    }
  },

  async loadTaskDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少任务ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const app = getApp()
    const res = await app.mpGetAuth(`/mp/repairTask/detail?id=${encodeURIComponent(taskId)}`)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const task = res.result
      
      // 回显上一次的提报数据
      const formData = this.buildReportFormData(task)
      
      this.setData({ 
        task: task,
        loading: false,
        form: formData
      })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 构建提报表单数据(支持回显和重新提报)
  buildReportFormData(task) {
    const formData = {
      repairResult: '',
      repairResultId: null,
      repairResultName: '',
      unfixReason: '',
      constructionCategoryId: null,
      constructionCategoryName: '',
      actualProjectPointId: null,
      actualProjectPointName: '',
      repairLaborers: [],
      materialLines: [],
      completionPhotos: [],
      submitRemark: '',
      // 实际侧：默认带入计划值
      actualTemplateOwnerId: '',
      actualTemplateOwnerValue: '',
      actualTemplateOwnerName: '',
      actualTemplateId: '',
      actualTemplateCode: '',
      actualTemplateName: '',
      actualCategoryId: '',
      actualCategoryName: '',
      actualCategoryIds: [],
      actualCategoryNames: [],
      actualFacilityId: '',
      actualFacilityName: ''
    }

    // 回显维修结果 (10=已修复, 20=未修复)
    if (task.repairResult) {
      formData.repairResultId = task.repairResult
      formData.repairResultName = task.repairResult === 10 ? '已修复' : (task.repairResult === 20 ? '未修复' : '')
      formData.repairResult = formData.repairResultName
    }

    // 回显未修复原因 (后端字段名: unrepairReason)
    if (task.unrepairReason) {
      formData.unfixReason = task.unrepairReason
    }

    // 回显施工类别
    if (task.constructionCategoryId) {
      formData.constructionCategoryId = task.constructionCategoryId
      formData.constructionCategoryName = task.constructionCategoryName
    }

    // 回显实际项点（默认从计划项点获取，优先使用已保存的实际项点）
    if (task.actualProjectPointId) {
      formData.actualProjectPointId = task.actualProjectPointId
      formData.actualProjectPointName = task.actualProjectPointName || ''
    } else if (task.planProjectPointId) {
      formData.actualProjectPointId = task.planProjectPointId
      formData.actualProjectPointName = task.planProjectPointName
    }

    // 回显实际设施分类（默认从计划值获取，优先使用已保存的实际值）
    // 大类（模板归属）
    if (task.actualTemplateOwnerId) {
      formData.actualTemplateOwnerId = task.actualTemplateOwnerId
      formData.actualTemplateOwnerValue = task.actualTemplateOwnerValue || ''
      formData.actualTemplateOwnerName = task.actualTemplateOwnerName || ''
    } else if (task.planTemplateOwnerId) {
      formData.actualTemplateOwnerId = task.planTemplateOwnerId
      formData.actualTemplateOwnerValue = task.planTemplateOwnerValue || ''
      formData.actualTemplateOwnerName = task.planTemplateOwnerName || ''
    }
    // 中类（模板）
    if (task.actualTemplateId) {
      formData.actualTemplateId = task.actualTemplateId
      formData.actualTemplateCode = task.actualTemplateCode || ''
      formData.actualTemplateName = task.actualTemplateName || ''
    } else if (task.planTemplateId) {
      formData.actualTemplateId = task.planTemplateId
      formData.actualTemplateCode = task.planTemplateCode || ''
      formData.actualTemplateName = task.planTemplateName || ''
    }
    // 多级分类
    if (task.actualCategoryId) {
      formData.actualCategoryId = task.actualCategoryId
      formData.actualCategoryName = task.actualCategoryName || ''
      formData.actualCategoryIds = parseJsonArray(task.actualCategoryIds)
      formData.actualCategoryNames = parseJsonArray(task.actualCategoryNames)
    } else if (task.planCategoryId) {
      formData.actualCategoryId = task.planCategoryId
      formData.actualCategoryName = task.planCategoryName || ''
      formData.actualCategoryIds = parseJsonArray(task.planCategoryIds)
      formData.actualCategoryNames = parseJsonArray(task.planCategoryNames)
    }
    // 实际设施
    if (task.actualFacilityId) {
      formData.actualFacilityId = task.actualFacilityId
      formData.actualFacilityName = task.actualFacilityName || ''
    } else if (task.planFacilityId) {
      formData.actualFacilityId = task.planFacilityId
      formData.actualFacilityName = task.planFacilityName || ''
    }

    // 回显完工图片 (后端字段名: completionPhotoUrls)
    if (task.completionPhotoUrls) {
      try {
        const photos = typeof task.completionPhotoUrls === 'string' 
          ? JSON.parse(task.completionPhotoUrls) 
          : task.completionPhotoUrls
        formData.completionPhotos = Array.isArray(photos) ? photos : []
      } catch (e) {
        console.error('解析完工图片失败:', e)
        formData.completionPhotos = []
      }
    }

    // 回显备注 (后端字段名: repairRemark)
    if (task.repairRemark) {
      formData.submitRemark = task.repairRemark
    }

    // 回显维修人员（后端字段名：reportPersonnelList）
    if (task.reportPersonnelList && task.reportPersonnelList.length > 0) {
      try {
        formData.repairLaborers = task.reportPersonnelList.map(l => ({
          id: l.laborerId,
          name: l.laborerName,
          workTypeId: l.workTypeId || '',
          workTypeName: l.workTypeName || ''
        }))
      } catch (e) {
        console.error('解析维修人员失败:', e)
      }
    }

    // 回显物料清单（后端字段名：reportMaterialList）
    if (task.reportMaterialList && task.reportMaterialList.length > 0) {
      try {
        formData.materialLines = task.reportMaterialList.map(m => ({
          id: m.materialId,
          name: m.materialName,
          categoryName: m.materialName,
          modelSpec: m.specification || '',
          unit: m.unit || '个',
          quantity: m.quantity || ''
        }))
      } catch (e) {
        console.error('解析物料清单失败:', e)
      }
    }

    return formData
  },

  async onSubmit() {
    // 校验必填项
    if (!this.data.form.repairResultId) {
      wx.showToast({ title: '请选择维修结果', icon: 'none' })
      return
    }
    if (this.data.form.repairResultId === 20 && !this.data.form.unfixReason) {
      wx.showToast({ title: '请填写未修复原因', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    const app = getApp()
    
    // 构建物料明细
    const materials = this.data.form.materialLines.map(m => ({
      materialId: String(m.id),
      materialName: m.name,
      specification: m.modelSpec,
      unit: m.unit,
      quantity: m.quantity
    }))

    // 构建维修人员
    const repairLaborers = this.data.form.repairLaborers.map(l => ({
      laborerId: String(l.id),
      laborerName: l.name,
      workTypeId: l.workTypeId,
      workTypeName: l.workTypeName
    }))

    const res = await app.mpPostAuth('/mp/repairTask/submit', {
      repairTaskId: this.data.taskId,
      repairResult: this.data.form.repairResultId,
      repairResultName: this.data.form.repairResultName,
      unfixReason: this.data.form.unfixReason,
      constructionCategoryId: this.data.form.constructionCategoryId,
      constructionCategoryName: this.data.form.constructionCategoryName,
      actualProjectPointId: this.data.form.actualProjectPointId,
      actualProjectPointName: this.data.form.actualProjectPointName,
      repairLaborers: repairLaborers,
      materials: materials,
      completionPhotos: this.data.form.completionPhotos,
      submitRemark: this.data.form.submitRemark,
      // 实际侧：模板归属（大类）
      actualTemplateOwnerId: this.data.form.actualTemplateOwnerId || null,
      actualTemplateOwnerValue: this.data.form.actualTemplateOwnerValue || null,
      actualTemplateOwnerName: this.data.form.actualTemplateOwnerName || null,
      // 实际侧：模板（中类）
      actualTemplateId: this.data.form.actualTemplateId || null,
      actualTemplateCode: this.data.form.actualTemplateCode || null,
      actualTemplateName: this.data.form.actualTemplateName || null,
      // 实际侧：设施分类（多级分类）
      actualCategoryId: this.data.form.actualCategoryId || null,
      actualCategoryName: this.data.form.actualCategoryName || null,
      actualCategoryIds: this.data.form.actualCategoryIds.length > 0 ? JSON.stringify(this.data.form.actualCategoryIds) : null,
      actualCategoryNames: this.data.form.actualCategoryNames.length > 0 ? JSON.stringify(this.data.form.actualCategoryNames) : null,
      // 实际设施
      actualFacilityId: this.data.form.actualFacilityId || null,
      actualFacilityName: this.data.form.actualFacilityName || null
    })
    
    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '提报成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '提报失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  }
})
