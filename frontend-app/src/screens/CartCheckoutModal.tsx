import React, { useState } from 'react';
import {
  Modal,
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
import { useAuth } from '../context/AuthContext';
import { ordersApi, CheckoutResult, ShippingAddress } from '../api/orders';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';
import { NeomorphInput } from '../components/NeomorphInput';

interface CartCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderPlaced: (result: CheckoutResult) => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  visible,
  onClose,
  onOrderPlaced,
}) => {
  const { cart, updateQuantity, removeItem, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null);

  // Default address
  const [address, setAddress] = useState<ShippingAddress>({
    line1: '12 Main St, Suite 400',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
  });

  const subtotal = cart?.subtotal || 0;
  // Shipping calculation logic matching backend
  const isPrimeOrPremium = user?.membershipTier === 'PRIME' || user?.membershipTier === 'PREMIUM';
  const shippingFee = isPrimeOrPremium
    ? subtotal >= 35 ? 0 : 4.99
    : subtotal >= 50 ? 0 : 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shippingFee + tax).toFixed(2);

  const handleCheckout = async () => {
    if (!cart?.cartId) return;
    setLoading(true);
    setError(null);

    // Generate unique idempotency key
    const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await ordersApi.createOrder(cart.cartId, address, idempotencyKey);
      setOrderResult(res);
      setStep('success');
      await refreshCart();
      onOrderPlaced(res);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('cart');
    setError(null);
    setOrderResult(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetModal}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>
                {step === 'cart'
                  ? `Shopping Cart (${cart?.count || 0})`
                  : step === 'checkout'
                  ? 'Simulated Checkout'
                  : 'Order Confirmed!'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'cart'
                  ? 'Review items, stock & membership perks'
                  : step === 'checkout'
                  ? 'Idempotent checkout • Simulated payment'
                  : 'Order successfully created & inventory reserved'}
              </Text>
            </View>
            <TouchableOpacity onPress={resetModal} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* STEP 1: CART ITEMS */}
          {step === 'cart' && (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {!cart || cart.items.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🛒</Text>
                  <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                  <Text style={styles.emptySub}>
                    Browse our catalog or ask our Shopping Assistant for tailored recommendations.
                  </Text>
                </View>
              ) : (
                <View style={styles.cartContent}>
                  {/* Items list */}
                  {cart.items.map((item) => (
                    <NeomorphCard key={item.itemId} variant="raisedSoft" style={styles.itemCard} padding={12}>
                      <View style={styles.itemRow}>
                        <Image
                          source={{
                            uri:
                              item.product.thumbnail ||
                              item.product.images?.[0] ||
                              'https://picsum.photos/200',
                          }}
                          style={styles.itemImage}
                        />

                        <View style={styles.itemInfo}>
                          <Text style={styles.itemBrand}>{item.product.brand}</Text>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.product.name}
                          </Text>
                          <Text style={styles.itemPrice}>
                            ${item.product.price?.toFixed(2)} each
                          </Text>

                          {/* Warnings */}
                          {item.warnings?.map((w, idx) => (
                            <Text key={idx} style={styles.warningText}>
                              ⚠️ {w}
                            </Text>
                          ))}
                        </View>

                        {/* Qty & Remove */}
                        <View style={styles.itemControls}>
                          <Text style={styles.lineTotal}>${item.lineTotal.toFixed(2)}</Text>
                          <View style={styles.qtyRow}>
                            <TouchableOpacity
                              onPress={() => {
                                if (item.quantity <= 1) removeItem(item.itemId);
                                else updateQuantity(item.itemId, item.quantity - 1);
                              }}
                              style={styles.qtyBtn}
                            >
                              <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{item.quantity}</Text>
                            <TouchableOpacity
                              onPress={() => updateQuantity(item.itemId, item.quantity + 1)}
                              style={styles.qtyBtn}
                            >
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </NeomorphCard>
                  ))}

                  {/* Summary Breakdown */}
                  <NeomorphCard variant="raised" style={styles.summaryCard} padding={16}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View>
                        <Text style={styles.summaryLabel}>Shipping Fee</Text>
                        <Text style={styles.perkHint}>
                          {isPrimeOrPremium
                            ? '⭐ Prime Discount Applied'
                            : '$50+ for free basic shipping'}
                        </Text>
                      </View>
                      <Text style={[styles.summaryValue, shippingFee === 0 && styles.freeShipping]}>
                        {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Simulated Tax (8%)</Text>
                      <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Estimated Total</Text>
                      <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>

                    <View style={{ marginTop: 14 }}>
                      <NeomorphButton
                        title="Proceed to Simulated Checkout →"
                        onPress={() => setStep('checkout')}
                        variant="primary"
                        size="md"
                      />
                    </View>
                  </NeomorphCard>
                </View>
              )}
              <View style={{ height: 60 }} />
            </ScrollView>
          )}

          {/* STEP 2: CHECKOUT */}
          {step === 'checkout' && (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.checkoutContent}>
                {/* Shipping address form */}
                <NeomorphCard variant="raisedSoft" style={styles.sectionCard} padding={16}>
                  <Text style={styles.sectionTitle}>📍 Shipping Address (Simulated)</Text>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <NeomorphInput
                      value={address.line1}
                      onChangeText={(t) => setAddress({ ...address, line1: t })}
                      placeholder="Street address (line 1)"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 2 }}>
                        <NeomorphInput
                          value={address.city}
                          onChangeText={(t) => setAddress({ ...address, city: t })}
                          placeholder="City"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <NeomorphInput
                          value={address.state}
                          onChangeText={(t) => setAddress({ ...address, state: t })}
                          placeholder="State"
                        />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <NeomorphInput
                          value={address.postalCode}
                          onChangeText={(t) => setAddress({ ...address, postalCode: t })}
                          placeholder="ZIP"
                        />
                      </View>
                    </View>
                  </View>
                </NeomorphCard>

                {/* Simulated Payment Mode */}
                <NeomorphCard variant="raisedSoft" style={styles.sectionCard} padding={16}>
                  <Text style={styles.sectionTitle}>💳 Payment Mode</Text>
                  <View style={styles.payBox}>
                    <Text style={styles.payEmoji}>🔒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payTitle}>PAID_SIMULATED (Hackathon Mode)</Text>
                      <Text style={styles.payDesc}>
                        Real money is never moved. Generates genuine order record with inventory reservation and carrier shipment simulator.
                      </Text>
                    </View>
                  </View>
                </NeomorphCard>

                {/* Order Summary Recap */}
                <NeomorphCard variant="glow" style={styles.sectionCard} padding={16}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <NeomorphButton
                      title={loading ? 'Processing Order...' : `Place Simulated Order ($${total.toFixed(2)})`}
                      onPress={handleCheckout}
                      loading={loading}
                      variant="primary"
                      size="lg"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => setStep('cart')}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backBtnText}>← Back to Cart</Text>
                  </TouchableOpacity>
                </NeomorphCard>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && orderResult && (
            <View style={styles.successContainer}>
              <View style={styles.successIconBubble}>
                <Text style={styles.successIcon}>🎉</Text>
              </View>
              <Text style={styles.successTitle}>Order Confirmed!</Text>
              <Text style={styles.orderNumberText}>{orderResult.orderNumber}</Text>
              <Text style={styles.successSub}>
                Status: {orderResult.status} • Total: ${orderResult.total?.toFixed(2)}
              </Text>
              <Text style={styles.successDetail}>
                Carrier tracking SIM-TRACK-{orderResult.orderNumber.replace('ORD-', '')} has been generated. Simulated shipment progression will advance through In-Transit to Delivered.
              </Text>

              <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
                <NeomorphButton
                  title="View Orders & Live Tracking"
                  onPress={resetModal}
                  variant="primary"
                  size="md"
                />
              </View>
            </View>
          )}
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
  scrollArea: {
    flex: 1,
  },
  cartContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 50,
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
  itemCard: {
    marginVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#F0E8EA',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  warningText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  itemControls: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
    color: colors.textPrimary,
  },
  summaryCard: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  freeShipping: {
    color: '#059669',
    fontWeight: '800',
  },
  perkHint: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  checkoutContent: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  payBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E8',
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  payEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  payTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  payDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  backBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  successContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  successSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  successDetail: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
