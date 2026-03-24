import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export type SizeFilter = 'small' | 'medium' | 'large'
export type StatusFilter = 'to-do' | 'in-progress' | 'complete'

export interface Filters {
  sizes: SizeFilter[]
  statuses: StatusFilter[]
  dateFrom: string | null
  dateTo: string | null
}

export const DEFAULT_FILTERS: Filters = {
  sizes: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
}

const SIZE_OPTIONS: {
  value: SizeFilter
  label: string
  description: string
}[] = [
  { value: 'small', label: 'Small', description: '≤13×13' },
  { value: 'medium', label: 'Medium', description: '15×15' },
  { value: 'large', label: 'Large', description: '>15×15' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] =
  [
    { value: 'to-do', label: 'To Do', color: '#9ca3af' },
    { value: 'in-progress', label: 'In Progress', color: '#2563eb' },
    { value: 'complete', label: 'Complete', color: '#16a34a' },
  ]

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

interface FilterModalProps {
  visible: boolean
  filters: Filters
  onChange: (filters: Filters) => void
  onClose: () => void
}

export function FilterModal({
  visible,
  filters,
  onChange,
  onClose,
}: FilterModalProps) {
  const activeCount =
    filters.sizes.length +
    filters.statuses.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.heading}>Filter</Text>
          {activeCount > 0 && (
            <TouchableOpacity onPress={() => onChange(DEFAULT_FILTERS)}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Size */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Size</Text>
            <View style={styles.pills}>
              {SIZE_OPTIONS.map(({ value, label, description }) => {
                const active = filters.sizes.includes(value)
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() =>
                      onChange({
                        ...filters,
                        sizes: toggle(filters.sizes, value),
                      })
                    }
                  >
                    <Text
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[styles.pillSub, active && styles.pillSubActive]}
                    >
                      {description}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.pills}>
              {STATUS_OPTIONS.map(({ value, label, color }) => {
                const active = filters.statuses.includes(value)
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() =>
                      onChange({
                        ...filters,
                        statuses: toggle(filters.statuses, value),
                      })
                    }
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: color }]}
                    />
                    <Text
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
          <Text style={styles.applyText}>Show results</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    gap: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a0a0a',
    flex: 1,
  },
  clearText: {
    fontSize: 14,
    color: '#e87756',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    gap: 24,
    paddingBottom: 16,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  pillActive: {
    borderColor: '#0a0a0a',
    backgroundColor: '#0a0a0a',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pillTextActive: {
    color: '#fff',
  },
  pillSub: {
    fontSize: 11,
    color: '#9ca3af',
  },
  pillSubActive: {
    color: '#9ca3af',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  applyBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
