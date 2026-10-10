import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { Product } from '../api/catalog';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onOpenAssistantWithProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  visible,
  onClose,
  onOpenAssistantWithProduct,
}) => {
  const { addToCart, wishlistIds, toggleWishlist, isInCompare, addToCompare, removeFromCompare } =
    useCart();
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  if (!product) return null;

  const isWishlisted = wishlistIds.has(product.productId);
  const inCompare = isInCompare(product.productId);

  const images = product.images?.length
    ? product.images
    : [product.thumbnail || 'https://picsum.photos/600/400'];

  const handleAddToCart = async () => {
    await addToCart(product.productId, qty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>{product.brand}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.categoryName || product.category}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Gallery */}
            <View style={styles.galleryContainer}>
              <Image
                source={{ uri: images[selectedImage] || images[0] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {images.length > 1 && (
                <View style={styles.thumbnailsRow}>
                  {images.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedImage(idx)}
                      style={[
                        styles.thumbBox,
                        selectedImage === idx && styles.activeThumb,
                      ]}
                    >
                      <Image source={{ uri: img }} style={styles.thumbImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Title & Price */}
            <View style={styles.infoSection}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>${product.price?.toFixed(2)}</Text>
                <View style={styles.ratingBox}>
                  <Text style={styles.starText}>⭐ {product.rating?.toFixed(1) || '4.0'}</Text>
                  <Text style={styles.ratingCount}> (Verified Reviews)</Text>
                </View>
              </View>

              <View style={styles.stockNotice}>
                <Text style={styles.stockText}>
                  {product.availability === 'IN_STOCK'
                    ? `🟢 In Stock (${product.inventory} units available)`
                    : product.availability === 'LOW_STOCK'
                    ? `🟡 Low Stock (Only ${product.inventory} left!)`
                    : '🔴 Out of Stock'}
                </Text>
              </View>

              <Text style={styles.descText}>{product.description}</Text>
            </View>

            {/* Attributes & Specifications Table */}
            <NeomorphCard variant="raisedSoft" style={styles.specsCard} padding={16}>
              <Text style={styles.specsTitle}>Technical Specifications</Text>
              <View style={styles.specsList}>
                {product.attributeList && product.attributeList.length > 0 ? (
                  product.attributeList.map((attr, i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specKey}>
                        {attr.attribute_key.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.specVal}>{attr.attribute_value}</Text>
                    </View>
                  ))
                ) : (
                  Object.entries(product.attributes || {}).map(([k, v], i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specKey}>{k.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.specVal}>{String(v)}</Text>
                    </View>
                  ))
                )}
              </View>
            </NeomorphCard>

            {/* Quick Actions Row: Wishlist & Compare */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.utilityBtn, isWishlisted && styles.utilityActive]}
                onPress={() => toggleWishlist(product.productId)}
              >
                <Text style={styles.utilityIcon}>{isWishlisted ? '❤️' : '🤍'}</Text>
                <Text style={styles.utilityLabel}>
                  {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.utilityBtn, inCompare && styles.utilityActive]}
                onPress={() => {
                  if (inCompare) removeFromCompare(product.productId);
                  else addToCompare(product);
                }}
              >
                <Text style={styles.utilityIcon}>⚖️</Text>
                <Text style={styles.utilityLabel}>
                  {inCompare ? 'In Compare (Remove)' : 'Add to Compare'}
                </Text>
              </TouchableOpacity>
            </View>

            {onOpenAssistantWithProduct && (
              <TouchableOpacity
                style={styles.aiAskBanner}
                onPress={() => {
                  onClose();
                  onOpenAssistantWithProduct(product);
                }}
              >
                <Text style={styles.aiAskEmoji}>🤖</Text>
                <View style={styles.aiAskTextContainer}>
                  <Text style={styles.aiAskTitle}>Ask AI about this product</Text>
                  <Text style={styles.aiAskSubtitle}>
                    Check compatibility, return policy, or alternatives
                  </Text>
                </View>
                <Text style={styles.aiAskArrow}>→</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Bottom Bar: Qty + Add to Cart */}
          <View style={styles.bottomBar}>
            <View style={styles.qtyBox}>
              <TouchableOpacity
                onPress={() => setQty(Math.max(1, qty - 1))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty(Math.min(product.inventory || 10, qty + 1))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <NeomorphButton
                title={addedNotice ? '✓ Added to Cart!' : `Add to Cart • $${(product.price * qty).toFixed(2)}`}
                onPress={handleAddToCart}
                disabled={product.availability === 'OUT_OF_STOCK'}
                variant={addedNotice ? 'secondary' : 'primary'}
                size="md"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 21, 0.55)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      } as any,
    }),
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    ...Platform.select({
      web: {
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0 -12px 36px rgba(0,0,0,0.25)',
      } as any,
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(225, 29, 72, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  galleryContainer: {
    width: '100%',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    backgroundColor: '#F3E9EB',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  thumbBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumb: {
    borderColor: colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    marginTop: 16,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stockNotice: {
    marginTop: 8,
    backgroundColor: '#FAF5F7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  descText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  specsCard: {
    marginTop: 16,
  },
  specsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  specsList: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  specKey: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.12)',
  },
  utilityActive: {
    backgroundColor: '#FFE4E8',
    borderColor: colors.primary,
  },
  utilityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  utilityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiAskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  aiAskEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  aiAskTextContainer: {
    flex: 1,
  },
  aiAskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  aiAskSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  aiAskArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(225, 29, 72, 0.1)',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '800',
    marginHorizontal: 12,
    color: colors.textPrimary,
  },
});
