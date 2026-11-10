<script setup>
import { computed } from 'vue'
import { formatStatementMoney, paymentMethodLabels } from '@/mocks/financeMock'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  periodLabel: { type: String, default: 'Hôm nay' },
  periodFrom: { type: String, default: '' },
  periodTo: { type: String, default: '' },
  staffName: { type: String, default: '' },
  shopName: { type: String, default: 'Lieng Mobile — Sao kê cửa hàng' },
  reportCode: { type: String, default: '' },
  archivedAt: { type: String, default: '' },
})

const sortedRows = computed(() =>
  [...props.rows].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)),
)

const summary = computed(() => {
  let income = 0
  let expense = 0
  let cash = 0
  let transfer = 0
  let salesCount = 0
  let expenseCount = 0

  for (const row of props.rows) {
    const amount = Number(row.amount) || 0
    if (row.type === 'income') {
      income += amount
      cash += Number(row.cashAmount) || 0
      transfer += Number(row.transferAmount) || 0
      salesCount += row.qty || 1
    } else {
      expense += amount
      expenseCount += 1
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    cash,
    transfer,
    salesCount,
    expenseCount,
    totalRows: props.rows.length,
  }
})

const printedAt = computed(() => {
  const opts = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  if (props.archivedAt) return new Date(props.archivedAt).toLocaleString('vi-VN', opts)
  return new Date().toLocaleString('vi-VN', opts)
})

const displayCode = computed(() => {
  if (props.reportCode) return props.reportCode
  const d = new Date()
  return `SK-QN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
})

const titleParts = computed(() => {
  const raw = props.shopName || 'Lieng Mobile — Sao kê cửa hàng'
  const idx = raw.indexOf(' — ')
  if (idx === -1) return { main: raw, sub: '' }
  return { main: raw.slice(0, idx), sub: raw.slice(idx + 3) }
})

function formatDateTime(iso) {
  if (!iso) return { time: '—', date: '' }
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  }
}

function payLabel(row) {
  return paymentMethodLabels[row.paymentMethod] || row.paymentMethod || '—'
}
</script>

<template>
  <article class="quan-statement-sheet">
    <header class="qs-head">
      <div class="qs-head-row">
        <div class="qs-head-brand">
          <p class="qs-kicker">Sao kê báo cáo</p>
          <h1 class="qs-title">
            <span class="qs-title-main">{{ titleParts.main }}</span>
            <span v-if="titleParts.sub" class="qs-title-sub">{{ titleParts.sub }}</span>
          </h1>
          <p class="qs-sub">Bảng tổng hợp thu — chi theo kỳ</p>
        </div>
        <div class="qs-meta">
          <p><span class="qs-muted">Mã:</span> <strong class="qs-mono">{{ displayCode }}</strong></p>
          <p><span class="qs-muted">In lúc:</span> {{ printedAt }}</p>
          <p v-if="staffName"><span class="qs-muted">Người lập:</span> {{ staffName }}</p>
        </div>
      </div>

      <div class="qs-cards">
        <div class="qs-card">
          <p class="qs-card-label">Kỳ báo cáo</p>
          <p class="qs-card-value" :title="periodLabel">{{ periodLabel }}</p>
        </div>
        <div class="qs-card">
          <p class="qs-card-label">Từ ngày</p>
          <p class="qs-card-value" :title="periodFrom || '—'">{{ periodFrom || '—' }}</p>
        </div>
        <div class="qs-card">
          <p class="qs-card-label">Đến ngày</p>
          <p class="qs-card-value" :title="periodTo || '—'">{{ periodTo || '—' }}</p>
        </div>
        <div class="qs-card qs-card-rows">
          <p class="qs-card-label">Số dòng</p>
          <p class="qs-card-value" :title="`${summary.totalRows} giao dịch`">
            <span class="qs-rows-num">{{ summary.totalRows }}</span>
            <span class="qs-rows-unit"> giao dịch</span>
          </p>
        </div>
      </div>
    </header>

    <section class="qs-section">
      <h2 class="qs-section-title">Tóm tắt kỳ</h2>
      <div class="qs-table-wrap">
        <table class="qs-table qs-summary-table">
          <tbody>
            <tr>
              <td class="qs-cell-label">Tổng thu (bán)</td>
              <td class="qs-money qs-green">{{ formatStatementMoney(summary.income) }}</td>
              <td class="qs-cell-label">Số món bán</td>
              <td class="qs-num">{{ summary.salesCount }}</td>
            </tr>
            <tr>
              <td class="qs-cell-label">Tiền mặt nhận</td>
              <td class="qs-money qs-green-dark">{{ formatStatementMoney(summary.cash) }}</td>
              <td class="qs-cell-label">Chuyển khoản</td>
              <td class="qs-money qs-blue">{{ formatStatementMoney(summary.transfer) }}</td>
            </tr>
            <tr>
              <td class="qs-cell-label">Tổng chi</td>
              <td class="qs-money qs-red">{{ formatStatementMoney(summary.expense) }}</td>
              <td class="qs-cell-label">Số khoản chi</td>
              <td class="qs-num">{{ summary.expenseCount }}</td>
            </tr>
            <tr class="qs-net-row">
              <td class="qs-net-label" colspan="2">Còn lại (Thu − Chi)</td>
              <td
                class="qs-net-value"
                colspan="2"
                :class="summary.net >= 0 ? 'qs-net-pos' : 'qs-net-neg'"
              >
                {{ formatStatementMoney(summary.net) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="qs-section">
      <h2 class="qs-section-title">Chi tiết giao dịch</h2>
      <div class="qs-table-wrap">
        <table class="qs-table qs-detail-table">
          <thead>
            <tr class="qs-thead">
              <th>#</th>
              <th>Thời gian</th>
              <th>Mã</th>
              <th>Nội dung</th>
              <th>Loại</th>
              <th>SL</th>
              <th>Thanh toán</th>
              <th class="qs-right">Tiền mặt</th>
              <th class="qs-right">CK / TK</th>
              <th class="qs-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sortedRows.length">
              <td colspan="10" class="qs-empty">Không có giao dịch trong kỳ.</td>
            </tr>
            <tr
              v-for="(row, idx) in sortedRows"
              :key="row.id ?? idx"
              :class="idx % 2 === 1 ? 'qs-stripe' : ''"
            >
              <td class="qs-muted">{{ idx + 1 }}</td>
              <td class="qs-datetime">
                <span class="qs-time">{{ formatDateTime(row.occurredAt).time }}</span>
                <span class="qs-date">{{ formatDateTime(row.occurredAt).date }}</span>
              </td>
              <td class="qs-mono qs-code">{{ row.code || '—' }}</td>
              <td class="qs-content">
                <span>{{ row.title }}</span>
                <small v-if="row.note" class="qs-note">{{ row.note }}</small>
              </td>
              <td class="qs-center">
                <span class="qs-badge" :class="row.type === 'income' ? 'qs-badge-in' : 'qs-badge-out'">
                  {{ row.type === 'income' ? 'Thu' : 'Chi' }}
                </span>
              </td>
              <td class="qs-center">{{ row.type === 'income' ? row.qty || 1 : '—' }}</td>
              <td class="qs-nowrap">{{ payLabel(row) }}</td>
              <td class="qs-right">{{ Number(row.cashAmount) > 0 ? formatStatementMoney(row.cashAmount) : '—' }}</td>
              <td class="qs-right">{{ Number(row.transferAmount) > 0 ? formatStatementMoney(row.transferAmount) : '—' }}</td>
              <td class="qs-right qs-bold" :class="row.type === 'income' ? 'qs-green' : 'qs-red'">
                {{ row.type === 'income' ? '+' : '−' }}{{ formatStatementMoney(row.amount) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="qs-foot">
              <td colspan="7">Tổng cộng</td>
              <td class="qs-right qs-green-dark">{{ formatStatementMoney(summary.cash) }}</td>
              <td class="qs-right qs-blue">{{ formatStatementMoney(summary.transfer) }}</td>
              <td class="qs-right qs-bold" :class="summary.net >= 0 ? 'qs-green-dark' : 'qs-red'">
                {{ formatStatementMoney(summary.net) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <footer class="qs-signatures">
      <div>
        <p class="qs-sign-title">Người lập phiếu</p>
        <p class="qs-sign-hint">(Ký, ghi rõ họ tên)</p>
        <div class="qs-sign-line" />
        <p class="qs-sign-name">{{ staffName || '…………………' }}</p>
      </div>
      <div class="qs-sign-hide-sm">
        <p class="qs-sign-title">Thủ quỹ</p>
        <p class="qs-sign-hint">(Ký, ghi rõ họ tên)</p>
        <div class="qs-sign-line" />
        <p class="qs-sign-name">…………………</p>
      </div>
      <div>
        <p class="qs-sign-title">Người duyệt</p>
        <p class="qs-sign-hint">(Ký, ghi rõ họ tên)</p>
        <div class="qs-sign-line" />
        <p class="qs-sign-name">…………………</p>
      </div>
    </footer>

    <p class="qs-footer-note">
      Tài liệu được tạo tự động từ hệ thống Lieng Mobile · Sao kê cửa hàng · {{ displayCode }}
    </p>
  </article>
</template>

<style scoped>
.quan-statement-sheet {
  box-sizing: border-box;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0;
  font-family: Tahoma, 'Segoe UI', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #111118;
  background: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.quan-statement-sheet * {
  box-sizing: border-box;
}

.qs-head {
  border-bottom: 2px solid #111118;
  padding-bottom: 16px;
}

.qs-head-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.qs-head-brand {
  min-width: 0;
  flex: 1;
}

.qs-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #92400e;
}

.qs-title {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.qs-title-main {
  display: block;
}

.qs-title-sub {
  display: block;
  margin-top: 2px;
  font-size: 18px;
  font-weight: 700;
  color: #334155;
}

.qs-sub {
  margin: 4px 0 0;
  font-size: 14px;
  color: #475569;
}

.qs-meta {
  text-align: right;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
  flex-shrink: 0;
  min-width: 210px;
}

.qs-meta p {
  margin: 0;
  word-break: break-all;
}

.qs-muted {
  color: #94a3b8;
}

.qs-mono {
  font-family: Consolas, 'Courier New', monospace;
}

.qs-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  max-width: 100%;
}

.qs-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  padding: 8px 12px;
}

.qs-card-label {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-card-value {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-rows-unit {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.qs-section {
  margin-top: 20px;
}

.qs-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.qs-table-wrap {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
}

.qs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.qs-summary-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.qs-cell-label {
  background: #f8fafc;
  color: #475569;
  font-weight: 500;
  width: 22%;
}

.qs-money,
.qs-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.qs-green { color: #047857; font-weight: 700; }
.qs-green-dark { color: #065f46; font-weight: 700; }
.qs-blue { color: #0369a1; font-weight: 700; }
.qs-red { color: #dc2626; font-weight: 700; }

.qs-net-row td {
  border-bottom: none;
}

.qs-net-label {
  background: #111118 !important;
  color: #ffffff !important;
  font-weight: 700;
}

.qs-net-value {
  text-align: right;
  font-size: 16px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.qs-net-pos {
  background: #ecfdf5;
  color: #065f46;
}

.qs-net-neg {
  background: #fef2f2;
  color: #b91c1c;
}

.qs-detail-table {
  font-size: 11px;
}

.qs-thead th {
  background: #111118;
  color: #ffffff;
  padding: 10px 6px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
}

.qs-detail-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
  word-wrap: break-word;
}

.qs-stripe {
  background: #f8fafc;
}

.qs-thead th:nth-child(1) { width: 3%; }
.qs-thead th:nth-child(2) { width: 10%; }
.qs-thead th:nth-child(3) { width: 9%; }
.qs-thead th:nth-child(4) { width: 17%; }
.qs-thead th:nth-child(5) { width: 6%; }
.qs-thead th:nth-child(6) { width: 4%; }
.qs-thead th:nth-child(7) { width: 9%; }
.qs-thead th:nth-child(8) { width: 13%; }
.qs-thead th:nth-child(9) { width: 13%; }
.qs-thead th:nth-child(10) { width: 16%; }

.qs-datetime {
  line-height: 1.25;
}

.qs-time {
  display: block;
  font-weight: 600;
  white-space: nowrap;
}

.qs-date {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
}

.qs-right { text-align: right; }
.qs-center { text-align: center; }
.qs-nowrap { white-space: nowrap; }
.qs-bold { font-weight: 700; }

.qs-code {
  font-size: 9px;
}

.qs-content span {
  display: block;
  font-weight: 500;
}

.qs-note {
  display: block;
  margin-top: 2px;
  font-size: 9px;
  color: #94a3b8;
}

.qs-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.qs-badge-in {
  background: #d1fae5;
  color: #065f46;
}

.qs-badge-out {
  background: #fee2e2;
  color: #b91c1c;
}

.qs-empty {
  padding: 32px;
  text-align: center;
  color: #94a3b8;
}

.qs-foot td {
  background: #f1f5f9;
  font-weight: 700;
  padding: 10px 6px;
  border-top: 2px solid #111118;
}

.qs-signatures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;
  text-align: center;
  font-size: 14px;
}

.qs-sign-title {
  margin: 0;
  font-weight: 700;
}

.qs-sign-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.qs-sign-line {
  margin: 64px 0 0;
  border-bottom: 1px dashed #cbd5e1;
}

.qs-sign-name {
  margin: 8px 0 0;
  font-size: 12px;
  color: #64748b;
}

.qs-footer-note {
  margin: 32px 0 0;
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .qs-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .qs-sign-hide-sm {
    display: none;
  }
  .qs-signatures {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 440px) {
  .qs-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media print {
  .quan-statement-sheet {
    max-width: none;
  }
  .qs-detail-table th,
  .qs-detail-table td {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

/* Tối ưu khi export PNG — tránh lỗi font/chữ chồng của html2canvas */
.quan-statement-sheet.quan-statement-capture {
  max-width: 820px;
  width: 820px;
  font-family: Tahoma, Arial, sans-serif;
}

.quan-statement-sheet.quan-statement-capture .qs-kicker,
.quan-statement-sheet.quan-statement-capture .qs-section-title {
  letter-spacing: 0.06em;
}

.quan-statement-sheet.quan-statement-capture .qs-title,
.quan-statement-sheet.quan-statement-capture .qs-title-sub {
  font-weight: 700;
}
</style>
