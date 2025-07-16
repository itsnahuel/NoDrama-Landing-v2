import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@appletosolutions/reactbits';

const SquarePayment = ({ amount, onPaymentSuccess, onPaymentError }) => {
  const [payments, setPayments] = useState(null);
  const [card, setCard] = useState(null);

  useEffect(() => {
    const initializeSquare = async () => {
      try {
        // Initialize Square Payments
        const squarePayments = window.Square.payments(
          process.env.REACT_APP_SQUARE_APPLICATION_ID,
          process.env.REACT_APP_SQUARE_LOCATION_ID
        );
        setPayments(squarePayments);

        // Initialize Card payment method
        const cardPaymentMethod = await squarePayments.card();
        await cardPaymentMethod.attach('#card-container');
        setCard(cardPaymentMethod);
      } catch (error) {
        console.error('Error initializing Square:', error);
        onPaymentError(error);
      }
    };

    if (window.Square) {
      initializeSquare();
    } else {
      // Load Square SDK if not already loaded
      const script = document.createElement('script');
      script.src = 'https://sandbox-js.squareup.com/v2/paymentform';
      script.onload = initializeSquare;
      document.head.appendChild(script);
    }
  }, [onPaymentError]);

  const handlePayment = async () => {
    if (!card) return;

    try {
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Send token to your backend to process payment
        const response = await fetch('/api/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: result.token,
            amount: amount,
          }),
        });

        if (response.ok) {
          onPaymentSuccess(result);
        } else {
          throw new Error('Payment processing failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error);
    }
  };

  return (
    <Card className="payment-form">
      <CardHeader>
        <h3>Payment Details</h3>
      </CardHeader>
      <CardContent>
        <div id="card-container"></div>
        <div className="payment-total">
          <p>Total: ${amount.toFixed(2)}</p>
        </div>
        <button 
          className="pay-button"
          onClick={handlePayment}
          disabled={!card}
        >
          Pay Now
        </button>
      </CardContent>
    </Card>
  );
};

export default SquarePayment;