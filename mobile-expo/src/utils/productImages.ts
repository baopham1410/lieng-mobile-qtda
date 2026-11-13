import type { ImageSourcePropType } from 'react-native'
import { API_BASE_URL } from '@/constants/config'

const LOCAL_IMAGES: Record<string, any> = {
  'iphone-15.jpg': require('../../assets/products/iphone-15.jpg'),
  'samsung-s24.jpg': require('../../assets/products/samsung-s24.jpg'),
  'ipad-air.jpg': require('../../assets/products/ipad-air.jpg'),
  'airpods-pro.jpg': require('../../assets/products/airpods-pro.jpg'),
  'macbook-air-m2.jpg': require('../../assets/products/macbook-air-m2.jpg'),
  'galaxy-watch6.jpg': require('../../assets/products/galaxy-watch6.jpg'),
  'xiaomi-14.jpg': require('../../assets/products/xiaomi-14.jpg'),
  'cable-usbc.jpg': require('../../assets/products/cable-usbc.jpg'),
  'cable-lightning.jpg': require('../../assets/products/cable-lightning.jpg'),
  'gan-charger.jpg': require('../../assets/products/gan-charger.jpg'),
  'phone-case.jpg': require('../../assets/products/phone-case.jpg'),
  'oppo-reno11.jpg': require('../../assets/products/oppo-reno11.jpg'),
  'jbl-tune.jpg': require('../../assets/products/jbl-tune.jpg'),
  'lg-oled-48.jpg': require('../../assets/products/lg-oled-48.jpg'),
  'samsung-tv-55.jpg': require('../../assets/products/samsung-tv-55.jpg'),
  'panasonic-fridge-190l.jpg': require('../../assets/products/panasonic-fridge-190l.jpg'),
  'samsung-fridge-256l.jpg': require('../../assets/products/samsung-fridge-256l.jpg'),
  'senko-fan.jpg': require('../../assets/products/senko-fan.jpg'),
  'mitsubishi-fan.jpg': require('../../assets/products/mitsubishi-fan.jpg'),
}

export function getProductImageSource(
  imagePath?: string | null,
  productName?: string | null,
  categoryName?: string | null,
): ImageSourcePropType {
  // 1. Nếu có path dạng /products/iphone-15.jpg hoặc iphone-15.jpg
  if (imagePath) {
    const filename = imagePath.split('/').pop() || ''
    if (LOCAL_IMAGES[filename]) {
      return LOCAL_IMAGES[filename]
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return { uri: imagePath }
    }
    if (imagePath.startsWith('/')) {
      const serverBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
      return { uri: `${serverBase}${imagePath}` }
    }
  }

  // 2. Tự động nhận diện theo tên sản phẩm / danh mục
  const name = (productName || '').toLowerCase()
  const cat = (categoryName || '').toLowerCase()

  if (name.includes('lightning')) {
    return LOCAL_IMAGES['cable-lightning.jpg']
  }
  if (name.includes('cáp') || name.includes('cable') || name.includes('type-c') || name.includes('usb-c')) {
    return LOCAL_IMAGES['cable-usbc.jpg']
  }
  if (name.includes('củ sạc') || name.includes('gan') || name.includes('sạc nhanh') || name.includes('charger')) {
    return LOCAL_IMAGES['gan-charger.jpg']
  }
  if (name.includes('ốp') || name.includes('case') || name.includes('bảo vệ')) {
    return LOCAL_IMAGES['phone-case.jpg']
  }
  if (name.includes('airpod') || name.includes('tai nghe') || name.includes('earbuds')) {
    return LOCAL_IMAGES['airpods-pro.jpg']
  }
  if (name.includes('jbl')) {
    return LOCAL_IMAGES['jbl-tune.jpg']
  }
  if (name.includes('watch') || name.includes('đồng hồ')) {
    return LOCAL_IMAGES['galaxy-watch6.jpg']
  }
  if (name.includes('macbook') || name.includes('laptop') || cat.includes('laptop')) {
    return LOCAL_IMAGES['macbook-air-m2.jpg']
  }
  if (name.includes('ipad') || name.includes('tablet') || cat.includes('tablet')) {
    return LOCAL_IMAGES['ipad-air.jpg']
  }
  if (name.includes('s24') || name.includes('samsung') || name.includes('galaxy') || cat.includes('samsung')) {
    return LOCAL_IMAGES['samsung-s24.jpg']
  }
  if (name.includes('xiaomi') || name.includes('redmi')) {
    return LOCAL_IMAGES['xiaomi-14.jpg']
  }
  if (name.includes('oppo') || name.includes('reno')) {
    return LOCAL_IMAGES['oppo-reno11.jpg']
  }
  if (name.includes('tivi') || name.includes('tv') || cat.includes('tivi')) {
    return LOCAL_IMAGES['samsung-tv-55.jpg']
  }
  if (name.includes('tủ lạnh') || cat.includes('tủ lạnh')) {
    return LOCAL_IMAGES['samsung-fridge-256l.jpg']
  }
  if (name.includes('quạt') || cat.includes('quạt')) {
    return LOCAL_IMAGES['senko-fan.jpg']
  }
  if (name.includes('iphone') || cat.includes('iphone') || cat.includes('phone') || cat.includes('điện thoại')) {
    return LOCAL_IMAGES['iphone-15.jpg']
  }

  // Mặc định iPhone
  return LOCAL_IMAGES['iphone-15.jpg']
}

