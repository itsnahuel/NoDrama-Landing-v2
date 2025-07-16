import React, { useState } from 'react';
import ProductCard from '../../components/shop/ProductCard';
import Cart from '../../components/shop/Cart';
import SquarePayment from '../../components/shop/SquarePayment';
import { Grid, Container } from '@appletosolutions/reactbits';

const ShopPage = () => {
  const [products] = useState([
    {
      id: 1,
      name: 'NoDrama Records T-Shirt',
      description: 'Premium quality t-shirt with NoDrama Records logo',
      price: 29.99,
      image: '/images/tshirt.jpg',
      category: 'apparel'
    },
    {
      id: 2,
      name: 'Limited Edition Vinyl',
      description: 'Exclusive vinyl record from our latest release',
      price: 49.99,
      originalPrice: 59.99,
      image: '/images/vinyl.jpg',
      category: 'music'
    },
    {
      id: 3,
      name: 'NoDrama Hoodie',
      description: 'Comfortable hoodie perfect for any weather',
      price: 59.99,
      image: '/images/hoodie.jpg',
      category: 'apparel'
    },
    {
      id: 4,
      name: 'Digital Album',
      description: 'High-quality digital download of our latest album',
      price: 9.99,
      image: '/images/album.jpg',
      category: 'music'
    }
  ]);

  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    // Clear cart and show success message
    setCartItems([]);
    setShowCheckout(false);
    setShowCart(false);
    alert('Payment successful! Thank you for your purchase.');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Container className="shop-page">
      <div className="shop-header">
        <h1>NoDrama Records Shop</h1>
        <button 
          className="cart-toggle"
          onClick={() => setShowCart(!showCart)}
        >
          Cart ({totalItems})
        </button>
      </div>

      {showCheckout ? (
        <div className="checkout-section">
          <h2>Checkout</h2>
          <SquarePayment
            amount={totalAmount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
          <button onClick={() => setShowCheckout(false)}>
            Back to Cart
          </button>
        </div>
      ) : (
        <>
          {showCart && (
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
            />
          )}

          <div className="products-section">
            <h2>Products</h2>
            <Grid cols={2} gap={4} className="products-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </Grid>
          </div>
        </>
      )}
    </Container>
  );
};

export default ShopPage;