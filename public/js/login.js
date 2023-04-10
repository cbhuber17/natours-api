/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// ----------------------------------------------------------------

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // Redirect user to home page when successfully logged in
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// ----------------------------------------------------------------

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true); // true forces server reload, not a page cache reload
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};