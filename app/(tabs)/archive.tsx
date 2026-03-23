import {
  DEFAULT_FILTERS,
  FilterModal,
  Filters,
  SizeFilter,
  StatusFilter,
} from '@/components/FilterModal'
import { PuzzleCard } from '@/components/PuzzleCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { PuzzleState } from '@/types/PuzzleState.t'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

function getSizeCategory(rows: number, cols: number): SizeFilter {
  if (cols <= 13 && rows <= 13) return 'small'
  if (cols > 15 || rows > 15) return 'large'
  return 'medium'
}

function getCompletionStatus(state: PuzzleState): StatusFilter {
  if (state.complete) return 'complete'
  if (state.userAnswers.some((a) => a !== '')) return 'in-progress'
  return 'to-do'
}

function matchesFilters(
  state: PuzzleState,
  filters: Filters,
  query: string
): boolean {
  const { puzzle } = state
  const title = puzzle.meta?.title
  const author = puzzle.meta?.author
  const date = puzzle.meta?.date

  if (query.trim()) {
    const q = query.toLowerCase()
    const inTitle = title?.toLowerCase().includes(q) ?? false
    const inAuthor = author?.toLowerCase().includes(q) ?? false
    if (!inTitle && !inAuthor) return false
  }

  if (filters.sizes.length > 0) {
    const rows = puzzle.tiles.length
    const cols = puzzle.tiles[0]?.length ?? 0
    const size = getSizeCategory(rows, cols)
    if (!filters.sizes.includes(size)) return false
  }

  if (filters.statuses.length > 0) {
    const status = getCompletionStatus(state)
    if (!filters.statuses.includes(status)) return false
  }

  if (filters.dateFrom && date) {
    if (date < filters.dateFrom) return false
  }

  if (filters.dateTo && date) {
    if (date > filters.dateTo) return false
  }

  return true
}

export default function ArchiveScreen() {
  const { state, setActivePuzzle } = usePuzzle()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterVisible, setFilterVisible] = useState(false)

  const activeFilterCount =
    filters.sizes.length +
    filters.statuses.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0)

  const entries = useMemo(() => {
    return Object.entries(state.puzzles).filter(([, puzzleState]) =>
      matchesFilters(puzzleState, filters, query)
    )
  }, [state.puzzles, filters, query])

  function handleCardPress(id: string) {
    setActivePuzzle(id)
    router.push('/(tabs)/grid')
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilterCount > 0 && styles.filterBtnActive,
          ]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#fff' : '#374151'}
          />
          {activeFilterCount > 0 && (
            <Text style={styles.filterCount}>{activeFilterCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={([id]) => id}
        contentContainerStyle={styles.list}
        renderItem={({ item: [id, puzzleState] }) => (
          <PuzzleCard id={id} state={puzzleState} onPress={handleCardPress} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="archive-outline" size={40} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {Object.keys(state.puzzles).length === 0
                ? 'No puzzles yet.\nImport a .puz file to get started.'
                : 'No puzzles match your search.'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      <FilterModal
        visible={filterVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ef',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0a0a0a',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  filterBtnActive: {
    backgroundColor: '#0a0a0a',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
})
