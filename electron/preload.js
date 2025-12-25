const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Students API
  students: {
    getAll: () => ipcRenderer.invoke('students:getAll'),
    search: (query, type) => ipcRenderer.invoke('students:search', query, type),
    getById: (id) => ipcRenderer.invoke('students:getById', id),
    create: (studentData) => ipcRenderer.invoke('students:create', studentData),
    update: (id, studentData) => ipcRenderer.invoke('students:update', id, studentData),
    delete: (id) => ipcRenderer.invoke('students:delete', id),
    bulkCreate: (studentsData, groupName) => ipcRenderer.invoke('students:bulkCreate', studentsData, groupName)
  },

  // Groups API
  groups: {
    getAll: () => ipcRenderer.invoke('groups:getAll'),
    create: (groupData) => ipcRenderer.invoke('groups:create', groupData),
    delete: (id) => ipcRenderer.invoke('groups:delete', id)
  },

  // Transfer Requests API
  transferRequests: {
    create: (requestData) => ipcRenderer.invoke('transferRequests:create', requestData),
    getByStudentId: (studentId) => ipcRenderer.invoke('transferRequests:getByStudentId', studentId)
  }
});
