<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\AuthPayloadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->select(['id', 'name', 'email', 'phone', 'avatar_url', 'password', 'role_id', 'is_active', 'created_at', 'updated_at'])
            ->with('role:id,name,display_name')
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Tài khoản đã bị khóa. Vui lòng liên hệ quản lý cửa hàng.',
            ], 403);
        }

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => AuthPayloadService::forUser($user),
            'message' => 'Đăng nhập thành công',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Đăng xuất thành công',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('role:id,name,display_name');

        return response()->json([
            'data' => AuthPayloadService::forUser($user),
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $deviceName = $request->user()->currentAccessToken()?->name ?? 'web';

        $request->user()->currentAccessToken()?->delete();

        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => AuthPayloadService::forUser($user),
            'message' => 'Làm mới token thành công',
        ]);
    }
}
