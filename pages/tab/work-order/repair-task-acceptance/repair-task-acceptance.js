const app = getApp()

function getCurrentTime() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

Page({
  data: {
    loading: true,
    submitting: false,
    taskId: '',
    employeeName: '',
    acceptanceTime: '',
    repairMethodOptions: [],
    acceptanceResultOptions: [],
    form: {
      repairMethodId: null,
      repairMethodName: '',
      repairMethodIndex: null,
      acceptanceResultId: null,
      acceptanceResultName: '',
      acceptanceResultIndex: null,
      acceptancePhotos: [],
      acceptanceRemark: ''
    }
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({
      taskId,
      acceptanceTime: getCurrentTime()
    })
    this.loadOptions()
  },

  async loadOptions() {
    const res = await app.mpGetAuth('/mp/repairTask/acceptanceOptions')
    if (res && Number(res.isSuccess) === 1 && res.result) {
      const { repairMethodOptions, acceptanceResultOptions } = res.result
      // 转换为 { id, name } 格式给 picker
      this.setData({
        repairMethodOptions: (repairMethodOptions || []).map(o => ({ id: o.id, name: o.name })),
        acceptanceResultOptions: (acceptanceResultOptions || []).map(o => ({ id: o.id, name: o.name })),
        loading: false,
        employeeName: app.globalData && app.globalData.userInfo ? (app.globalData.userInfo.employeeName || '') : ''
      })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载选项失败', icon: 'none' })
    }
  },

  onRepairMethodChange(e) {
    const index = Number(e.detail.value)
    const selected = this.data.repairMethodOptions[index]
    this.setData({
      'form.repairMethodId': selected.id,
      'form.repairMethodName': selected.name,
      'form.repairMethodIndex': index
    })
  },

  onAcceptanceResultChange(e) {
    const index = Number(e.detail.value)
    const selected = this.data.acceptanceResultOptions[index]
    this.setData({
      'form.acceptanceResultId': selected.id,
      'form.acceptanceResultName': selected.name,
      'form.acceptanceResultIndex': index
    })
  },

  onPhotosChange(e) {
    this.setData({ 'form.acceptancePhotos': e.detail.fileList })
  },

  onRemarkInput(e) {
    this.setData({ 'form.acceptanceRemark': e.detail.value })
  },

  async onSubmit() {
    const { form, taskId } = this.data
    if (!form.repairMethodId) {
      wx.showToast({ title: '请选择维修方式', icon: 'none' })
      return
    }
    if (!form.acceptanceResultId) {
      wx.showToast({ title: '请选择验收结果', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const res = await app.mpPostAuth('/mp/repairTask/accept', {
      repairTaskId: taskId,
      repairMethod: form.repairMethodId,
      repairMethodName: form.repairMethodName,
      acceptanceResult: form.acceptanceResultId,
      acceptanceResultName: form.acceptanceResultName,
      acceptancePhotos: form.acceptancePhotos,
      acceptanceRemark: form.acceptanceRemark
    })

    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '验收成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '验收失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  }
})
