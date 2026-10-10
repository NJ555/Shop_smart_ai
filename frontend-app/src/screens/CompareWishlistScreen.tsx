import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { wishlistApi } from '../api/cart';
import { Product } from '../api/catalog';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';

export const CompareWishlistScreen: React.FC<{
  onSelectProduct: (product: Product) => void;
}> = ({ onSelectProduct }) => {
  const [tab, setTab] = useState<'compare' | 'wishlist'>('compare');
  const { compareList, removeFromCompare, clearCompare, addToCart, toggleWishlist, wishlistIds } =
    useCart();
  const [wishlistItems, setWishlistItems] = useState<(Product & { addedAt: string })[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState<boolean>(false);

  useEffect(() => {
    if (tab === 'wishlist') {
      loadWishlist();
    }
  }, [tab, wishlistIds]);

  const loadWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const data = await wishlistApi.getWishlist();
      setWishlistItems(data.items || []);
    } catch {
      // Ignore
    } finally {
      setLoadingWishlist(false);
    }
  };

  // Collect all unique attribute keys across compareList
  const allAttrKeys = Array.from(
    new Set(
      compareList.flatMap((p) =>
        p.attributeList
          ? p.attributeList.map((a) => a.attribute_key)
          : Object.keys(p.attributes || {})
      )
    )
  );

  return (
    <View style={styles.container}>
      {/* Top Segmented Tab */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'compare' && styles.activeSegmentBtn]}
            onPress={() => setTab('compare')}
          >
            <Text style={[styles.segmentText, tab === 'compare' && styles.activeSegmentText]}>
              ⚖️ Product Compare ({compareList.length}/4)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'wishlist' && styles.activeSegmentBtn]}
            onPress={() => setTab('wishlist')}
          >
            <Text style={[styles.segmentText, tab === 'wishlist' && styles.activeSegmentText]}>
              ❤️ Saved Wishlist ({wishlistIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: COMPARE MATRIX */}
      {tab === 'compare' && (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {compareList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⚖️</Text>
              <Text style={styles.emptyTitle}>Compare is Empty</Text>
              <Text style={styles.emptySub}>
                Tap the ⚖️ icon on any product in the store to compare up to 4 items side-by-side.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.compareActions}>
                <Text style={styles.matrixHeading}>Side-by-Side Comparison Matrix</Text>
                <TouchableOpacity onPress={clearCompare} style={styles.clearPill}>
                  <Text style={styles.clearPillText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {/* Horizontal scroll comparison table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                <View style={styles.matrixTable}>
                  {/* Row 1: Product Header Cards */}
                  <View style={styles.matrixRow}>
                    <View style={styles.specHeaderCell}>
                      <Text style={styles.headerLabel}>Product</Text>
                    </View>
                    {compareList.map((prod) => (
                      <View key={prod.productId} style={styles.colCard}>
                        <TouchableOpacity
                          style={styles.removeColBtn}
                          onPress={() => removeFromCompare(prod.productId)}
                        >
                          <Text style={styles.removeColText}>✕</Text>
                        </TouchableOpacity>

                        <Image
                          source={{ uri: prod.thumbnail || prod.images?.[0] || 'https://picsum.photos/200' }}
                          style={styles.colImage}
                        />
                        <Text style={styles.colBrand}>{prod.brand}</Text>
                        <Text style={styles.colName} numberOfLines={2}>
                          {prod.name}
                        </Text>
                        <Text style={styles.colPrice}>${prod.price?.toFixed(2)}</Text>
                        <Text style={styles.colRating}>⭐ {prod.rating?.toFixed(1)}</Text>

                        <TouchableOpacity
                          style={styles.colAddBtn}
                          onPress={() => addToCart(prod.productId, 1)}
                        >
                          <Text style={styles.colAddBtnText}>+ Cart</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Row 2: Availability */}
                  <View style={styles.matrixRow}>
                    <View style={styles.specHeaderCell}>
                      <Text style={styles.specTitleText}>Availability</Text>
                    </View>
                    {compareList.map((prod) => (
                      <View key={prod.productId} style={styles.matrixCell}>
                        <Text
                          style={[
                            styles.stockText,
                            prod.availability === 'IN_STOCK' ? styles.stockGreen : styles.stockAmber,
                          ]}
                        >
                          {prod.availability === 'IN_STOCK' ? `In Stock (${prod.inventory})` : 'Low Stock'}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Attribute Specs Rows */}
                  {allAttrKeys.map((key) => (
                    <View key={key} style={styles.matrixRow}>
                      <View style={styles.specHeaderCell}>
                        <Text style={styles.specTitleText}>
                          {key.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      {compareList.map((prod) => {
                        const val =
                          prod.attributeList?.find((a) => a.attribute_key === key)?.attribute_value ||
                          prod.attributes?.[key] ||
                          '—';
                        return (
                          <View key={prod.productId} style={styles.matrixCell}>
                            <Text style={styles.cellValue}>{val}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* TAB 2: WISHLIST */}
      {tab === 'wishlist' && (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {wishlistItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
              <Text style={styles.emptySub}>
                Save products with the heart icon to easily track and purchase them later.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={styles.matrixHeading}>Your Saved Products ({wishlistItems.length})</Text>

              {wishlistItems.map((item) => (
                <NeomorphCard key={item.productId} variant="raised" style={styles.wishlistCard} padding={12}>
                  <View style={styles.wishlistRow}>
                    <Image
                      source={{ uri: item.thumbnail || item.images?.[0] || 'https://picsum.photos/200' }}
                      style={styles.wishlistImg}
                    />
                    <View style={styles.wishlistDetails}>
                      <Text style={styles.colBrand}>{item.brand}</Text>
                      <Text style={styles.wishlistTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.wishlistPriceRow}>
                        <Text style={styles.wishlistPrice}>${item.price?.toFixed(2)}</Text>
                        <Text style={styles.colRating}>⭐ {item.rating?.toFixed(1)}</Text>
                      </View>
                    </View>

                    <View style={styles.wishlistActions}>
                      <TouchableOpacity
                        style={styles.moveCartBtn}
                        onPress={() => addToCart(item.productId, 1)}
                      >
                        <Text style={styles.moveCartBtnText}>+ Cart</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeWishlistBtn}
                        onPress={() => toggleWishlist(item.productId)}
                      >
                        <Text style={styles.removeWishlistText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </NeomorphCard>
              ))}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(215, 190, 195, 0.4)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeSegmentBtn: {
    backgroundColor: colors.surface,
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeSegmentText: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  emptyBox: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
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
    marginTop: 6,
    lineHeight: 18,
  },
  compareActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  matrixHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  clearPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FFE4E8',
  },
  clearPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tableScroll: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.1)',
  },
  matrixTable: {
    flexDirection: 'column',
  },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  specHeaderCell: {
    width: 110,
    padding: 10,
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  specTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  colCard: {
    width: 150,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FAF5F7',
    borderRadius: 14,
    marginHorizontal: 4,
  },
  removeColBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeColText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  colImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0E8EA',
  },
  colBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  colName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 2,
    minHeight: 32,
  },
  colPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: 4,
  },
  colRating: {
    fontSize: 11,
    color: colors.textMuted,
  },
  colAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  colAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  matrixCell: {
    width: 150,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockGreen: {
    color: '#059669',
  },
  stockAmber: {
    color: '#D97706',
  },
  cellValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  wishlistCard: {
    marginVertical: 6,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistImg: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#F0E8EA',
  },
  wishlistDetails: {
    flex: 1,
    marginLeft: 12,
  },
  wishlistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  wishlistPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  wishlistPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  wishlistActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  moveCartBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  moveCartBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeWishlistBtn: {
    padding: 4,
  },
  removeWishlistText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
