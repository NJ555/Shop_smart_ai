import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { ordersApi, OrderView, ShipmentTrackView } from '../api/orders';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';

export const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTrackView | null>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState<boolean>(false);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data.items || []);
    } catch (e: any) {
      console.warn('Orders load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackShipment = async (orderId: string) => {
    setTrackingLoading(true);
    setTrackingModalVisible(true);
    try {
      const shipment = await ordersApi.getShipment(orderId);
      setSelectedShipment(shipment);
    } catch (e: any) {
      console.warn('Tracking fetch error', e);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    setNotice(null);
    try {
      const res = await ordersApi.cancelOrder(orderId, 'CUSTOMER_REQUEST');
      setNotice(
        `Order ${res.orderNumber} Cancelled! Refund: ${res.refundStatus}${
          res.approvalId ? ' (Approval requested from Admin queue)' : ''
        }`
      );
      await loadOrders();
    } catch (e: any) {
      setNotice(`Failed to cancel: ${e.message}`);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { text: 'CONFIRMED', bg: '#D1FAE5', color: '#065F46' };
      case 'PROCESSING':
        return { text: 'PROCESSING', bg: '#DBEAFE', color: '#1E40AF' };
      case 'SHIPPED':
        return { text: 'SHIPPED', bg: '#FEF3C7', color: '#92400E' };
      case 'OUT_FOR_DELIVERY':
        return { text: 'OUT FOR DELIVERY', bg: '#FDE68A', color: '#78350F' };
      case 'DELIVERED':
        return { text: 'DELIVERED', bg: '#DCFCE7', color: '#166534' };
      case 'CANCELLED':
        return { text: 'CANCELLED', bg: '#FEE2E2', color: '#991B1B' };
      default:
        return { text: status, bg: '#F3E8FF', color: '#6B21A8' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Order History</Text>
          <Text style={styles.subtitle}>
            Simulated checkout orders, live tracking & auditable cancellations
          </Text>
        </View>

        {notice && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>ℹ️ {notice}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySub}>
              Browse items in Store or use Shopping AI to place your first simulated order!
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((o) => {
              const badge = getStatusBadge(o.status);
              const canCancel = ['CREATED', 'CONFIRMED', 'PROCESSING'].includes(o.status);

              return (
                <NeomorphCard key={o.orderId} variant="raised" style={styles.orderCard} padding={16}>
                  {/* Top order header */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderNumber}>{o.orderNumber}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(o.createdAt).toLocaleDateString()} at{' '}
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>

                  {/* Items snapshot */}
                  <View style={styles.itemsList}>
                    {o.items?.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {it.quantity}x {it.name}
                        </Text>
                        <Text style={styles.itemPrice}>${(it.unitPrice * it.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Total and Actions */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Total (Simulated Paid)</Text>
                      <Text style={styles.totalAmount}>${o.total?.toFixed(2)}</Text>
                    </View>

                    <View style={styles.footerActions}>
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => handleTrackShipment(o.orderId)}
                      >
                        <Text style={styles.trackBtnText}>🚚 Track Shipment</Text>
                      </TouchableOpacity>

                      {canCancel && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          disabled={cancellingOrderId === o.orderId}
                          onPress={() => handleCancelOrder(o.orderId)}
                        >
                          <Text style={styles.cancelBtnText}>
                            {cancellingOrderId === o.orderId ? 'Cancelling...' : 'Cancel'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </NeomorphCard>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TRACKING TIMELINE MODAL */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.trackingSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Shipment Tracking</Text>
                <Text style={styles.sheetSub}>
                  {selectedShipment?.carrier || 'ShopSmart Logistics'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTrackingModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {trackingLoading || !selectedShipment ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={{ padding: 20 }}>
                {/* Status Card */}
                <NeomorphCard variant="glow" padding={14} style={{ marginBottom: 16 }}>
                  <Text style={styles.trackNum}>Tracking #{selectedShipment.trackingNumber}</Text>
                  <Text style={styles.trackStatus}>
                    Current Status: <Text style={{ color: colors.primary }}>{selectedShipment.status}</Text>
                  </Text>
                  {selectedShipment.eta && (
                    <Text style={styles.trackEta}>
                      Estimated Delivery: {new Date(selectedShipment.eta).toDateString()}
                    </Text>
                  )}
                </NeomorphCard>

                {/* Timeline Events */}
                <Text style={styles.timelineHeader}>Shipment Event History:</Text>
                <View style={styles.timelineList}>
                  {selectedShipment.events?.map((ev, i) => (
                    <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.evStatus}>{ev.status}</Text>
                        <Text style={styles.evDesc}>{ev.description}</Text>
                        <Text style={styles.evTime}>
                          {new Date(ev.occurredAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  noticeBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFE4E8',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  emptyBox: {
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
  ordersList: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsList: {
    paddingVertical: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackBtn: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  trackBtnText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  cancelBtnText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 21, 0.55)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      } as any,
    }),
  },
  trackingSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 24,
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
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
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSub: {
    fontSize: 11,
    color: colors.textMuted,
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
    fontWeight: '700',
    color: colors.textSecondary,
  },
  trackNum: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  trackStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  trackEta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  timelineHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 10,
  },
  timelineList: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  evStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  evDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  evTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
