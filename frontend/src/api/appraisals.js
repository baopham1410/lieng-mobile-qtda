import apiClient, { silentRequest } from './client'
import { unwrapApiData } from '@/utils/apiFallback'

export async function fetchAppraisalHealth() {
  const { data } = await apiClient.get('/appraisals/health', {
    ...silentRequest,
    timeout: 5000,
  })
  return data
}

export async function fetchAppraisalPricing() {
  const { data } = await apiClient.get('/appraisals/pricing', silentRequest)
  return unwrapApiData(data)
}

export async function fetchAppraisals(params = {}) {
  const { data } = await apiClient.get('/appraisals', { params, ...silentRequest })
  return {
    rows: Array.isArray(data?.data) ? data.data : [],
    stats: data?.stats ?? null,
  }
}

export async function fetchAppraisal(id) {
  const { data } = await apiClient.get(`/appraisals/${id}`, silentRequest)
  return unwrapApiData(data)
}

export async function createAppraisal(payload) {
  const { data } = await apiClient.post('/appraisals', payload, {
    loadingMessage: 'Đang tạo phiếu thẩm định…',
  })
  return unwrapApiData(data)
}

export async function updateAppraisal(id, payload) {
  const { data } = await apiClient.put(`/appraisals/${id}`, payload, {
    loadingMessage: 'Đang lưu phiếu thẩm định…',
  })
  return unwrapApiData(data)
}

export async function deleteAppraisal(id) {
  const { data } = await apiClient.delete(`/appraisals/${id}`, {
    loadingMessage: 'Đang xóa phiếu…',
  })
  return data
}

export async function uploadAppraisalPhoto(id, slot, file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await apiClient.post(`/appraisals/${id}/photos/${slot}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
    ...silentRequest,
  })
  return unwrapApiData(data)
}

export async function removeAppraisalPhoto(id, slot) {
  const { data } = await apiClient.delete(`/appraisals/${id}/photos/${slot}`, silentRequest)
  return unwrapApiData(data)
}

export async function runAppraisalAi(id, payload = {}) {
  const { data } = await apiClient.post(`/appraisals/${id}/appraise`, payload, {
    timeout: 90000,
    loadingMessage: 'Đang chạy YOLOv8 + PaddleOCR…',
  })
  return unwrapApiData(data)
}

export async function confirmAppraisalDetections(id, payload) {
  const { data } = await apiClient.post(`/appraisals/${id}/confirm-detections`, payload, {
    timeout: 30000,
    loadingMessage: 'Đang tính lại giá…',
  })
  return unwrapApiData(data)
}
