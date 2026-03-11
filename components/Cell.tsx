import { COLOR, Fonts } from '@/constants/theme'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export interface CellProps {
  letter: string
  clueNumber: number | null
  isBlack: boolean
  isCircled: boolean
  isSelected: boolean
  isActiveWord: boolean
  isCorrect: boolean | null
  size: number
  edgeStyle: { borderTopWidth: number; borderLeftWidth: number }
  onPress: () => void
}

export const Cell = React.memo(
  function Cell({
    letter,
    clueNumber,
    isBlack,
    isCircled,
    isSelected,
    isActiveWord,
    isCorrect,
    size,
    edgeStyle,
    onPress,
  }: CellProps) {
    if (isBlack) {
      return (
        <View
          style={[
            styles.cell,
            styles.blackCell,
            edgeStyle,
            { width: size, height: size },
          ]}
        />
      )
    }

    const bg = isSelected
      ? COLOR.activeCellBg
      : isActiveWord
        ? COLOR.activeWordBg
        : isCorrect === true
          ? COLOR.correct
          : isCorrect === false
            ? COLOR.incorrect
            : COLOR.white

    const numSize = Math.max(6, size * 0.28)
    const letterSize = Math.max(14, size * 0.48)

    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.cell,
          edgeStyle,
          { width: size, height: size, backgroundColor: bg },
        ]}
      >
        {clueNumber !== null && (
          <Text
            style={[
              styles.clueNum,
              { fontSize: numSize, lineHeight: numSize + 1 },
            ]}
          >
            {clueNumber}
          </Text>
        )}
        <Text style={[styles.cellText, { fontSize: letterSize }]}>
          {letter}
        </Text>
        {isCircled && (
          <View
            style={[
              styles.circle,
              {
                width: size - 2,
                height: size - 2,
                borderRadius: (size - 2) / 2,
              },
            ]}
          />
        )}
      </Pressable>
    )
  },
  (prev, next) =>
    prev.letter === next.letter &&
    prev.isSelected === next.isSelected &&
    prev.isActiveWord === next.isActiveWord &&
    prev.isBlack === next.isBlack &&
    prev.isCorrect === next.isCorrect &&
    prev.size === next.size &&
    prev.clueNumber === next.clueNumber &&
    prev.isCircled === next.isCircled &&
    prev.edgeStyle.borderTopWidth === next.edgeStyle.borderTopWidth &&
    prev.edgeStyle.borderLeftWidth === next.edgeStyle.borderLeftWidth
)

const styles = StyleSheet.create({
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: COLOR.border,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  blackCell: { backgroundColor: COLOR.black, borderColor: COLOR.black },
  clueNum: {
    position: 'absolute',
    top: 1,
    left: 2,
    color: COLOR.clueNum,
    fontWeight: '500',
    includeFontPadding: false,
  },
  cellText: {
    fontWeight: '500',
    fontFamily: Fonts.sans,
    color: COLOR.letterText,
    includeFontPadding: false,
    textAlign: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLOR.circleStroke,
    backgroundColor: 'transparent',
    top: 1,
    left: 1,
  },
})
