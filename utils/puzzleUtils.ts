import { parse } from '@xwordly/xword-parser'
import { Buffer } from 'buffer'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}

export async function pickPuzFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  })

  if (result.canceled) return null

  const file = result.assets[0]
  if (!file.name.toLowerCase().endsWith('.puz')) {
    throw new Error('Selected file is not a .puz file')
  }
  return file
}

export async function extractPuzzleData(uri: string, filename: string) {
  const file = new File(uri)
  const bytes = await file.bytes()
  const binaryBuffer = Buffer.from(bytes)

  return parse(binaryBuffer, { filename })
}
