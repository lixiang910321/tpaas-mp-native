// 拼接区域全层级名称：优先解析 areaNames(JSON数组)，用 - 连接；兜底 areaName
function buildAreaFullName(item) {
  if (!item) return ''
  var names = item.areaNames
  if (names) {
    if (Array.isArray(names)) {
      var arr = names.filter(function (n) { return n != null && String(n).trim() !== '' })
      if (arr.length) return arr.join('-')
    } else if (typeof names === 'string' && names.trim() !== '') {
      try {
        var parsed = JSON.parse(names)
        if (Array.isArray(parsed)) {
          var arr2 = parsed.filter(function (n) { return n != null && String(n).trim() !== '' })
          if (arr2.length) return arr2.join('-')
        }
      } catch (e) {
        return names.trim()
      }
    }
  }
  return item.areaName || ''
}

Page({
  data: {
    loading: true,
    error: '',
    detail: {},
    confirmDetail: {},
    beforePhotos: [],
    suggestedTools: [],
    diseasePhotos: [],
    defectId: ''
  },

  onLoad(options) {
    const defectId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ defectId })
    this.loadDetail()
  },

  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.beforePhotos[index],
      urls: this.data.beforePhotos
    })
  },

  previewDiseasePhoto(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.diseasePhotos
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
      // 确保字典已加载
      await app.getDict('diseaseConfirmStatusEnum')
      await app.getDict('repairTaskResultEnum')

      const res = await app.mpGetAuth(`/mp/diseaseReport/detail/${defectId}`)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const detail = res.result
        // 预计算接报区域全层级名称（areaNames 为 JSON 字符串，无法在 WXML 直接展示）
        detail.areaFullName = buildAreaFullName(detail)
        // 预计算确认详情的枚举文本（从字典获取，禁止硬编码）
        const confirmDetail = detail.confirmDetail || {}
        if (confirmDetail.status != null) {
          confirmDetail.statusText = app.getDictLabel('diseaseConfirmStatusEnum', confirmDetail.status) || '-'
        }
        if (confirmDetail.confirmResult != null) {
          confirmDetail.resultText = app.getDictLabel('repairTaskResultEnum', confirmDetail.confirmResult) || '-'
        }

        this.setData({
          detail,
          confirmDetail: confirmDetail,
          beforePhotos: detail.beforePhotos || [],
          suggestedTools: detail.suggestedTools || [],
          diseasePhotos: detail.photoUrls || []
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
