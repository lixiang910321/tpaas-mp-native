Page({
  data: {
    loading: true,
    error: '',
    detail: {},
    confirmDetail: {},
    beforePhotos: [],
    suggestedTools: [],
    defectId: ''
  },

  STATUS_MAP: {
    10: '待确认',
    20: '已确认',
    30: '处理中',
    40: '已完成'
  },

  RESULT_MAP: {
    10: '正常',
    20: '需维修',
    30: '需更换'
  },

  onLoad(options) {
    const defectId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ defectId })
    this.loadDetail()
  },

  getStatusText(status) {
    return this.STATUS_MAP[status] || '-'
  },

  getStatusClass(status) {
    if (status === 10) return 'status-pending'
    if (status === 20) return 'status-confirmed'
    return ''
  },

  getResultText(result) {
    return this.RESULT_MAP[result] || '-'
  },

  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.beforePhotos[index],
      urls: this.data.beforePhotos
    })
  },

  goConfirm() {
    wx.navigateTo({ url: `/pages/tab/defect/confirm/confirm?id=${encodeURIComponent(this.data.defectId)}` })
  },

  async loadDetail() {
    const defectId = this.data.defectId
    if (!defectId) {
      this.setData({ loading: false, error: '缺少病害ID' })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/diseaseReport/detail?id=${encodeURIComponent(defectId)}`)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const detail = res.result
        this.setData({
          detail,
          confirmDetail: detail.confirmDetail || {},
          beforePhotos: detail.beforePhotos || [],
          suggestedTools: detail.suggestedTools || []
        })
      } else {
        this.setData({ error: (res && res.errorMsg) || '加载失败' })
      }
    } catch (e) {
      this.setData({ error: e?.message || '网络错误' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
