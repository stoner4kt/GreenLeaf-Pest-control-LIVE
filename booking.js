(function () {
  const CONFIG = {
    supabaseUrl: 'https://letijupzommtpyhrboho.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldGlqdXB6b21tdHB5aHJib2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjQyMzMsImV4cCI6MjA5MTA0MDIzM30.JyXGK4D5n1KAiZz6WzCk6hIyQjWScX9x3bGeWBxP3Aw ',
    functionBase: '/functions/v1',
    daysToShow: 14,
    timeSlots: [
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00'
    ]
  };

  const state = {
    selectedDate: null,
    selectedTime: null,
    bookedTimesByDate: {},
    otpToken: null,
    otpVerified: false,
    otpVerifiedAt: null
  };

  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) return;

  const ui = {
    alert: document.getElementById('bookingAlert'),
    calendarDays: document.getElementById('calendarDays'),
    timeSlots: document.getElementById('timeSlots'),
    bookingDate: document.getElementById('booking_date'),
    bookingTime: document.getElementById('booking_time'),
    sendOtpButton: document.getElementById('sendOtpButton'),
    otpSection: document.getElementById('otpSection'),
    otpCode: document.getElementById('otpCode'),
    verifyOtpButton: document.getElementById('verifyOtpButton'),
    resendOtpButton: document.getElementById('resendOtpButton'),
    confirmBookingButton: document.getElementById('confirmBookingButton')
  };

  function showAlert(message, type) {
    ui.alert.textContent = message;
    ui.alert.className = `booking-alert ${type}`;
  }

  function clearAlert() {
    ui.alert.textContent = '';
    ui.alert.className = 'booking-alert';
  }

  function formatDateLabel(date) {
    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(date);
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function buildCalendarDays() {
    ui.calendarDays.innerHTML = '';

    for (let i = 0; i < CONFIG.daysToShow; i += 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + i);

      const key = toDateKey(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.dataset.date = key;
      button.textContent = formatDateLabel(date);
      button.setAttribute('role', 'listitem');

      button.addEventListener('click', () => {
        state.selectedDate = key;
        state.selectedTime = null;
        ui.bookingDate.value = key;
        ui.bookingTime.value = '';
        state.otpVerified = false;
        ui.confirmBookingButton.disabled = true;
        renderCalendarDaySelection();
        renderTimeSlots();
      });

      ui.calendarDays.appendChild(button);
    }

    const first = ui.calendarDays.querySelector('.calendar-day');
    if (first) {
      first.click();
    }
  }

  function renderCalendarDaySelection() {
    ui.calendarDays.querySelectorAll('.calendar-day').forEach((button) => {
      const active = button.dataset.date === state.selectedDate;
      button.classList.toggle('selected', active);
    });
  }

  function renderTimeSlots() {
    ui.timeSlots.innerHTML = '';
    const booked = new Set(state.bookedTimesByDate[state.selectedDate] || []);

    CONFIG.timeSlots.forEach((slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-slot';
      button.dataset.slot = slot;
      button.textContent = slot;

      if (booked.has(slot)) {
        button.classList.add('booked');
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        button.textContent = `${slot} (Booked)`;
      }

      button.addEventListener('click', () => {
        state.selectedTime = slot;
        ui.bookingTime.value = slot;
        state.otpVerified = false;
        ui.confirmBookingButton.disabled = true;
        renderTimeSlotSelection();
      });

      ui.timeSlots.appendChild(button);
    });

    renderTimeSlotSelection();
  }

  function renderTimeSlotSelection() {
    ui.timeSlots.querySelectorAll('.time-slot').forEach((button) => {
      const active = button.dataset.slot === state.selectedTime;
      button.classList.toggle('selected', active);
    });
  }

  function validateFormBasics() {
    if (!bookingForm.reportValidity()) {
      return false;
    }

    if (!state.selectedDate || !state.selectedTime) {
      showAlert('Please select both booking date and booking time.', 'error');
      return false;
    }

    return true;
  }

  function getPayload() {
    const data = new FormData(bookingForm);
    return {
      full_name: (data.get('name') || '').toString().trim(),
      email: (data.get('email') || '').toString().trim().toLowerCase(),
      phone_number: (data.get('phone') || '').toString().trim(),
      service_type: (data.get('service') || '').toString().trim(),
      booking_date: state.selectedDate,
      booking_time: state.selectedTime
    };
  }

  async function callEdgeFunction(name, body) {
    const endpoint = `${CONFIG.supabaseUrl}${CONFIG.functionBase}/${name}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${CONFIG.supabaseAnonKey}`
      },
      body: JSON.stringify(body)
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || `Request failed (${response.status})`);
    }

    return json;
  }

  async function loadAvailability() {
    try {
      const today = new Date();
      const end = new Date();
      end.setDate(end.getDate() + CONFIG.daysToShow - 1);

      const payload = {
        date_from: toDateKey(today),
        date_to: toDateKey(end)
      };

      const data = await callEdgeFunction('get-availability', payload);
      state.bookedTimesByDate = data.booked_times_by_date || {};
      renderTimeSlots();
    } catch (error) {
      showAlert(`Could not load live availability: ${error.message}`, 'error');
    }
  }

  async function sendOtp() {
    clearAlert();
    if (!validateFormBasics()) return;

    ui.sendOtpButton.disabled = true;
    try {
      const payload = getPayload();
      const result = await callEdgeFunction('send-otp', payload);
      state.otpToken = result.otp_token;
      state.otpVerified = false;
      state.otpVerifiedAt = null;
      ui.otpSection.hidden = false;
      showAlert('OTP sent. Please check your email and enter the 6-digit code.', 'success');
    } catch (error) {
      showAlert(`Could not send OTP: ${error.message}`, 'error');
    } finally {
      ui.sendOtpButton.disabled = false;
    }
  }

  async function verifyOtp() {
    clearAlert();
    const code = (ui.otpCode.value || '').trim();
    if (!state.otpToken) {
      showAlert('Please request an OTP first.', 'error');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showAlert('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    ui.verifyOtpButton.disabled = true;
    try {
      await callEdgeFunction('verify-otp', {
        otp_token: state.otpToken,
        otp_code: code
      });
      state.otpVerified = true;
      state.otpVerifiedAt = Date.now();
      ui.confirmBookingButton.disabled = false;
      showAlert('OTP verified. You can now confirm your booking.', 'success');
    } catch (error) {
      showAlert(`OTP verification failed: ${error.message}`, 'error');
    } finally {
      ui.verifyOtpButton.disabled = false;
    }
  }

  async function confirmBooking() {
    clearAlert();
    if (!validateFormBasics()) return;

    if (!state.otpVerified || !state.otpToken) {
      showAlert('Please verify OTP before confirming your booking.', 'error');
      return;
    }

    ui.confirmBookingButton.disabled = true;

    try {
      const bookingPayload = {
        ...getPayload(),
        otp_token: state.otpToken
      };

      const bookingResult = await callEdgeFunction('create-booking', bookingPayload);

      try {
        await callEdgeFunction('send-confirmation-email', {
          booking_id: bookingResult.booking.id,
          full_name: bookingResult.booking.full_name,
          email: bookingResult.booking.email,
          service_type: bookingResult.booking.service_type,
          booking_date: bookingResult.booking.booking_date,
          booking_time: bookingResult.booking.booking_time
        });
      } catch (emailError) {
        console.warn('Booking created but confirmation email failed.', emailError);
      }

      window.location.href = '/thank-you.html';
    } catch (error) {
      showAlert(`Booking failed: ${error.message}`, 'error');
      await loadAvailability();
      ui.confirmBookingButton.disabled = false;
    }
  }

  ui.sendOtpButton.addEventListener('click', sendOtp);
  ui.verifyOtpButton.addEventListener('click', verifyOtp);
  ui.resendOtpButton.addEventListener('click', sendOtp);
  ui.confirmBookingButton.addEventListener('click', confirmBooking);

  bookingForm.addEventListener('change', () => {
    if (state.otpVerifiedAt) {
      state.otpVerified = false;
      ui.confirmBookingButton.disabled = true;
      showAlert('Details changed. Please verify OTP again for security.', 'warning');
    }
  });

  buildCalendarDays();
  loadAvailability();
})();
