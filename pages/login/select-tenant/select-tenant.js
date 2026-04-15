const DRAFT_KEY = 'tpaas_mp_login_draft'

Page({
  data: {
    tenants: [],
    filteredList: [],
    selectedId: null,
    searchKeyword: ''
  },

  onLoad() {
    const draft = wx.getStorageSync(DRAFT_KEY)
    const list = draft?.tenantList || []
    
    if (!list.length) {
      wx.showToast({ title: '请返回重新登录', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 600)
      return
    }
    
    // 为每个租户添加 selected 标记
    const tenantsWithSelected = list.map(t => ({
      ...t,
      selected: false
    }))
    
    this.setData({ 
      tenants: tenantsWithSelected,
      filteredList: tenantsWithSelected
    })
    
    // 仅一条时默认选中
    if (list.length === 1) {
      this.selectTenantById(list[0].tenantInfoId)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    
    if (!keyword) {
      this.setData({ filteredList: this.data.tenants })
      return
    }
    
    const filtered = this.data.tenants.filter(t => {
      const name = (t.tenantInfoName || '').toLowerCase()
      const id = String(t.tenantInfoId || '')
      return name.includes(keyword) || id.includes(keyword)
    })
    
    this.setData({ filteredList: filtered })
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ 
      searchKeyword: '',
      filteredList: this.data.tenants 
    })
  },

  // 根据ID选中租户
  selectTenantById(tenantId) {
    const tenants = this.data.tenants.map(t => ({
      ...t,
      selected: String(t.tenantInfoId) === String(tenantId)
    }))
    
    const filtered = tenants.filter(t => {
      if (!this.data.searchKeyword) return true
      const name = (t.tenantInfoName || '').toLowerCase()
      const id = String(t.tenantInfoId || '')
      return name.includes(this.data.searchKeyword) || id.includes(this.data.searchKeyword)
    })
    
    this.setData({ 
      tenants,
      filteredList: filtered,
      selectedId: tenantId
    })
  },

  // 选择租户
  onSelectTenant(e) {
    const tenant = e.currentTarget.dataset.tenant
    const index = e.currentTarget.dataset.index
    
    if (tenant && tenant.tenantInfoId != null) {
      this.selectTenantById(tenant.tenantInfoId)
    }
  },

  // 显示提示
  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  },

  // 确认选择
  onConfirm() {
    if (this.data.selectedId == null) {
      this.showToast('请选择租户')
      return
    }
    
    const draft = wx.getStorageSync(DRAFT_KEY) || {}
    wx.setStorageSync(DRAFT_KEY, {
      ...draft,
      tenantId: this.data.selectedId
    })
    wx.redirectTo({ url: '/pages/login/select-project/select-project' })
  }
})
