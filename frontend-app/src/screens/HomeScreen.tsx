import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { catalogApi, Product, Category } from '../api/catalog';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphInput } from '../components/NeomorphInput';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSelectProduct: (product: Product) => void;
  onLaunchAssistantPrompt: (prompt: string, mode: 'shopping' | 'knowledge' | 'ops') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectProduct,
  onLaunchAssistantPrompt,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sort, setSort] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, sort]);

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategories();
      setCategories(data);
    } catch (e) {
      console.warn('Categories load error', e);
    }
  };

  const loadProducts = async (query = searchQuery) => {
    setLoading(true);
    try {
      const res = await catalogApi.searchProducts({
        query: query.trim() || undefined,
        category: selectedCategory || undefined,
        sort,
        size: 30,
      });
      setProducts(res.items);
    } catch (e) {
      console.warn('Products search error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    loadProducts(searchQuery);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Neomorphic Gradient Card */}
      <View style={styles.heroWrapper}>
        <NeomorphCard variant="glow" style={styles.heroCard} padding={20}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⚡ AI-FIRST COMMERCE PLATFORM</Text>
            </View>
            <Text style={styles.membershipPill}>
              {user?.membershipTier || 'BASIC'} Tier
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Discover products with grounded AI intelligence
          </Text>
          <Text style={styles.heroSubtitle}>
            Natural language search, real catalog validation, verified policy RAG & safe agent ops.
          </Text>

          {/* Golden Journey Prompt Pills */}
          <Text style={styles.promptHeader}>Try AI Golden Journeys (1-Tap):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
            <TouchableOpacity
              style={styles.promptPill}
              onPress={() => onLaunchAssistantPrompt('Suggest laptop under $1000 for Java+AI', 'shopping')}
            >
              <Text style={styles.promptIcon}>🛍️</Text>
              <Text style={styles.promptText}>Laptop under $1000 for Java+AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.promptPill}
              onPress={() => onLaunchAssistantPrompt('Can I return opened laptop?', 'knowledge')}
            >
              <Text style={styles.promptIcon}>📚</Text>
              <Text style={styles.promptText}>Can I return opened laptop?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.promptPill}
              onPress={() => onLaunchAssistantPrompt('Where is ORD-1001? Can I cancel it?', 'ops')}
            >
              <Text style={styles.promptIcon}>⚡</Text>
              <Text style={styles.promptText}>Where is ORD-1001? Can I cancel?</Text>
            </TouchableOpacity>
          </ScrollView>
        </NeomorphCard>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <NeomorphInput
          value={searchQuery}
          onChangeText={(txt) => {
            setSearchQuery(txt);
            if (!txt) loadProducts('');
          }}
          placeholder="Search laptops, phones, appliances, specs..."
          onSubmitEditing={handleSearchSubmit}
          icon={<Text style={{ fontSize: 16 }}>🔍</Text>}
        />
      </View>

      {/* Category Pills Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory('')}
          style={[styles.categoryChip, !selectedCategory && styles.activeChip]}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.activeChipText]}>
            🔥 All Items
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          const icon =
            cat.slug === 'laptops'
              ? '💻'
              : cat.slug === 'smartphones'
              ? '📱'
              : cat.slug === 'appliances'
              ? '🍳'
              : '🎧';
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(isActive ? '' : cat.slug)}
              style={[styles.categoryChip, isActive && styles.activeChip]}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {icon} {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort & Count Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.countText}>
          {loading ? 'Searching...' : `${products.length} products found`}
        </Text>

        <View style={styles.sortPills}>
          {(['relevance', 'price_asc', 'price_desc', 'rating'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSort(s)}
              style={[styles.sortPill, sort === s && styles.activeSortPill]}
            >
              <Text style={[styles.sortPillText, sort === s && styles.activeSortText]}>
                {s === 'relevance'
                  ? 'Best'
                  : s === 'price_asc'
                  ? '$ Low'
                  : s === 'price_desc'
                  ? '$ High'
                  : '⭐ Rating'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products from backend...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyTitle}>No matching products</Text>
          <Text style={styles.emptySub}>
            Try clearing filters or ask our Shopping Assistant!
          </Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('');
              loadProducts('');
            }}
          >
            <Text style={styles.clearBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {products.map((item) => (
            <View key={item.productId} style={styles.gridItem}>
              <ProductCard product={item} onPress={onSelectProduct} />
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#FAF5F7',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #FCF8F9 0%, #FFF3F5 100%)',
      } as any,
    }),
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  membershipPill: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 10,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  promptHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  promptsScroll: {
    flexDirection: 'row',
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.18)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 6px rgba(225, 29, 72, 0.1)',
      } as any,
    }),
  },
  promptIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  promptText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.1)',
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #E11D48 0%, #FF4D6D 100%)',
        boxShadow: '2px 4px 10px rgba(225, 29, 72, 0.3)',
      } as any,
    }),
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sortPills: {
    flexDirection: 'row',
    gap: 4,
  },
  sortPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceSunken,
  },
  activeSortPill: {
    backgroundColor: '#FFE4E8',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeSortText: {
    color: colors.primary,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  gridItem: {
    width: Platform.OS === 'web' ? '50%' : '50%',
    minWidth: 170,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  clearBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
