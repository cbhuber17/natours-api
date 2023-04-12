/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51MvkFRFs5RhKxgWtysVk4GGjoK3WqGLLu8gXoyX1IXx1ChCkhiWNrVq2EU0m0jtkwmcgQFomR3BY1f97ZQFvHLiH00GvhX9k6E'
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
