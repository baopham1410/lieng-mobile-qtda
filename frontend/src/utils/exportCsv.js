export function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = c.value(row)
          const text = val == null ? '' : String(val)
          return `"${text.replace(/"/g, '""')}"`
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
