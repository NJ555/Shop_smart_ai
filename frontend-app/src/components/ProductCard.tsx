import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { Product } from '../api/catalog';
import { NeomorphCard } from './NeomorphCard';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { addToCart, wishlistIds, toggleWishlist, isInCompare, addToCompare, removeFromCompare } =
    useCart();

  const isWishlisted = wishlistIds.has(product.productId);
  const inCompare = isInCompare(product.productId);

  const getStockBadge = () => {
    switch (product.availability) {
      case 'IN_STOCK':
        return { text: `In Stock (${product.inventory})`, bg: '#D1FAE5', color: '#065F46' };
      case 'LOW_STOCK':
        return { text: `Only ${product.inventory} left`, bg: '#FEF3C7', color: '#92400E' };
      case 'OUT_OF_STOCK':
      default:
        return { text: 'Out of Stock', bg: '#FEE2E2', color: '#991B1B' };
    }
  };

  const badge = getStockBadge();

  return (
    <NeomorphCard variant="raised" style={styles.card} padding={12}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(product)}
        style={styles.touchArea}
      >
        {/* Image & Quick Action Overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.thumbnail || product.images?.[0] || 'https://picsum.photos/400/300' }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Compare toggle button */}
          <TouchableOpacity
            style={[styles.floatingAction, styles.compareAction, inCompare && styles.activeCompare]}
            onPress={(e) => {
              e.stopPropagation();
              if (inCompare) removeFromCompare(product.productId);
              else addToCompare(product);
            }}
          >
            <Text style={styles.floatingActionIcon}>{inCompare ? '✓ ⚖️' : '⚖️'}</Text>
          </TouchableOpacity>

          {/* Wishlist toggle button */}
          <TouchableOpacity
            style={[styles.floatingAction, styles.wishlistAction]}
            onPress={(e) => {
              e.stopPropagation();
              toggleWishlist(product.productId);
            }}
          >
            <Text style={styles.floatingActionIcon}>{isWishlisted ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>

          {/* Stock badge */}
          <View style={[styles.stockBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.stockBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {/* Content details */}
        <View style={styles.details}>
          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '4.0'}</Text>
            <Text style={styles.categoryChip}>• {product.categoryName || product.category}</Text>
          </View>

          {/* Price and Add button */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.priceText}>${product.price?.toFixed(2)}</Text>
              <Text style={styles.shippingHint}>Free Prime delivery</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.addBtn,
                product.availability === 'OUT_OF_STOCK' && styles.disabledBtn,
              ]}
              disabled={product.availability === 'OUT_OF_STOCK'}
              onPress={(e) => {
                e.stopPropagation();
                addToCart(product.productId, 1);
              }}
            >
              <Text style={styles.addBtnText}>+ Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </NeomorphCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 6,
    flex: 1,
  },
  touchArea: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0E8EA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  floatingAction: {
    position: 'absolute',
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      } as any,
    }),
  },
  compareAction: {
    left: 8,
  },
  activeCompare: {
    backgroundColor: '#FFE4E8',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  wishlistAction: {
    right: 8,
  },
  floatingActionIcon: {
    fontSize: 14,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  details: {
    paddingTop: 10,
  },
  brandText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryChip: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  shippingHint: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #E11D48 0%, #FF4D6D 100%)',
        boxShadow: '2px 4px 10px rgba(225, 29, 72, 0.35)',
      } as any,
    }),
  },
  disabledBtn: {
    backgroundColor: '#CCCCCC',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
