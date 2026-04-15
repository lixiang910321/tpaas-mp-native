const DRAFT_KEY = 'tpaas_mp_login_draft'
const STORAGE_TOKEN = 'tpaas_mp_access_token'

Page({
  data: {
    loading: true,
    loadError: '',
    projects: [],
    filteredList: [],
    selectedId: null,
    submitting: false,
    draft: null,
    searchKeyword: ''
  },

  onLoad() {
    this.fetchProjects()
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    
    if (!keyword) {
      this.setData({ filteredList: this.data.projects })
      return
    }
    
    const filtered = this.data.projects.filter(p => {
      const name = (p.name || '').toLowerCase()
      const code = (p.code || '').toLowerCase()
      const id = String(p.id || '')
      return name.includes(keyword) || code.includes(keyword) || id.includes(keyword)
    })
    
    this.setData({ filteredList: filtered })
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ 
      searchKeyword: '',
      filteredList: this.data.projects 
    })
  },

  // 根据ID选中项目
  selectProjectById(projectId) {
    const projects = this.data.projects.map(p => ({
      ...p,
      selected: String(p.id) === String(projectId)
    }))
    
    const filtered = projects.filter(p => {
      if (!this.data.searchKeyword) return true
      const name = (p.name || '').toLowerCase()
      const code = (p.code || '').toLowerCase()
      const id = String(p.id || '')
      return name.includes(this.data.searchKeyword) || code.includes(this.data.searchKeyword) || id.includes(this.data.searchKeyword)
    })
    
    this.setData({ 
      projects,
      filteredList: filtered,
      selectedId: projectId
    })
  },

  // 选择项目
  onSelectProject(e) {
    const project = e.currentTarget.dataset.project
    
    if (project && project.id != null) {
      this.selectProjectById(project.id)
    }
  },

  // 显示提示
  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  },

  // 获取项目列表
  async fetchProjects() {
    this.setData({ loading: true, loadError: '' })
    
    const app = getApp()
    const draft = wx.getStorageSync(DRAFT_KEY)
    
    this.setData({ draft })
    
    if (!draft?.tenantId || !draft?.userName || draft.password == null) {
      this.setData({
        loadError: '登录信息已失效,请返回重新登录'
      })
      this.setData({ loading: false })
      return
    }
    
    const res = await app.mpPost('/mp/login/loginListProjects', {
      userName: draft.userName,
      password: draft.password,
      tenantId: draft.tenantId
    })
    
    if (!res || res.isSuccess !== 1) {
      this.setData({
        loadError: res?.errorMsg || '获取项目失败',
        projects: [],
        filteredList: [],
        loading: false
      })
      return
    }
    
    const list = res.result || []
    const projects = Array.isArray(list)
      ? list.map(p => ({ 
          ...p, 
          id: p.id != null ? String(p.id) : p.id,
          selected: false
        }))
      : []
    
    this.setData({ 
      projects,
      filteredList: projects,
      loading: false
    })
    
    // 仅一个项目时默认选中
    if (projects.length === 1) {
      this.selectProjectById(projects[0].id)
    }
  },

  // 确认选择
  async onConfirm() {
    const draft = this.data.draft || wx.getStorageSync(DRAFT_KEY)
    
    if (!draft?.tenantId) {
      this.showToast('请先选择租户')
      return
    }
    
    if (this.data.selectedId == null) {
      this.showToast('请选择项目')
      return
    }
    
    this.setData({ submitting: true })
    
    const app = getApp()
    const step2 = await app.mpPost('/mp/login/loginStep2', {
      userName: draft.userName,
      password: draft.password,
      tenantId: draft.tenantId != null ? String(draft.tenantId) : null,
      projectId: String(this.data.selectedId),
      remember: 0
    })
    
    if (!step2 || step2.isSuccess !== 1) {
      this.showToast(step2?.errorMsg || '登录失败')
      this.setData({ submitting: false })
      return
    }
    
    const token = step2.result?.accessToken
    if (!token) {
      this.showToast('未返回令牌')
      this.setData({ submitting: false })
      return
    }
    
    wx.removeStorageSync(DRAFT_KEY)
    wx.setStorageSync(STORAGE_TOKEN, token)
    
    // 更新全局登录信息
    app.setLoginInfo({ token, userInfo: step2.result })
    
    this.showToast('登录成功')
    
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/tab/work-order/index/index' })
    }, 400)
    this.setData({ submitting: false })
  }
})
