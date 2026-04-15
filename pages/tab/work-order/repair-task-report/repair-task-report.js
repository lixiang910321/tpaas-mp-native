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
      submitRemark: ''
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
    wx.navigateTo({
      url: `/pages/tab/work-order/project-point-picker/project-point-picker?selectedId=${this.data.form.actualProjectPointId || ''}`,
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
      submitRemark: ''
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

    // 回显实际项点
    if (task.projectPointId) {
      formData.actualProjectPointId = task.projectPointId
      formData.actualProjectPointName = task.projectPointName
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

    // 回显维修人员
    if (task.repairLaborers) {
      try {
        const laborers = typeof task.repairLaborers === 'string'
          ? JSON.parse(task.repairLaborers)
          : task.repairLaborers
        formData.repairLaborers = laborers.map(l => ({
          id: l.laborerId,
          name: l.laborerName,
          workTypeId: l.workTypeId,
          workTypeName: l.workTypeName
        }))
      } catch (e) {
        console.error('解析维修人员失败:', e)
      }
    }

    // 回显物料清单
    if (task.materials) {
      try {
        const materials = typeof task.materials === 'string'
          ? JSON.parse(task.materials)
          : task.materials
        formData.materialLines = materials.map(m => ({
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
      projectPointId: this.data.form.actualProjectPointId,
      projectPointName: this.data.form.actualProjectPointName,
      repairLaborers: repairLaborers,
      materials: materials,
      completionPhotos: this.data.form.completionPhotos,
      submitRemark: this.data.form.submitRemark
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
