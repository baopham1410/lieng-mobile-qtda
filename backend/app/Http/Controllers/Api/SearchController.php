<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $like = '%'.$q.'%';
        $results = collect();

        Product::query()
            ->where('name', 'ilike', $like)
            ->orWhere('model_code', 'ilike', $like)
            ->limit(5)
            ->get()
            ->each(fn (Product $p) => $results->push([
                'type' => 'product',
                'label' => $p->name,
                'hint' => $p->model_code,
                'to' => '/products',
            ]));

        Customer::query()
            ->where('name', 'ilike', $like)
            ->orWhere('phone', 'ilike', $like)
            ->limit(5)
            ->get()
            ->each(fn (Customer $c) => $results->push([
                'type' => 'customer',
                'label' => $c->name,
                'hint' => $c->phone,
                'to' => '/customers',
            ]));

        Order::query()
            ->where('code', 'ilike', $like)
            ->limit(5)
            ->get()
            ->each(fn (Order $o) => $results->push([
                'type' => 'order',
                'label' => $o->code,
                'hint' => number_format((float) $o->total, 0, ',', '.').' ₫',
                'to' => '/orders',
            ]));

        if (preg_match('/^\d{6,}$/', preg_replace('/\D/', '', $q))) {
            $imei = preg_replace('/\D/', '', $q);
            ImeiCode::query()
                ->where('imei', 'ilike', '%'.$imei.'%')
                ->limit(3)
                ->get()
                ->each(fn (ImeiCode $i) => $results->push([
                    'type' => 'imei',
                    'label' => $i->imei,
                    'hint' => 'Tra cứu bảo hành',
                    'to' => '/warranty',
                ]));
        }

        return response()->json(['data' => $results->take(12)->values()]);
    }
}
