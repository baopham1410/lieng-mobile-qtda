/**
 * SCRIPT KIỂM TRA TOÀN DIỆN HỆ THỐNG TRƯỚC GIỜ THI / BÁO CÁO (VKU 2026)
 * Chạy: node KIEM_TRA_TOAN_BO_TRUOC_KHI_THI.js
 */

const http = require('http');
const https = require('https');

const checks = [
  { name: '1. Backend API (Laravel :8080)', url: 'http://127.0.0.1:8080/api/v1/products', expectStatus: [200, 401] },
  { name: '2. AutoGrade AI (:8091)', url: 'http://127.0.0.1:8091/docs', expectStatus: [200] },
  { name: '3. Assistant RAG AI (:8090)', url: 'http://127.0.0.1:8090/docs', expectStatus: [200] },
  { name: '4. Web Frontend Vite (:5173)', url: 'http://127.0.0.1:5173/', expectStatus: [200] },
  { name: '5. Mobile Web Portal (:8085)', url: 'http://127.0.0.1:8085/', expectStatus: [200] },
  
  // KIỂM TRA 5 FILE 3D GLB MODELS TRÊN VITE (Tránh lỗi khối hộp tím)
  { name: '6. 3D Model 01 (iPhone 18 Pro Max)', url: 'http://127.0.0.1:5173/models/phone.glb', expectType: 'model/gltf-binary' },
  { name: '7. 3D Model 02 (Galaxy S22 Ultra)', url: 'http://127.0.0.1:5173/models/samsung_galaxy_s22_ultra.glb', expectType: 'model/gltf-binary' },
  { name: '8. 3D Model 03 (iPhone 16 Pro Max)', url: 'http://127.0.0.1:5173/models/iphone_16_pro_max.glb', expectType: 'model/gltf-binary' },
  { name: '9. 3D Model 04 (iPhone 15 Pro Max)', url: 'http://127.0.0.1:5173/models/iphone_15_pro_max.glb', expectType: 'model/gltf-binary' },
  { name: '10. 3D Model 05 (iPhone Fold Duo Concept)', url: 'http://127.0.0.1:5173/models/iphone_duo_concept.glb', expectType: 'model/gltf-binary' },
];

function testUrl(item) {
  return new Promise((resolve) => {
    const lib = item.url.startsWith('https') ? https : http;
    const req = lib.get(item.url, { timeout: 4000 }, (res) => {
      let isOk = true;
      let reason = '';

      if (item.expectStatus && !item.expectStatus.includes(res.statusCode)) {
        isOk = false;
        reason = `HTTP ${res.statusCode} (Kỳ vọng: ${item.expectStatus.join('/')})`;
      }

      if (item.expectType) {
        const type = res.headers['content-type'] || '';
        if (!type.includes(item.expectType)) {
          isOk = false;
          reason = `Type: '${type}' (Kỳ vọng: '${item.expectType}' - NẾU LÀ text/html THÌ BỊ LỖI KHỐI TÍM!)`;
        }
      }

      resolve({ ...item, isOk, reason, status: res.statusCode, type: res.headers['content-type'] });
    });

    req.on('error', (err) => {
      resolve({ ...item, isOk: false, reason: `Không kết nối được: ${err.message}` });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...item, isOk: false, reason: 'Quá thời gian kết nối (Timeout > 4s)' });
    });
  });
}

async function run() {
  console.log('=====================================================================');
  console.log('   KIỂM TRA TỰ ĐỘNG TOÀN DIỆN HỆ THỐNG LIÊNG MOBILE - TRƯỚC GIỜ THI');
  console.log('=====================================================================\n');

  let passed = 0;
  for (const item of checks) {
    const result = await testUrl(item);
    if (result.isOk) {
      console.log(`[\x1b[32mPASS\x1b[0m] ${result.name}`);
      passed++;
    } else {
      console.log(`[\x1b[31mFAIL\x1b[0m] ${result.name} --> ${result.reason}`);
    }
  }

  console.log('\n=====================================================================');
  if (passed === checks.length) {
    console.log(`\x1b[32mKẾT QUẢ: 10/10 DỊCH VỤ HOÀN HẢO! HỆ THỐNG SẴN SÀNG 100% ĐỂ THI BÁO CÁO.\x1b[0m`);
  } else {
    console.log(`\x1b[31mKẾT QUẢ: ${passed}/${checks.length} ĐẠT. Vui lòng kiểm tra lại dịch vụ bị FAIL ở trên!\x1b[0m`);
  }
  console.log('=====================================================================\n');
}

run();
