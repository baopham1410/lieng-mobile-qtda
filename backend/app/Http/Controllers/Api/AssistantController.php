<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AssistantController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        return $this->proxyQuery('kb_admin', $validated['message']);
    }

    public function publicChat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        return $this->proxyQuery('kb_public', $validated['message']);
    }

    public function health(): JsonResponse
    {
        $base = config('assistant.base_url');
        $timeout = config('assistant.timeout');

        try {
            $response = Http::timeout(min(10, $timeout))->get("{$base}/health");
            if (! $response->successful()) {
                return response()->json([
                    'ok' => false,
                    'assistant_service' => false,
                    'message' => 'assistant-service trả lỗi HTTP '.$response->status(),
                ], 503);
            }

            return response()->json([
                'ok' => true,
                'assistant_service' => $response->json(),
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'ok' => false,
                'assistant_service' => false,
                'message' => 'Không kết nối được assistant-service tại '.$base.'. Hãy chạy uvicorn :8090 và Ollama.',
            ], 503);
        }
    }

    private function proxyQuery(string $collection, string $message): JsonResponse
    {
        $base = config('assistant.base_url');
        $timeout = config('assistant.timeout');

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->post("{$base}/query", [
                    'collection' => $collection,
                    'question' => $message,
                    'top_k' => 4,
                ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Trợ lý AI chưa sẵn sàng. Bật Ollama + assistant-service (port 8090).',
            ], 503);
        }

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();

            return response()->json([
                'message' => is_string($detail) ? $detail : 'assistant-service lỗi khi trả lời.',
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        }

        $data = $response->json();

        return response()->json([
            'data' => [
                'answer' => (string) ($data['answer'] ?? ''),
                'sources' => $data['sources'] ?? [],
                'collection' => $data['collection'] ?? $collection,
                'model' => $data['model'] ?? null,
            ],
        ]);
    }
}
