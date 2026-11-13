from __future__ import annotations

import unittest

from app.ocr_engine import parse_battery_screen_text
from app.pricing import evaluate_appraisal
from app.yolo_engine import map_class_name


class PricingAndGradingTests(unittest.TestCase):
    def test_yolo_alias_mapping(self):
        self.assertEqual(map_class_name("cracked_screenrotation")[0], "cracked_screen")
        self.assertEqual(map_class_name("damagedrotation")[0], "damaged_screen")
        self.assertEqual(map_class_name("goodrotation")[0], "good")
        self.assertEqual(map_class_name("scratch")[0], "scratch")

    def test_pricing_loai_1_to_4_and_extras(self):
        # Loại 1 Like New: no defects, pin 94% -> 23,500,000 for iPhone 15 Pro Max 256GB
        res1 = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[{"class": "good", "confidence": 0.95, "confirmed": True}],
            ocr={"model": "iPhone 15 Pro Max", "rom": "256GB", "battery_percent": 94, "unknown_part": False},
            hardware={"touch": "pass", "audio": "pass", "vibrate": "pass", "faceId": "pass", "icloudClean": True, "powerOn": True},
        )
        self.assertEqual(res1["grade"], "A")
        self.assertEqual(res1["pricing"]["floor_applied"], 23500000)
        self.assertEqual(res1["pricing"]["suggested_price"], 23500000)

        # Loại 2 scratch + pin 86% (<90%): floor Loại 2 (22,000,000) - battery_below_90 (1,200,000) = 20,800,000
        res2 = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[{"class": "scratch", "confidence": 0.9, "confirmed": True}],
            ocr={"model": "iPhone 15 Pro Max", "rom": "256GB", "battery_percent": 86, "unknown_part": False},
            hardware={"touch": "pass", "audio": "pass", "vibrate": "pass", "faceId": "pass", "icloudClean": True, "powerOn": True},
        )
        self.assertEqual(res2["grade"], "B")
        self.assertEqual(res2["pricing"]["floor_applied"], 22000000)
        self.assertEqual(res2["pricing"]["suggested_price"], 20800000)

        # Dismissing the scratch detection returns it to Loại 1 if pin >= 90%
        res_dismissed = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[{"class": "scratch", "confidence": 0.9, "confirmed": False}],
            ocr={"model": "iPhone 15 Pro Max", "rom": "256GB", "battery_percent": 92, "unknown_part": False},
            hardware={"touch": "pass", "audio": "pass", "vibrate": "pass", "faceId": "pass", "icloudClean": True, "powerOn": True},
        )
        self.assertEqual(res_dismissed["grade"], "A")
        self.assertEqual(res_dismissed["pricing"]["suggested_price"], 23500000)

        # Loại 3 cracked_screen -> 20,000,000
        res3 = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[{"class": "cracked_screen", "confidence": 0.88, "confirmed": True}],
            ocr={"battery_percent": 93, "unknown_part": False},
            hardware={"icloudClean": True, "powerOn": True},
        )
        self.assertEqual(res3["grade"], "C")
        self.assertEqual(res3["pricing"]["floor_applied"], 20000000)

        # Loại 4 damaged_screen -> 14,500,000
        res4 = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[{"class": "damaged_screen", "confidence": 0.92, "confirmed": True}],
            ocr={"battery_percent": 93, "unknown_part": False},
            hardware={"icloudClean": True, "powerOn": True},
        )
        self.assertEqual(res4["grade"], "D")
        self.assertEqual(res4["pricing"]["floor_applied"], 14500000)

        # iCloud locked -> reject
        res_reject = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[],
            ocr={},
            hardware={"icloudClean": False, "powerOn": True},
        )
        self.assertTrue(res_reject["reject"])
        self.assertEqual(res_reject["grade"], "reject")
        self.assertEqual(res_reject["pricing"]["suggested_price"], 0)

    def test_ocr_battery_screen_parser(self):
        parsed_vi = parse_battery_screen_text(
            [
                "Giới thiệu",
                "Tên kiểu máy",
                "iPhone 15 Pro",
                "Dung lượng",
                "256 GB",
                "Tình trạng pin",
                "Dung lượng tối đa",
                "87%",
                "Linh kiện không xác định",
            ],
            avg_confidence=0.95,
        )
        self.assertEqual(parsed_vi["model"], "iPhone 15 Pro")
        self.assertEqual(parsed_vi["rom"], "256GB")
        self.assertEqual(parsed_vi["battery_percent"], 87)
        self.assertTrue(parsed_vi["unknown_part"])

        parsed_compact = parse_battery_screen_text(
            ["iPhone15Pro", "256GB", "Maximum Capacity 89%"],
            avg_confidence=0.98,
        )
        self.assertEqual(parsed_compact["model"], "iPhone 15 Pro")
        self.assertEqual(parsed_compact["rom"], "256GB")
        self.assertEqual(parsed_compact["battery_percent"], 89)
        self.assertFalse(parsed_compact["unknown_part"])

    def test_mobile_and_counter_diagnostics(self):
        # Clean machine with screen spots/ink -> Grade D (Loại 4)
        res_screen = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[],
            ocr={"battery_percent": 95, "unknown_part": False},
            hardware={
                "icloudClean": True,
                "powerOn": True,
                "wifi": "pass",
                "screenDisplay": "spots_lines_ink",
            },
        )
        self.assertEqual(res_screen["grade"], "D")
        self.assertEqual(res_screen["pricing"]["floor_applied"], 14500000)

        # Clean shell + wifi fail + trueTone no -> Grade B + 800,000đ extras deducted
        res_hw = evaluate_appraisal(
            brand="Apple",
            model="iPhone 15 Pro Max",
            storage="256GB",
            detections=[],
            ocr={"battery_percent": 95, "unknown_part": False},
            hardware={
                "icloudClean": True,
                "powerOn": True,
                "wifi": "fail",
                "trueTone": "no",
            },
        )
        self.assertEqual(res_hw["grade"], "B")
        self.assertEqual(res_hw["pricing"]["floor_applied"], 22000000)
        self.assertEqual(res_hw["pricing"]["extras_total"], 800000)
        self.assertEqual(res_hw["pricing"]["suggested_price"], 21200000)
