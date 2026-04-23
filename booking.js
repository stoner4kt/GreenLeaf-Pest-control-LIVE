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
    bookedTimesByDate: {}
  };

  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) return;

  const ui = {
    alert: document.getElementById('bookingAlert'),
    calendarDays: document.getElementById('calendarDays'),
    timeSlots: document.getElementById('timeSlots'),
    bookingDate: document.getElementById('booking_date'),
    bookingTime: document.getElementById('booking_time'),
    submitBookingButton: document.getElementById('submitBookingButton')
  };

  if (!ui.alert || !ui.calendarDays || !ui.timeSlots || !ui.bookingDate || !ui.bookingTime || !ui.submitBookingButton) {
    console.error('Booking form is missing required UI elements.');
    return;
  }

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

  async function submitBookingForVerification() {
    clearAlert();
    if (!validateFormBasics()) return;

    ui.submitBookingButton.disabled = true;
    try {
      const payload = getPayload();
      await callEdgeFunction('send-otp', payload);
      window.location.href = '/thank-you.html?status=verification-sent';
    } catch (error) {
      showAlert(`Could not submit booking: ${error.message}`, 'error');
    } finally {
      ui.submitBookingButton.disabled = false;
    }
  }

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitBookingForVerification();
  });

  buildCalendarDays();
  loadAvailability();
})();
