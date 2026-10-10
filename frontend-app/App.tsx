import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { colors } from './src/theme/colors';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { GradientHeader } from './src/components/GradientHeader';
import { BottomTabBar, TabKey } from './src/components/BottomTabBar';
import { PersonaModal } from './src/components/PersonaModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssistantScreen } from './src/screens/AssistantScreen';
import { CompareWishlistScreen } from './src/screens/CompareWishlistScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { OpsAdminScreen } from './src/screens/OpsAdminScreen';
import { ProductDetailModal } from './src/screens/ProductDetailModal';
import { CartCheckoutModal } from './src/screens/CartCheckoutModal';
import { Product } from './src/api/catalog';
import { CheckoutResult } from './src/api/orders';

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('store');

  // Modals state
  const [personaModalVisible, setPersonaModalVisible] = useState<boolean>(false);
  const [cartModalVisible, setCartModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Assistant cross-launch state
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [assistantMode, setAssistantMode] = useState<'shopping' | 'knowledge' | 'ops'>('shopping');

  const handleLaunchAssistantPrompt = (
    prompt: string,
    mode: 'shopping' | 'knowledge' | 'ops'
  ) => {
    setAssistantPrompt(prompt);
    setAssistantMode(mode);
    setActiveTab('assistant');
  };

  const handleOpenAssistantWithProduct = (prod: Product) => {
    setAssistantPrompt(`Tell me more about ${prod.name} (${prod.brand}). Is it good for my needs?`);
    setAssistantMode('shopping');
    setActiveTab('assistant');
  };

  const handleOrderPlaced = (res: CheckoutResult) => {
    // When order is placed, user can switch to orders tab to see live tracking
    setActiveTab('orders');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.appContainer}>
        {/* Header Bar with quick Persona & Cart indicators */}
        <GradientHeader
          onOpenPersonaModal={() => setPersonaModalVisible(true)}
          onOpenCart={() => setCartModalVisible(true)}
          onOpenCompare={() => setActiveTab('compare')}
        />

        {/* Tab View Container */}
        <View style={styles.screenContainer}>
          {activeTab === 'store' && (
            <HomeScreen
              onSelectProduct={(p) => setSelectedProduct(p)}
              onLaunchAssistantPrompt={handleLaunchAssistantPrompt}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantScreen
              key={`${assistantPrompt}-${assistantMode}`}
              initialPrompt={assistantPrompt}
              initialMode={assistantMode}
            />
          )}

          {activeTab === 'compare' && (
            <CompareWishlistScreen
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {activeTab === 'orders' && <OrdersScreen />}

          {activeTab === 'ops' && <OpsAdminScreen />}
        </View>

        {/* Floating Neomorphic Bottom Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'assistant') {
              setAssistantPrompt('');
            }
          }}
        />

        {/* Modals */}
        <PersonaModal
          visible={personaModalVisible}
          onClose={() => setPersonaModalVisible(false)}
        />

        <CartCheckoutModal
          visible={cartModalVisible}
          onClose={() => setCartModalVisible(false)}
          onOrderPlaced={handleOrderPlaced}
        />

        <ProductDetailModal
          product={selectedProduct}
          visible={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenAssistantWithProduct={handleOpenAssistantWithProduct}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        maxWidth: 768,
        width: '100%',
        alignSelf: 'center',
        minHeight: '100vh',
        boxShadow: '0 0 40px rgba(225, 29, 72, 0.08)',
      } as any,
    }),
  },
  screenContainer: {
    flex: 1,
  },
});
