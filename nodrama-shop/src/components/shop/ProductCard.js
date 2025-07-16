import React from 'react';
import { Card, CardHeader, CardContent } from '@appletosolutions/reactbits';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <Card className="product-card">
      <CardHeader>
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
        />
      </CardHeader>
      <CardContent>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-pricing">
          <span className="price">${product.price}</span>
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice}</span>
          )}
        </div>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;