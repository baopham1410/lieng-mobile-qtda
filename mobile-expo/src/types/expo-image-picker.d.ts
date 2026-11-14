declare module 'expo-image-picker' {
  export interface ImagePickerResult {
    canceled: boolean
    assets: Array<{
      uri: string
      width?: number
      height?: number
      type?: string
      fileName?: string
      fileSize?: number
      base64?: string
    }> | null
  }

  export interface ImagePickerOptions {
    mediaTypes?: any
    allowsEditing?: boolean
    aspect?: [number, number]
    quality?: number
    base64?: boolean
  }

  export function requestCameraPermissionsAsync(): Promise<{ status: string }>
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string }>
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>
}
