<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuanStatementResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'code' => $this->code,
            'statementDate' => $this->statement_date?->toDateString(),
            'incomeTotal' => (float) $this->income_total,
            'expenseTotal' => (float) $this->expense_total,
            'cashTotal' => (float) $this->cash_total,
            'transferTotal' => (float) $this->transfer_total,
            'netTotal' => (float) $this->net_total,
            'salesCount' => (int) $this->sales_count,
            'expenseCount' => (int) $this->expense_count,
            'rowCount' => (int) $this->row_count,
            'note' => $this->note,
            'staffName' => $this->user?->name ?? '',
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];

        if (! in_array('rows_snapshot', $this->resource->getHidden(), true)) {
            $data['rowsSnapshot'] = $this->rows_snapshot ?? [];
        }

        return $data;
    }
}
