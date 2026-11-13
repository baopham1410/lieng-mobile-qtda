<?php

namespace Tests\Feature;

use App\Models\AppraisalTicket;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppraisalTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $quanStaff;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin']);
        $quanRole = Role::firstOrCreate(['name' => 'quan_staff'], ['display_name' => 'Nhân viên Quán']);

        $permNames = [
            'appraisal.view',
            'appraisal.create',
            'appraisal.update',
            'appraisal.delete',
            'appraisal.appraise',
        ];

        $permIds = [];
        foreach ($permNames as $name) {
            $permIds[] = Permission::firstOrCreate(['name' => $name], ['module' => 'appraisal'])->id;
        }
        $adminRole->permissions()->syncWithoutDetaching($permIds);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin-test@liengmobile.com',
            'password' => Hash::make('password'),
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        $this->quanStaff = User::create([
            'name' => 'Quan Staff',
            'email' => 'quan-test@liengmobile.com',
            'password' => Hash::make('password'),
            'role_id' => $quanRole->id,
            'is_active' => true,
        ]);
    }

    public function test_appraisal_requires_permission(): void
    {
        Sanctum::actingAs($this->quanStaff);

        $this->getJson('/api/v1/appraisals')->assertStatus(403);
        $this->postJson('/api/v1/appraisals', [
            'model' => 'iPhone 15 Pro',
        ])->assertStatus(403);
    }

    public function test_crud_and_photo_upload_and_appraise_proxy(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin);

        // 1. Pricing endpoint reads official JSON
        $pricingRes = $this->getJson('/api/v1/appraisals/pricing');
        $pricingRes->assertOk()
            ->assertJsonStructure(['data' => ['models', 'floor_prices', 'parts_deductions', 'grading_matrix']]);

        // 2. Create ticket
        $createRes = $this->postJson('/api/v1/appraisals', [
            'customerName' => 'Nguyễn Văn B',
            'customerPhone' => '0901234567',
            'brand' => 'Apple',
            'model' => 'iPhone 15 Pro',
            'storage' => '256GB',
            'imei' => '356938035643809',
            'accessoriesNote' => 'Full box',
            'hardware' => [
                'touch' => 'pass',
                'audio' => 'pass',
                'vibrate' => 'pass',
                'faceId' => 'pass',
                'icloudClean' => true,
                'powerOn' => true,
            ],
        ]);

        $createRes->assertCreated()
            ->assertJsonPath('data.brand', 'Apple')
            ->assertJsonPath('data.model', 'iPhone 15 Pro')
            ->assertJsonPath('data.status', 'draft');

        $ticketId = $createRes->json('data.id');

        // 3. Cannot appraise without photos
        $this->postJson("/api/v1/appraisals/{$ticketId}/appraise")
            ->assertStatus(422);

        // 4. Upload photos to slots (1x1 valid PNG bytes; avoids PHP gd dependency)
        $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $frontFile = UploadedFile::fake()->createWithContent('front.png', $pngBytes);
        $batteryFile = UploadedFile::fake()->createWithContent('battery.png', $pngBytes);

        $uploadFront = $this->postJson("/api/v1/appraisals/{$ticketId}/photos/front", [
            'image' => $frontFile,
        ]);
        $uploadFront->assertOk()
            ->assertJsonPath('data.photosMeta.front', true);

        $uploadBattery = $this->postJson("/api/v1/appraisals/{$ticketId}/photos/battery", [
            'image' => $batteryFile,
        ]);
        $uploadBattery->assertOk()
            ->assertJsonPath('data.photosMeta.battery', true);

        $cornerFile = UploadedFile::fake()->createWithContent('corner_tl.png', $pngBytes);
        $this->postJson("/api/v1/appraisals/{$ticketId}/photos/corner_tl", [
            'image' => $cornerFile,
        ])->assertOk()
            ->assertJsonPath('data.photosMeta.corner_tl', true)
            ->assertJsonPath('data.hardware.wifi', 'pass')
            ->assertJsonPath('data.hardware.screenDisplay', 'good');

        // Signed URL serves photo without bearer token
        $signedUrl = $uploadFront->json('data.photos.front.url');
        $this->assertNotEmpty($signedUrl);
        $this->get($signedUrl)->assertOk();

        // Invalid slot rejected
        $this->postJson("/api/v1/appraisals/{$ticketId}/photos/invalid", [
            'image' => $frontFile,
        ])->assertStatus(422);

        // 5. Mock autograde-service /appraise
        Http::fake([
            'http://127.0.0.1:8091/appraise' => Http::response([
                'grade' => 'B',
                'grade_label' => 'Loại 2 (95% - 98%)',
                'reject' => false,
                'reject_reason' => null,
                'yolo' => [
                    'weights' => 'yolov8s_baseline_best.pt',
                    'detections' => [
                        [
                            'id' => 'det-1',
                            'class' => 'scratch',
                            'raw_class' => 'scratch',
                            'label' => 'Trầy xước nhẹ (scratch)',
                            'confidence' => 0.91,
                            'bbox' => [10, 20, 100, 120],
                            'image' => 'front',
                            'confirmed' => true,
                        ],
                    ],
                ],
                'ocr' => [
                    'model' => 'iPhone 15 Pro',
                    'rom' => '256GB',
                    'battery_percent' => 88,
                    'unknown_part' => false,
                    'raw_text' => 'iPhone 15 Pro 256GB Maximum Capacity 88%',
                    'confidence' => 0.94,
                ],
                'pricing' => [
                    'floor_loai_1' => 19500000,
                    'floor_applied' => 18100000,
                    'extras' => [
                        ['code' => 'battery_below_90', 'source' => 'ocr', 'label' => 'Pin 88% (< 90%)', 'amount' => 1100000],
                    ],
                    'suggested_price' => 17000000,
                    'currency' => 'VND',
                ],
                'deductions' => [
                    ['source' => 'grade', 'label' => 'Chênh lệch Loại 1 → Loại 2 (95% - 98%)', 'amount' => 1400000],
                    ['source' => 'ocr', 'label' => 'Pin 88% (< 90%)', 'amount' => 1100000],
                ],
                'formula_note' => 'floor(Loại 2) - extras',
                'confidence' => 0.91,
            ], 200),
            'http://127.0.0.1:8091/valuate' => Http::response([
                'grade' => 'A',
                'grade_label' => 'Loại 1 (Like New 99%)',
                'reject' => false,
                'yolo' => ['weights' => 'yolov8s_baseline_best.pt', 'detections' => []],
                'ocr' => ['model' => 'iPhone 15 Pro', 'rom' => '256GB', 'battery_percent' => 92, 'unknown_part' => false],
                'pricing' => [
                    'floor_loai_1' => 19500000,
                    'floor_applied' => 19500000,
                    'extras' => [],
                    'suggested_price' => 19500000,
                    'currency' => 'VND',
                ],
                'deductions' => [],
                'formula_note' => 'floor(Loại 1) - extras',
                'confidence' => 0.95,
            ], 200),
        ]);

        $appraiseRes = $this->postJson("/api/v1/appraisals/{$ticketId}/appraise");
        $appraiseRes->assertOk()
            ->assertJsonPath('data.aiResult.ran', true)
            ->assertJsonPath('data.aiResult.mode', 'autograde')
            ->assertJsonPath('data.aiResult.grade', 'B')
            ->assertJsonPath('data.suggestedPrice', 17000000)
            ->assertJsonPath('data.finalPrice', 17000000)
            ->assertJsonPath('data.status', 'quoted');

        // 6. Confirm detections recalculates via /valuate
        $confirmRes = $this->postJson("/api/v1/appraisals/{$ticketId}/confirm-detections", [
            'detections' => [],
            'ocr' => ['model' => 'iPhone 15 Pro', 'rom' => '256GB', 'battery_percent' => 92, 'unknown_part' => false],
        ]);
        $confirmRes->assertOk()
            ->assertJsonPath('data.aiResult.grade', 'A')
            ->assertJsonPath('data.suggestedPrice', 19500000);

        // 7. Update staff override finalPrice and accept
        $updateRes = $this->putJson("/api/v1/appraisals/{$ticketId}", [
            'finalPrice' => 19000000,
            'status' => 'accepted',
        ]);
        $updateRes->assertOk()
            ->assertJsonPath('data.finalPrice', 19000000)
            ->assertJsonPath('data.status', 'accepted');

        // 8. Index lists ticket and stats
        $this->getJson('/api/v1/appraisals?search=iPhone')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('stats.total', 1)
            ->assertJsonPath('stats.accepted', 1);

        // 9. Delete ticket cleans up record
        $this->deleteJson("/api/v1/appraisals/{$ticketId}")->assertOk();
        $this->assertDatabaseMissing('appraisal_tickets', ['id' => $ticketId]);
    }
}
